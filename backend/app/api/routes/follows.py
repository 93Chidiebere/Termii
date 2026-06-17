from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from beanie import Document
from datetime import datetime
from pydantic import Field
from app.models.user import User
from app.api.routes.auth import get_current_user

router = APIRouter()


class Follow(Document):
    follower_id: str
    following_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "follows"


class FollowResponse(BaseModel):
    following: bool
    followers_count: int
    following_count: int


class UserPublicResponse(BaseModel):
    id: str
    full_name: str
    email: str
    hair_type: str | None = None
    avatar_url: str | None = None
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False


# ── POST /follows/{user_id} — toggle follow ───────────────────────────────────
@router.post("/{user_id}", response_model=FollowResponse)
async def toggle_follow(
    user_id: str,
    current_user: User = Depends(get_current_user),
):
    if user_id == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = await User.get(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    follower_id = str(current_user.id)
    existing = await Follow.find_one(
        Follow.follower_id == follower_id,
        Follow.following_id == user_id,
    )

    if existing:
        await existing.delete()
        following = False
    else:
        await Follow(follower_id=follower_id, following_id=user_id).insert()
        following = True

    followers_count = await Follow.find(Follow.following_id == user_id).count()
    following_count = await Follow.find(Follow.follower_id == follower_id).count()

    return FollowResponse(
        following=following,
        followers_count=followers_count,
        following_count=following_count,
    )


# ── GET /follows/{user_id}/status — check if following ───────────────────────
@router.get("/{user_id}/status")
async def get_follow_status(
    user_id: str,
    current_user: User = Depends(get_current_user),
):
    follower_id = str(current_user.id)
    existing = await Follow.find_one(
        Follow.follower_id == follower_id,
        Follow.following_id == user_id,
    )
    followers_count = await Follow.find(Follow.following_id == user_id).count()
    following_count = await Follow.find(Follow.follower_id == follower_id).count()
    return {
        "following": existing is not None,
        "followers_count": followers_count,
        "following_count": following_count,
    }


# ── GET /follows/my/following — list all users I follow ──────────────────────
@router.get("/my/following")
async def get_my_following(current_user: User = Depends(get_current_user)):
    follows = await Follow.find(
        Follow.follower_id == str(current_user.id)
    ).to_list()
    return {"following_ids": [f.following_id for f in follows]}


# ── GET /follows/{user_id}/profile — public profile with follow counts ────────
@router.get("/{user_id}/profile", response_model=UserPublicResponse)
async def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
):
    target = await User.get(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    followers_count = await Follow.find(Follow.following_id == user_id).count()
    following_count = await Follow.find(Follow.follower_id == user_id).count()
    is_following = await Follow.find_one(
        Follow.follower_id == str(current_user.id),
        Follow.following_id == user_id,
    ) is not None

    return UserPublicResponse(
        id=str(target.id),
        full_name=target.full_name,
        email=target.email,
        hair_type=target.hair_type,
        avatar_url=target.avatar_url,
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following,
    )