from pywebpush import webpush, WebPushException
from app.core.config import settings
import json


async def send_push_notification(subscription: dict, title: str, body: str, url: str = "/feed"):
    """Send a single push notification to one subscription."""
    try:
        webpush(
            subscription_info={
                "endpoint": subscription["endpoint"],
                "keys": {
                    "p256dh": subscription["p256dh"],
                    "auth": subscription["auth"],
                },
            },
            data=json.dumps({
                "title": title,
                "body": body,
                "url": url,
                "icon": "/favicon.png",
            }),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_EMAIL},
        )
    except WebPushException:
        pass  # Subscription may be expired — silently ignore