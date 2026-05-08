from beanie import Document, Indexed, Link
from typing import Optional, List
from datetime import datetime
from pydantic import Field
from app.models.user import User

class Post(Document):
    user: Link[User]
    type: str # "TEXT", "IMAGE", "VIDEO"
    media_url: Optional[str] = None
    caption: Optional[str] = None
    hashtags: List[Indexed(str)] = []
    hair_type: Optional[Indexed(str)] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "posts"
