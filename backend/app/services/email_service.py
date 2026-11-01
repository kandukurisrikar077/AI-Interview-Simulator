import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Bounded SMTP network timeout (in seconds) to avoid hanging user registration
SMTP_TIMEOUT_SECONDS = 5.0

def send_otp_email(to_email: str, otp_code: str, purpose: str = "signup") -> bool:
    """
    Sends a 6-digit verification code to the target email using SMTP.
    - In production: Requires complete, functional SMTP configuration with bounded 5.0s timeout.
      Returns False if SMTP is unconfigured or connection fails (never prints OTP in production logs).
    - In development: If SMTP is unconfigured, prints the OTP to console for local testing and returns True.
    """
    is_production = settings.ENVIRONMENT.lower() in {"production", "prod"}
    
    # Check if SMTP settings are fully configured
    smtp_configured = all([
        settings.SMTP_HOST,
        settings.SMTP_PORT,
        settings.SMTP_USERNAME,
        settings.SMTP_PASSWORD,
        settings.SMTP_FROM_EMAIL
    ])

    if not smtp_configured:
        if is_production:
            logger.error("Production email delivery aborted: SMTP configuration is missing or incomplete.")
            return False
        else:
            logger.warning(f"Development mode: SMTP is unconfigured. Simulating email dispatch to {to_email}.")
            print(f"\n[DEV AUTH NOTICE] SMTP is unconfigured. Generated OTP for {to_email} ({purpose}): {otp_code} (Fallback dev code: 123456)\n")
            return True

    if purpose == "reset_password":
        subject = "IntervueAI - Password Reset Verification Code"
        purpose_label = "reset your password"
        valid_duration = "10 minutes"
    elif purpose == "login":
        subject = "IntervueAI - Sign-In Verification Code"
        purpose_label = "sign in to your IntervueAI account"
        valid_duration = "5 minutes"
    else:
        subject = "IntervueAI - Candidate Verification Code"
        purpose_label = "verify your candidate account"
        valid_duration = "15 minutes"

    text_content = f"Your IntervueAI verification code is: {otp_code}\nThis code is valid for {valid_duration}."
    
    html_content = f"""
    <html>
      <body style="font-family: sans-serif; background-color: #050816; color: #ffffff; padding: 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          <h2 style="color: #a855f7; margin-bottom: 10px; font-weight: 800; font-size: 24px;">IntervueAI</h2>
          <p style="color: #9ca3af; font-size: 14px;">Use the following 6-digit verification code to {purpose_label}:</p>
          <div style="background-color: rgba(168,85,247,0.1); border: 1px dashed rgba(168,85,247,0.3); border-radius: 8px; display: inline-block; padding: 15px 30px; margin: 20px 0; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #c084fc;">
            {otp_code}
          </div>
          <p style="color: #6b7280; font-size: 11px; margin-top: 20px;">This code is valid for {valid_duration}. If you did not request this code, please ignore this email.</p>
        </div>
      </body>
    </html>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)
        
        # Connect to SMTP server with bounded timeout to prevent request hanging
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS)
            server.starttls()
            
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        logger.info(f"Verification email dispatched successfully to recipient.")
        return True
    except Exception as exc:
        logger.error(f"Failed to dispatch SMTP email: {type(exc).__name__}")
        return False
