from beanie import Document
from datetime import datetime
from pydantic import Field


class PushSubscription(Document):
    user_id: str
    endpoint: str
    p256dh: str
    auth: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "push_subscriptions"