import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Sends a 6-digit verification code to the target email using SMTP.
    If SMTP settings are not configured, prints the OTP to console and returns True for local development.
    """
    subject = "IntervueAI - Candidate Login Verification Code"
    
    text_content = f"Your IntervueAI login verification code is: {otp_code}\nThis code is valid for 5 minutes."
    
    html_content = f"""
    <html>
      <body style="font-family: sans-serif; background-color: #050816; color: #ffffff; padding: 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          <h2 style="color: #a855f7; margin-bottom: 10px; font-weight: 800; font-size: 24px;">IntervueAI</h2>
          <p style="color: #9ca3af; font-size: 14px;">Use the following 6-digit verification code to complete your login session:</p>
          <div style="background-color: rgba(168,85,247,0.1); border: 1px dashed rgba(168,85,247,0.3); border-radius: 8px; display: inline-block; padding: 15px 30px; margin: 20px 0; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #c084fc;">
            {otp_code}
          </div>
          <p style="color: #6b7280; font-size: 11px; margin-top: 20px;">This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      </body>
    </html>
    """

    # Check if SMTP settings are configured
    if not all([settings.SMTP_HOST, settings.SMTP_PORT, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.SMTP_FROM_EMAIL]):
        if settings.SMTP_HOST == "mock":
            logger.info("Mock testing mode: email dispatch simulated successfully.")
            return True
        logger.error("SMTP configuration is incomplete.")
        raise ValueError("Email service is not configured")

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)
        
        # Connect to SMTP server
        # For secure connections, check port
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()  # Upgrade connection to secure TLS
            
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        logger.info(f"OTP successfully sent to {to_email}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send SMTP email to {to_email}: {exc}")
        raise RuntimeError("Unable to send verification email")
