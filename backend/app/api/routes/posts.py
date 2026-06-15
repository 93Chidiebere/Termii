from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.models.post import Post
from app.models.user import User
from app.api.routes.auth import get_current_user
from beanie import Document
from datetime import datetime
from pydantic import Field

router = APIRouter()


# ── Like model ────────────────────────────────────────────────────────────────
class PostLike(Document):
    post_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "post_likes"


# ── Save model ────────────────────────────────────────────────────────────────
class PostSave(Document):
    post_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "post_saves"


# ── Schemas ───────────────────────────────────────────────────────────────────
class PostCreate(BaseModel):
    caption: str
    hair_type: Optional[str] = None
    tags: Optional[List[str]] = []
    media_url: Optional[str] = None
    media_type: Optional[str] = None


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
    likes_count: int = 0
    saves_count: int = 0
    is_liked: bool = False
    is_saved: bool = False

    model_config = {"from_attributes": True}


# ── Helper ────────────────────────────────────────────────────────────────────
async def build_post_response(post: Post, user: User, current_user_id: str) -> PostResponse:
    post_id = str(post.id)
    likes_count = await PostLike.find(PostLike.post_id == post_id).count()
    saves_count = await PostSave.find(PostSave.post_id == post_id).count()
    is_liked = await PostLike.find_one(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user_id
    ) is not None
    is_saved = await PostSave.find_one(
        PostSave.post_id == post_id,
        PostSave.user_id == current_user_id
    ) is not None

    return PostResponse(
        id=post_id,
        caption=post.caption,
        hair_type=post.hair_type,
        tags=post.hashtags,
        media_url=post.media_url,
        media_type=post.type.lower() if post.type != "TEXT" else None,
        user_id=str(user.id) if hasattr(user, "id") else "",
        user_name=user.full_name if hasattr(user, "full_name") else "Unknown",
        created_at=post.created_at.isoformat(),
        likes_count=likes_count,
        saves_count=saves_count,
        is_liked=is_liked,
        is_saved=is_saved,
    )


# ── POST /posts/ — create a new post ─────────────────────────────────────────
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
    return await build_post_response(post, current_user, str(current_user.id))


# ── GET /posts/ — fetch all posts (feed) — public ────────────────────────────
@router.get("/", response_model=List[PostResponse])
async def get_posts():
    posts = await Post.find_all().to_list()
    result = []
    for post in posts:
        await post.fetch_link(Post.user)
        user = post.user
        if hasattr(user, "id"):
            result.append(await build_post_response(post, user, ""))
    return result


# ── GET /posts/my — fetch current user's posts ────────────────────────────────
@router.get("/my", response_model=List[PostResponse])
async def get_my_posts(current_user: User = Depends(get_current_user)):
    posts = await Post.find(
        Post.user.id == current_user.id  # type: ignore
    ).sort(-Post.created_at).to_list()
    result = []
    for post in posts:
        result.append(await build_post_response(post, current_user, str(current_user.id)))
    return result


# ── GET /posts/saved — fetch current user's saved posts ───────────────────────
@router.get("/saved", response_model=List[PostResponse])
async def get_saved_posts(current_user: User = Depends(get_current_user)):
    saves = await PostSave.find(
        PostSave.user_id == str(current_user.id)
    ).to_list()
    result = []
    for save in saves:
        post = await Post.get(save.post_id)
        if post:
            await post.fetch_link(Post.user)
            user = post.user
            if hasattr(user, "id"):
                result.append(await build_post_response(post, user, str(current_user.id)))
    return result


# ── GET /posts/{id} — fetch single post ───────────────────────────────────────
@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str):
    post = await Post.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await post.fetch_link(Post.user)
    user = post.user
    if not hasattr(user, "id"):
        raise HTTPException(status_code=404, detail="Post user not found")
    return await build_post_response(post, user, "")


# ── POST /posts/{id}/like — toggle like ───────────────────────────────────────
@router.post("/{post_id}/like")
async def toggle_like(
    post_id: str,
    current_user: User = Depends(get_current_user),
):
    post = await Post.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    user_id = str(current_user.id)
    existing = await PostLike.find_one(
        PostLike.post_id == post_id,
        PostLike.user_id == user_id
    )

    if existing:
        await existing.delete()
        liked = False
    else:
        await PostLike(post_id=post_id, user_id=user_id).insert()
        liked = True

    likes_count = await PostLike.find(PostLike.post_id == post_id).count()
    return {"liked": liked, "likes_count": likes_count}


# ── POST /posts/{id}/save — toggle save ───────────────────────────────────────
@router.post("/{post_id}/save")
async def toggle_save(
    post_id: str,
    current_user: User = Depends(get_current_user),
):
    post = await Post.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    user_id = str(current_user.id)
    existing = await PostSave.find_one(
        PostSave.post_id == post_id,
        PostSave.user_id == user_id
    )

    if existing:
        await existing.delete()
        saved = False
    else:
        await PostSave(post_id=post_id, user_id=user_id).insert()
        saved = True

    saves_count = await PostSave.find(PostSave.post_id == post_id).count()
    return {"saved": saved, "saves_count": saves_count}