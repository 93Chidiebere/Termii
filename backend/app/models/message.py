from beanie import Document, Link, Indexed
from datetime import datetime
from pydantic import Field
from app.models.user import User

class Message(Document):
    sender: Link[User]
    receiver: Link[User]
    content: str
    is_read: bool = False
    created_at: Indexed(datetime) = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "messages"
