from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    hair_type: Optional[str] = None

class UserResponse(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None
    hair_type: Optional[str] = None
    is_admin: bool = False

    model_config = {"from_attributes": True}

    @classmethod
    def from_mongo(cls, user):
        return cls(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            hair_type=user.hair_type,
            is_admin=user.is_admin,
        )