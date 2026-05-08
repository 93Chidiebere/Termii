from beanie import Document, Indexed
from typing import Optional
from datetime import datetime
from pydantic import Field

class User(Document):
    email: Indexed(str, unique=True)
    hashed_password: Optional[str] = None
    google_id: Optional[Indexed(str)] = None
    full_name: str
    avatar_url: Optional[str] = None
    hair_type: Optional[Indexed(str)] = None
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
