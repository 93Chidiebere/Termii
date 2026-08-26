from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.models.post import Post
from app.models.user import User
from app.api.routes.auth import get_current_user
from beanie import Document
from datetime import datetime
from pydantic import Field
import re
import asyncio
import json

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


# ── Comment Like model ────────────────────────────────────────────────────────
class CommentLike(Document):
    comment_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "comment_likes"


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
    likes_count: int = 0
    is_liked: bool = False


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


# ── Helpers ───────────────────────────────────────────────────────────────────
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


async def build_posts_responses_batch(
    posts: List[Post], current_user_id: Optional[str] = None
) -> List[PostResponse]:
    if not posts:
        return []

    post_ids = [str(p.id) for p in posts]

    all_likes = await PostLike.find({"post_id": {"$in": post_ids}}).to_list()
    all_saves = await PostSave.find({"post_id": {"$in": post_ids}}).to_list()
    all_comments = await PostComment.find({"post_id": {"$in": post_ids}}).to_list()

    from collections import defaultdict
    likes_count_map = defaultdict(int)
    saves_count_map = defaultdict(int)
    comments_count_map = defaultdict(int)

    user_liked_posts = set()
    user_saved_posts = set()

    for like in all_likes:
        likes_count_map[like.post_id] += 1
        if current_user_id and like.user_id == current_user_id:
            user_liked_posts.add(like.post_id)

    for save in all_saves:
        saves_count_map[save.post_id] += 1
        if current_user_id and save.user_id == current_user_id:
            user_saved_posts.add(save.post_id)

    for comment in all_comments:
        comments_count_map[comment.post_id] += 1

    result = []
    for post in posts:
        post_id = str(post.id)
        user = post.user
        if not user or not hasattr(user, "id"):
            continue

        result.append(
            PostResponse(
                id=post_id,
                caption=post.caption,
                hair_type=post.hair_type,
                tags=post.hashtags,
                media_url=post.media_url,
                media_type=post.type.lower() if post.type != "TEXT" else None,
                user_id=str(user.id),
                user_name=user.full_name or "Unknown",
                created_at=post.created_at.isoformat(),
                likes_count=likes_count_map[post_id],
                saves_count=saves_count_map[post_id],
                comments_count=comments_count_map[post_id],
                is_liked=post_id in user_liked_posts,
                is_saved=post_id in user_saved_posts,
            )
        )
    return result


async def build_comment_response(
    comment: PostComment,
    current_user_id: str
) -> CommentResponse:
    comment_id = str(comment.id)
    likes_count = await CommentLike.find(
        CommentLike.comment_id == comment_id
    ).count()
    is_liked = await CommentLike.find_one(
        CommentLike.comment_id == comment_id,
        CommentLike.user_id == current_user_id
    ) is not None
    return CommentResponse(
        id=comment_id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        user_name=comment.user_name,
        text=comment.text,
        parent_comment_id=comment.parent_comment_id,
        created_at=comment.created_at.isoformat(),
        likes_count=likes_count,
        is_liked=is_liked,
    )


def extract_mentions(text: str) -> List[str]:
    """Extract @username mentions from text. Returns list of usernames."""
    return re.findall(r"@([\w.]+)", text)


async def send_push_to_all(
    title: str,
    body: str,
    url: str,
    exclude_user_id: str,
) -> None:
    """Send a push notification to every user who has a subscription, except the actor."""
    try:
        from app.models.push_subscription import PushSubscription
        from app.services.push_notifications import send_push_notification

        subscriptions = await PushSubscription.find(
            {"user_id": {"$ne": exclude_user_id}}
        ).to_list()

        if subscriptions:
            await asyncio.gather(*[
                send_push_notification(
                    subscription={
                        "endpoint": s.endpoint,
                        "p256dh": s.p256dh,
                        "auth": s.auth,
                    },
                    title=title,
                    body=body,
                    url=url,
                )
                for s in subscriptions
            ])
    except Exception:
        pass


async def send_push_to_user(
    user_id: str,
    title: str,
    body: str,
    url: str,
) -> None:
    """Send push notification to a specific user."""
    try:
        from app.models.push_subscription import PushSubscription
        from app.services.push_notifications import send_push_notification

        subscriptions = await PushSubscription.find(
            PushSubscription.user_id == user_id
        ).to_list()

        if subscriptions:
            await asyncio.gather(*[
                send_push_notification(
                    subscription={
                        "endpoint": s.endpoint,
                        "p256dh": s.p256dh,
                        "auth": s.auth,
                    },
                    title=title,
                    body=body,
                    url=url,
                )
                for s in subscriptions
            ])
    except Exception:
        pass


async def send_ws_notification(
    recipient_id: str,
    notification_type: str,
    title: str,
    text: str,
    link: str,
    sender_id: str,
    sender_name: str,
) -> None:
    """Send in-app WebSocket notification to a specific user."""
    try:
        from app.services.chat_manager import chat_manager
        payload = json.dumps({
            "type": "notification",
            "notification_type": notification_type,
            "title": title,
            "text": text,
            "link": link,
            "sender_id": sender_id,
            "sender_name": sender_name,
        })
        await chat_manager.send_personal_message(payload, recipient_id)
    except Exception:
        pass


# ── POST /posts/presign — generate presigned upload URL ──────────────────────
from app.services.s3 import create_presigned_post

class PresignRequest(BaseModel):
    filename: str
    file_type: str

@router.post("/presign")
async def get_presigned_upload(
    req: PresignRequest,
    current_user: User = Depends(get_current_user)
):
    import uuid
    from app.core.config import settings
    
    ext = req.filename.split(".")[-1] if "." in req.filename else "mp4"
    object_name = f"posts/{uuid.uuid4()}.{ext}"
    
    response = create_presigned_post(object_name, req.file_type)
    if not response:
        raise HTTPException(status_code=500, detail="Could not generate presigned upload URL")
        
    endpoint = settings.S3_ENDPOINT_URL.rstrip('/')
    public_url = f"{endpoint}/{settings.S3_BUCKET_NAME}/{object_name}"
    
    response["media_url"] = public_url
    return response


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

    post_id = str(post.id)
    actor_id = str(current_user.id)
    actor_name = current_user.full_name
    caption_preview = post.caption[:80] + ("..." if len(post.caption) > 80 else "")

    # ── Push & Email Broadcast to ALL users (excluding the poster) ──────────
    async def notify_all_users():
        # 1. Web Push Notification
        await send_push_to_all(
            title=f"{actor_name} just posted on Isi Ngala",
            body=caption_preview,
            url=f"/post/{post_id}",
            exclude_user_id=actor_id,
        )
        # 2. Email Notification Broadcast
        try:
            from app.services.email import send_new_post_email_broadcast
            other_users = await User.find({"_id": {"$ne": current_user.id}}).to_list()
            recipient_emails = [u.email for u in other_users if u.email]
            if recipient_emails:
                send_new_post_email_broadcast(
                    to_emails=recipient_emails,
                    author_name=actor_name,
                    caption=post.caption,
                    post_id=post_id,
                    media_url=post.media_url,
                )
        except Exception:
            pass

    asyncio.create_task(notify_all_users())

    # ── Handle @mentions in caption ───────────────────────────────────────
    mentioned_usernames = extract_mentions(post.caption)
    if mentioned_usernames:
        async def notify_mentions():
            for username in set(mentioned_usernames):
                mentioned_user = await User.find_one(User.username == username)
                if mentioned_user and str(mentioned_user.id) != actor_id:
                    mentioned_id = str(mentioned_user.id)
                    await asyncio.gather(
                        send_ws_notification(
                            recipient_id=mentioned_id,
                            notification_type="mention",
                            title=actor_name,
                            text=f"mentioned you in a post",
                            link=f"/post/{post_id}",
                            sender_id=actor_id,
                            sender_name=actor_name,
                        ),
                        send_push_to_user(
                            user_id=mentioned_id,
                            title=f"{actor_name} mentioned you",
                            body=caption_preview,
                            url=f"/post/{post_id}",
                        ),
                    )
        asyncio.create_task(notify_mentions())

    return await build_post_response(post, current_user, actor_id)


# ── GET /posts/ — fetch all posts (feed) ─────────────────────────────────────
@router.get("/", response_model=List[PostResponse])
async def get_posts(current_user: User = Depends(get_current_user)):
    posts = await Post.find_all(fetch_links=True).sort(-Post.created_at).to_list()
    return await build_posts_responses_batch(posts, str(current_user.id))


# ── GET /posts/explore — fetch top posts for unauthenticated users ───────────
@router.get("/explore", response_model=List[PostResponse])
async def get_explore_posts():
    posts = await Post.find_all(fetch_links=True).to_list()
    responses = await build_posts_responses_batch(posts, None)
    responses.sort(key=lambda x: x.likes_count, reverse=True)
    return responses[:10]


# ── GET /posts/my ─────────────────────────────────────────────────────────────
@router.get("/my", response_model=List[PostResponse])
async def get_my_posts(current_user: User = Depends(get_current_user)):
    posts = await Post.find(
        Post.user.id == current_user.id,  # type: ignore
        fetch_links=True
    ).sort(-Post.created_at).to_list()
    return await build_posts_responses_batch(posts, str(current_user.id))


# ── GET /posts/saved ──────────────────────────────────────────────────────────
@router.get("/saved", response_model=List[PostResponse])
async def get_saved_posts(current_user: User = Depends(get_current_user)):
    saves = await PostSave.find(
        PostSave.user_id == str(current_user.id)
    ).to_list()
    if not saves:
        return []
        
    from beanie import PydanticObjectId
    post_ids = [s.post_id for s in saves]
    object_ids = []
    for pid in post_ids:
        try:
            object_ids.append(PydanticObjectId(pid))
        except Exception:
            pass

    posts = await Post.find(
        {"_id": {"$in": object_ids}},
        fetch_links=True
    ).to_list()
    
    return await build_posts_responses_batch(posts, str(current_user.id))


# ── GET /posts/{post_id} ──────────────────────────────────────────────────────
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


# ── GET /posts/{post_id}/likes ───────────────────────────────────────────────
@router.get("/{post_id}/likes")
async def get_post_likes(
    post_id: str,
    current_user: User = Depends(get_current_user),
):
    likes = await PostLike.find(PostLike.post_id == post_id).to_list()
    if not likes:
        return []

    from beanie import PydanticObjectId
    user_ids = [like.user_id for like in likes]
    object_ids = []
    for uid in user_ids:
        try:
            object_ids.append(PydanticObjectId(uid))
        except Exception:
            pass

    users = await User.find({"_id": {"$in": object_ids}}).to_list()
    
    result = []
    for u in users:
        result.append({
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "username": u.username,
            "avatar_url": u.avatar_url,
            "hair_type": u.hair_type
        })
    return result


# ── POST /posts/{post_id}/like — toggle post like ────────────────────────────
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
            if hasattr(post_owner, "id") and str(post_owner.id) != user_id:
                owner_id = str(post_owner.id)
                caption_preview = post.caption[:40] + ("..." if len(post.caption) > 40 else "")
                # In-app WS notification
                await send_ws_notification(
                    recipient_id=owner_id,
                    notification_type="like",
                    title=current_user.full_name,
                    text="liked your post",
                    link=f"/post/{post_id}",
                    sender_id=user_id,
                    sender_name=current_user.full_name,
                )
                # Push notification
                asyncio.create_task(send_push_to_user(
                    user_id=owner_id,
                    title=f"{current_user.full_name} liked your post",
                    body=caption_preview,
                    url=f"/post/{post_id}",
                ))
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


# ── GET /posts/{post_id}/comments ────────────────────────────────────────────
@router.get("/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    post_id: str,
    current_user: User = Depends(get_current_user),
):
    comments = await PostComment.find(
        PostComment.post_id == post_id
    ).sort(PostComment.created_at).to_list()
    return [
        await build_comment_response(c, str(current_user.id))
        for c in comments
    ]


# ── POST /posts/{post_id}/comments — add comment or reply ────────────────────
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

    actor_id = str(current_user.id)
    actor_name = current_user.full_name
    comment_preview = comment.text[:60] + ("..." if len(comment.text) > 60 else "")
    comment_id = str(comment.id)

    async def notify_comment():
        await post.fetch_link(Post.user)
        post_owner = post.user

        # ── Notify post owner about comment ──────────────────────────────
        if hasattr(post_owner, "id") and str(post_owner.id) != actor_id:
            owner_id = str(post_owner.id)
            notif_text = (
                f'replied to a comment: "{comment_preview}"'
                if comment_in.parent_comment_id
                else f'commented: "{comment_preview}"'
            )
            await asyncio.gather(
                send_ws_notification(
                    recipient_id=owner_id,
                    notification_type="comment",
                    title=actor_name,
                    text=notif_text,
                    link=f"/post/{post_id}",
                    sender_id=actor_id,
                    sender_name=actor_name,
                ),
                send_push_to_user(
                    user_id=owner_id,
                    title=f"{actor_name} commented on your post",
                    body=comment_preview,
                    url=f"/post/{post_id}",
                ),
            )

        # ── If this is a reply, also notify the parent comment's author ──
        if comment_in.parent_comment_id:
            parent_comment = await PostComment.get(comment_in.parent_comment_id)
            if (
                parent_comment
                and parent_comment.user_id != actor_id
                and parent_comment.user_id != (str(post_owner.id) if hasattr(post_owner, "id") else "")
            ):
                await asyncio.gather(
                    send_ws_notification(
                        recipient_id=parent_comment.user_id,
                        notification_type="reply",
                        title=actor_name,
                        text=f'replied to your comment: "{comment_preview}"',
                        link=f"/post/{post_id}",
                        sender_id=actor_id,
                        sender_name=actor_name,
                    ),
                    send_push_to_user(
                        user_id=parent_comment.user_id,
                        title=f"{actor_name} replied to your comment",
                        body=comment_preview,
                        url=f"/post/{post_id}",
                    ),
                )

        # ── Handle @mentions in comment text ─────────────────────────────
        mentioned_usernames = extract_mentions(comment.text)
        for username in set(mentioned_usernames):
            mentioned_user = await User.find_one(User.username == username)
            if mentioned_user and str(mentioned_user.id) != actor_id:
                mentioned_id = str(mentioned_user.id)
                await asyncio.gather(
                    send_ws_notification(
                        recipient_id=mentioned_id,
                        notification_type="mention",
                        title=actor_name,
                        text=f"mentioned you in a comment",
                        link=f"/post/{post_id}",
                        sender_id=actor_id,
                        sender_name=actor_name,
                    ),
                    send_push_to_user(
                        user_id=mentioned_id,
                        title=f"{actor_name} mentioned you",
                        body=comment_preview,
                        url=f"/post/{post_id}",
                    ),
                )

    asyncio.create_task(notify_comment())

    return await build_comment_response(comment, actor_id)


# ── POST /posts/comments/{comment_id}/like — toggle comment like ──────────────
@router.post("/comments/{comment_id}/like")
async def toggle_comment_like(
    comment_id: str,
    current_user: User = Depends(get_current_user),
):
    comment = await PostComment.get(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    user_id = str(current_user.id)
    existing = await CommentLike.find_one(
        CommentLike.comment_id == comment_id,
        CommentLike.user_id == user_id
    )
    if existing:
        await existing.delete()
        liked = False
    else:
        await CommentLike(comment_id=comment_id, user_id=user_id).insert()
        liked = True

        # Notify comment author
        if comment.user_id != user_id:
            asyncio.create_task(asyncio.gather(
                send_ws_notification(
                    recipient_id=comment.user_id,
                    notification_type="like",
                    title=current_user.full_name,
                    text="liked your comment",
                    link=f"/post/{comment.post_id}",
                    sender_id=user_id,
                    sender_name=current_user.full_name,
                ),
                send_push_to_user(
                    user_id=comment.user_id,
                    title=f"{current_user.full_name} liked your comment",
                    body=comment.text[:60],
                    url=f"/post/{comment.post_id}",
                ),
            ))

    likes_count = await CommentLike.find(
        CommentLike.comment_id == comment_id
    ).count()
    return {"liked": liked, "likes_count": likes_count}


# ── GET /posts/{post_id}/share — dynamic share preview card ───────────────────
@router.get("/{post_id}/share")
async def share_post_preview(post_id: str):
    from fastapi.responses import HTMLResponse
    from app.core.config import settings
    
    post = await Post.get(post_id)
    if not post:
        # Fallback to frontend home if post is not found
        return HTMLResponse(content=f"""
        <html>
            <head>
                <meta http-equiv="refresh" content="0;url={settings.FRONTEND_URL}" />
            </head>
            <body>Redirecting...</body>
        </html>
        """)
        
    try:
        await post.fetch_link(Post.user)
        user = post.user
        user_name = user.full_name
    except Exception:
        user_name = "Isi Ngala User"

    title = f"Check out {user_name}'s post on Isi Ngala!"
    description = post.caption[:150] + "..." if post.caption and len(post.caption) > 150 else (post.caption or "Your Hair is your Pride")
    
    # Use post media_url if present, else fallback to standard preview logo
    image_url = post.media_url or "https://isingala.com/assets/logo.png"
    
    redirect_url = f"{settings.FRONTEND_URL}/post/{post_id}"
    
    html_content = f"""<!DOCTYPE html>
    <html>
        <head>
            <title>{title}</title>
            <meta charset="utf-8" />
            <meta property="og:title" content="{title}" />
            <meta property="og:description" content="{description}" />
            <meta property="og:image" content="{image_url}" />
            <meta property="og:type" content="article" />
            <meta property="og:url" content="{redirect_url}" />
            <meta property="og:site_name" content="Isi Ngala" />
            
            <!-- Twitter Card tags -->
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="{title}" />
            <meta name="twitter:description" content="{description}" />
            <meta name="twitter:image" content="{image_url}" />
            
            <!-- Redirect standard browsers to the actual frontend page -->
            <script type="text/javascript">
                window.location.replace("{redirect_url}");
            </script>
            <meta http-equiv="refresh" content="0;url={redirect_url}" />
        </head>
        <body>
            <p>Redirecting to Isi Ngala... If you are not redirected, <a href="{redirect_url}">click here</a>.</p>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)