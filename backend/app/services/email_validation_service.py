"""
Email Validation Service for IntervueAI
Provides free, multi-tier email validation before OTP generation:
  1. RFC-compliant syntax check and normalization using email-validator
  2. Disposable email domain detection via a local blocklist
  3. DNS domain existence (NXDOMAIN detection)
  4. Mail exchange (MX) record deliverability check with bounded 3.0s DNS timeout
  5. Fail-open behavior for inconclusive DNS/network timeouts so legitimate users are never blocked

Note: DNS and MX checks verify that a domain exists and accepts mail;
they do not guarantee individual mailbox existence. OTP verification
remains the final proof of inbox access.
"""

from dataclasses import dataclass
from typing import Optional, Set
import logging
import dns.resolver
import dns.exception
from email_validator import (
    validate_email,
    EmailNotValidError,
    EmailSyntaxError,
    EmailUndeliverableError
)

logger = logging.getLogger(__name__)

# Bounded DNS resolution timeout in seconds
DNS_TIMEOUT_SECONDS = 3.0

# Curated local blocklist of known disposable/temporary/throwaway email domains
DISPOSABLE_EMAIL_DOMAINS: Set[str] = {
    # Popular disposable email services
    "10minutemail.com",
    "10minutemail.net",
    "burnermail.io",
    "crazymailing.com",
    "disposablemail.com",
    "dispostable.com",
    "dropmail.me",
    "emailondeck.com",
    "fakemail.net",
    "fakemailgenerator.com",
    "generator.email",
    "getairmail.com",
    "getnada.com",
    "grr.la",
    "guerrillamail.biz",
    "guerrillamail.block",
    "guerrillamail.com",
    "guerrillamail.de",
    "guerrillamail.info",
    "guerrillamail.net",
    "guerrillamail.org",
    "guerrillamailblock.com",
    "harakirimail.com",
    "inboxkitten.com",
    "internxt.com",
    "luxusmail.org",
    "maildrop.cc",
    "maildrop.cf",
    "mailinator.com",
    "mailnesia.com",
    "mohmal.com",
    "mytemp.email",
    "mytempemail.com",
    "nada.ltd",
    "sharklasers.com",
    "tempail.com",
    "tempinbox.com",
    "tempmail.com",
    "tempmail.net",
    "temp-mail.org",
    "tempmailaddress.com",
    "throwawaymail.com",
    "trashmail.com",
    "trashmail.me",
    "trashmail.net",
    "yopmail.com",
    "yopmail.fr",
    "yopmail.net",
}


@dataclass
class EmailValidationResult:
    """Represents the outcome of email validation."""
    is_valid: bool
    error_message: Optional[str] = None
    normalized_email: str = ""
    domain: Optional[str] = None

    def __iter__(self):
        """Allows unpacking as (is_valid, error_message, normalized_email)."""
        return iter((self.is_valid, self.error_message, self.normalized_email))


def is_disposable_domain(domain: str) -> bool:
    """
    Checks if a domain or its parent domain matches the disposable domain blocklist.
    """
    if not domain:
        return False
    domain_clean = domain.strip().lower()
    if domain_clean in DISPOSABLE_EMAIL_DOMAINS:
        return True

    # Check for subdomains of disposable providers (e.g. user@xyz.mailinator.com)
    parts = domain_clean.split(".")
    for i in range(1, len(parts) - 1):
        parent_domain = ".".join(parts[i:])
        if parent_domain in DISPOSABLE_EMAIL_DOMAINS:
            return True

    return False


def validate_email_address(email: str, check_dns: bool = True) -> EmailValidationResult:
    """
    Validates an email address against syntax, disposable blocklist, domain existence,
    and MX deliverability.

    Args:
        email: Raw email address string.
        check_dns: Whether to perform DNS/MX record deliverability checks (default True).

    Returns:
        EmailValidationResult containing validity, error message (if invalid),
        normalized email string, and extracted domain.
    """
    if not email or not isinstance(email, str):
        return EmailValidationResult(
            is_valid=False,
            error_message="Please enter a valid email address.",
            normalized_email="",
            domain=None
        )

    email_clean = email.strip()

    # 1. Syntax Check & Normalization
    try:
        validated = validate_email(email_clean, check_deliverability=False)
        normalized = validated.normalized
        domain = validated.domain.lower()
    except EmailSyntaxError:
        return EmailValidationResult(
            is_valid=False,
            error_message="Please enter a valid email address format.",
            normalized_email=email_clean,
            domain=None
        )
    except EmailNotValidError:
        return EmailValidationResult(
            is_valid=False,
            error_message="Please enter a valid email address.",
            normalized_email=email_clean,
            domain=None
        )

    # 2. Disposable Email Domain Check
    if is_disposable_domain(domain):
        return EmailValidationResult(
            is_valid=False,
            error_message="Disposable or temporary email addresses are not allowed. Please use a personal or business email.",
            normalized_email=normalized,
            domain=domain
        )

    # 3. Domain Existence & MX Deliverability Check
    if check_dns:
        try:
            resolver = dns.resolver.Resolver()
            resolver.lifetime = DNS_TIMEOUT_SECONDS
            resolver.timeout = max(1.0, DNS_TIMEOUT_SECONDS - 1.0)

            # validate_email checks NXDOMAIN, MX records, and RFC 5321 A/AAAA fallbacks
            validate_email(normalized, check_deliverability=True, dns_resolver=resolver)

        except EmailUndeliverableError as e:
            err_str = str(e).lower()
            if "does not exist" in err_str:
                return EmailValidationResult(
                    is_valid=False,
                    error_message=f"The email domain '{domain}' does not exist.",
                    normalized_email=normalized,
                    domain=domain
                )
            elif "does not accept email" in err_str or "does not send email" in err_str:
                return EmailValidationResult(
                    is_valid=False,
                    error_message=f"The email domain '{domain}' does not accept email.",
                    normalized_email=normalized,
                    domain=domain
                )
            elif "timeout" in err_str or "nameserver" in err_str or "temporary" in err_str:
                # Inconclusive network/DNS failure -> Fail OPEN
                logger.warning(
                    f"DNS deliverability check inconclusive for {normalized} ({e}). "
                    "Failing open to OTP verification."
                )
                return EmailValidationResult(
                    is_valid=True,
                    error_message=None,
                    normalized_email=normalized,
                    domain=domain
                )
            else:
                return EmailValidationResult(
                    is_valid=False,
                    error_message=f"The email domain '{domain}' cannot receive email.",
                    normalized_email=normalized,
                    domain=domain
                )

        except (dns.exception.Timeout, dns.resolver.NoNameservers) as dns_err:
            # Inconclusive DNS timeouts or nameserver errors -> Fail OPEN
            logger.warning(
                f"DNS resolution inconclusive for {normalized} ({type(dns_err).__name__}). "
                "Failing open to OTP verification."
            )
            return EmailValidationResult(
                is_valid=True,
                error_message=None,
                normalized_email=normalized,
                domain=domain
            )

        except dns.resolver.NXDOMAIN:
            return EmailValidationResult(
                is_valid=False,
                error_message=f"The email domain '{domain}' does not exist.",
                normalized_email=normalized,
                domain=domain
            )

        except Exception as exc:
            # Any other inconclusive DNS error -> Fail OPEN
            logger.warning(
                f"Unexpected error during DNS validation for {normalized} ({exc}). "
                "Failing open to OTP verification."
            )
            return EmailValidationResult(
                is_valid=True,
                error_message=None,
                normalized_email=normalized,
                domain=domain
            )

    return EmailValidationResult(
        is_valid=True,
        error_message=None,
        normalized_email=normalized,
        domain=domain
    )
