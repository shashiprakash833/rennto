import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def send_account_deletion_email(data):
    """
    Sends account deletion email notification to admin or logs the deletion request.
    """
    phone = data.get("phone") or data.get("email") or "N/A"
    reason = data.get("reason") or "User requested account deletion."
    
    subject = f"Account Deletion Request - {phone}"
    message = f"Account Deletion Request received for user/phone: {phone}\nReason: {reason}"
    
    try:
        if getattr(settings, "DEFAULT_FROM_EMAIL", None):
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[getattr(settings, "ADMIN_EMAIL", "support@rennto.in")],
                fail_silently=True,
            )
    except Exception as e:
        logger.error(f"Error sending account deletion email: {e}")

    logger.info(f"Account deletion requested for {phone}")
    return True
