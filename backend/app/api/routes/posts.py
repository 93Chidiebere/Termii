from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.models.post import Post
from app.models.user import User
from app.api.routes.auth import get_current_user

router = APIRouter()

# ── Schema for creating a post ────────────────────────────────────────────────
class PostCreate(BaseModel):
    caption: str
    hair_type: Optional[str] = None
    tags: Optional[List[str]] = []
    media_url: Optional[str] = None
    media_type: Optional[str] = None  # "image" or "video"

# ── Schema for returning a post ───────────────────────────────────────────────
class PostResponse(BaseModel):
    id: str
    caption: str
    hair_type: Optional[str] = None
    tags: List[str] = []
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    user_id: str
    user_name: str
    created_at: str

    model_config = {"from_attributes": True}


# ── POST /posts — create a new post ──────────────────────────────────────────
@router.post("/", response_model=PostResponse)
async def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
):
    if not post_in.caption.strip():
        raise HTTPException(status_code=400, detail="Caption cannot be empty")

    post = Post(
        user=current_user,
        type=post_in.media_type.upper() if post_in.media_type else "TEXT",
        media_url=post_in.media_url,
        caption=post_in.caption,
        hashtags=post_in.tags or [],
        hair_type=post_in.hair_type,
    )
    await post.insert()

    return PostResponse(
        id=str(post.id),
        caption=post.caption,
        hair_type=post.hair_type,
        tags=post.hashtags,
        media_url=post.media_url,
        media_type=post_in.media_type,
        user_id=str(current_user.id),
        user_name=current_user.full_name,
        created_at=post.created_at.isoformat(),
    )

# ── GET /posts — fetch all posts (feed) — public ──────────────────────────────
@router.get("/", response_model=List[PostResponse])
async def get_posts():
    posts = await Post.find_all().to_list()
    result = []
    for post in posts:
        await post.fetch_link(Post.user)
        user = post.user
        result.append(PostResponse(
            id=str(post.id),
            caption=post.caption,
            hair_type=post.hair_type,
            tags=post.hashtags,
            media_url=post.media_url,
            media_type=post.type.lower() if post.type != "TEXT" else None,
            user_id=str(user.id) if hasattr(user, "id") else "",
            user_name=user.full_name if hasattr(user, "full_name") else "Unknown",
            created_at=post.created_at.isoformat(),
        ))
    return result