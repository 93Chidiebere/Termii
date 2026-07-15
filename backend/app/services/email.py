import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger("app.email")

def send_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Sends a password reset email using SMTP configuration.
    If SMTP_HOST is not configured, logs the reset link to the console for development.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning(
            f"SMTP is not configured. Reset link for {to_email} logged here:\n"
            f"Reset Link: {reset_link}"
        )
        print("\n" + "="*80)
        print(f"DEVELOPMENT MODE: PASSWORD RESET EMAIL FOR {to_email}")
        print(f"Reset Link: {reset_link}")
        print("="*80 + "\n")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_SENDER
        msg['To'] = to_email
        msg['Subject'] = "Reset Your Password - Isi Ngala"

        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #8B4513; margin: 0; font-size: 24px;">Isi Ngala</h2>
                    <p style="color: #718096; font-size: 14px; text-transform: uppercase; margin: 5px 0 0 0;">Your Hair is Your Pride</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
                <p>Hello,</p>
                <p>We received a request to reset the password for your Isi Ngala account. Click the button below to reset it:</p>
                <p style="margin: 30px 0; text-align: center;">
                    <a href="{reset_link}" style="background-color: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(139, 69, 19, 0.2);">Reset Password</a>
                </p>
                <p style="font-size: 13px; color: #718096;">
                    If you did not request a password reset, please ignore this email. This link will expire in 1 hour.
                </p>
                <p style="font-size: 13px; color: #718096; word-break: break-all;">
                    Or copy and paste this link into your browser: <br/>
                    <a href="{reset_link}" style="color: #8B4513;">{reset_link}</a>
                </p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 15px;" />
                <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">
                    © 2026 Isi Ngala. All rights reserved.
                </p>
            </body>
        </html>
        """
        msg.attach(MIMEText(html, 'html'))

        # Standard SMTP starttls flow
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_SENDER, to_email, msg.as_string())
        server.quit()
        logger.info(f"Password reset email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send reset email to {to_email}: {str(e)}")
        # Print reset link to console anyway to prevent blocking dev if SMTP fails
        print("\n" + "="*80)
        print(f"SMTP SEND ERROR: {str(e)}")
        print(f"FALLBACK PASSWORD RESET EMAIL FOR {to_email}")
        print(f"Reset Link: {reset_link}")
        print("="*80 + "\n")
        return False
