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


# ── Comment model ─────────────────────────────────────────────────────────────
class PostComment(Document):
    post_id: str
    user_id: str
    user_name: str
    text: str
    parent_comment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "post_comments"


# ── Schemas ───────────────────────────────────────────────────────────────────
class PostCreate(BaseModel):
    caption: str
    hair_type: Optional[str] = None
    tags: Optional[List[str]] = []
    media_url: Optional[str] = None
    media_type: Optional[str] = None


class CommentCreate(BaseModel):
    text: str
    parent_comment_id: Optional[str] = None


class CommentResponse(BaseModel):
    id: str
    post_id: str
    user_id: str
    user_name: str
    text: str
    parent_comment_id: Optional[str] = None
    created_at: str


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
    comments_count: int = 0
    is_liked: bool = False
    is_saved: bool = False

    model_config = {"from_attributes": True}


# ── Helper ────────────────────────────────────────────────────────────────────
async def build_post_response(post: Post, user: User, current_user_id: str) -> PostResponse:
    post_id = str(post.id)
    likes_count = await PostLike.find(PostLike.post_id == post_id).count()
    saves_count = await PostSave.find(PostSave.post_id == post_id).count()
    comments_count = await PostComment.find(PostComment.post_id == post_id).count()
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
        comments_count=comments_count,
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

    if post_in.media_url and post_in.media_url.startswith("data:"):
        raise HTTPException(
            status_code=400,
            detail="Raw image/video data is not allowed. Please upload media to get a hosted URL first."
        )

    if post_in.media_url and not post_in.media_url.startswith("https://"):
        raise HTTPException(
            status_code=400,
            detail="Media URL must be a valid hosted https:// URL."
        )

    post = Post(
        user=current_user,
        type=post_in.media_type.upper() if post_in.media_type else "TEXT",
        media_url=post_in.media_url,
        caption=post_in.caption,
        hashtags=post_in.tags or [],
        hair_type=post_in.hair_type,
    )
    await post.insert()

    # Send push notifications to followers
    try:
        from app.models.push_subscription import PushSubscription
        from app.services.push_notifications import send_push_notification
        from app.api.routes.follows import Follow
        import asyncio

        # Get all followers of the poster
        followers = await Follow.find(
            Follow.following_id == str(current_user.id)
        ).to_list()

        follower_ids = [f.follower_id for f in followers]

        if follower_ids:
            # Get their push subscriptions
            subscriptions = await PushSubscription.find(
                {"user_id": {"$in": follower_ids}}
            ).to_list()

            # Send to all concurrently
            if subscriptions:
                await asyncio.gather(*[
                    send_push_notification(
                        subscription={
                            "endpoint": s.endpoint,
                            "p256dh": s.p256dh,
                            "auth": s.auth,
                        },
                        title=f"{current_user.full_name} just posted",
                        body=post.caption[:80] + ("..." if len(post.caption) > 80 else ""),
                        url=f"/post/{str(post.id)}",
                    )
                    for s in subscriptions
                ])
    except Exception:
        pass  # Never let push notification failure break post creation
    
    return await build_post_response(post, current_user, str(current_user.id))


# ── GET /posts/ — fetch all posts (feed) — public ────────────────────────────
@router.get("/", response_model=List[PostResponse])
async def get_posts():
    posts = await Post.find_all().sort(-Post.created_at).to_list()
    result = []
    for post in posts:
        await post.fetch_link(Post.user)
        user = post.user
        if hasattr(user, "id"):
            result.append(await build_post_response(post, user, ""))
    return result


# ── GET /posts/my — fetch current user's posts ───────────────────────────────
@router.get("/my", response_model=List[PostResponse])
async def get_my_posts(current_user: User = Depends(get_current_user)):
    posts = await Post.find(
        Post.user.id == current_user.id  # type: ignore
    ).sort(-Post.created_at).to_list()
    result = []
    for post in posts:
        result.append(await build_post_response(post, current_user, str(current_user.id)))
    return result


# ── GET /posts/saved — fetch current user's saved posts ──────────────────────
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


# ── GET /posts/{post_id} — fetch single post ─────────────────────────────────
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


# ── POST /posts/{post_id}/like — toggle like ─────────────────────────────────
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

        try:
            await post.fetch_link(Post.user)
            post_owner = post.user
            if hasattr(post_owner, "id") and str(post_owner.id) != str(current_user.id):
                from app.services.chat_manager import chat_manager
                import json
                payload = json.dumps({
                    "type": "notification",
                    "notification_type": "like",
                    "title": current_user.full_name,
                    "text": "liked your post",
                    "link": f"/post/{post_id}",
                    "sender_id": str(current_user.id),
                    "sender_name": current_user.full_name,
                })
                await chat_manager.send_personal_message(payload, str(post_owner.id))
        except Exception:
            pass

    likes_count = await PostLike.find(PostLike.post_id == post_id).count()
    return {"liked": liked, "likes_count": likes_count}


# ── POST /posts/{post_id}/save — toggle save ─────────────────────────────────
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


# ── GET /posts/{post_id}/comments — fetch comments ───────────────────────────
@router.get("/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str):
    comments = await PostComment.find(
        PostComment.post_id == post_id
    ).sort(PostComment.created_at).to_list()
    return [
        CommentResponse(
            id=str(c.id),
            post_id=c.post_id,
            user_id=c.user_id,
            user_name=c.user_name,
            text=c.text,
            parent_comment_id=c.parent_comment_id,
            created_at=c.created_at.isoformat(),
        )
        for c in comments
    ]


# ── POST /posts/{post_id}/comments — add a comment (or reply) ────────────────
@router.post("/{post_id}/comments", response_model=CommentResponse)
async def add_comment(
    post_id: str,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
):
    post = await Post.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if not comment_in.text.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    # If this is a reply, verify the parent comment exists and belongs to this post
    if comment_in.parent_comment_id:
        parent = await PostComment.get(comment_in.parent_comment_id)
        if not parent or parent.post_id != post_id:
            raise HTTPException(status_code=404, detail="Parent comment not found")

    comment = PostComment(
        post_id=post_id,
        user_id=str(current_user.id),
        user_name=current_user.full_name,
        text=comment_in.text.strip(),
        parent_comment_id=comment_in.parent_comment_id,
    )
    await comment.insert()

    try:
        await post.fetch_link(Post.user)
        post_owner = post.user
        if hasattr(post_owner, "id") and str(post_owner.id) != str(current_user.id):
            from app.services.chat_manager import chat_manager
            import json
            payload = json.dumps({
                "type": "notification",
                "notification_type": "comment",
                "title": current_user.full_name,
                "text": f'commented: "{comment_in.text.strip()[:40]}"',
                "link": f"/post/{post_id}",
                "sender_id": str(current_user.id),
                "sender_name": current_user.full_name,
            })
            await chat_manager.send_personal_message(payload, str(post_owner.id))
    except Exception:
        pass

    return CommentResponse(
        id=str(comment.id),
        post_id=comment.post_id,
        user_id=comment.user_id,
        user_name=comment.user_name,
        text=comment.text,
        parent_comment_id=comment.parent_comment_id,
        created_at=comment.created_at.isoformat(),
    )