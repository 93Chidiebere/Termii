from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime
import re

from app.models.blog import BlogPost, BlogBlock
from app.models.user import User
from app.api.dependencies import get_current_admin

router = APIRouter()


def add_watermark(image_url: str) -> str:
    """
    Inserts a Cloudinary overlay transformation into an existing Cloudinary URL
    to add the Ngala Africa logo watermark, bottom-right, semi-transparent.
    """
    if "res.cloudinary.com" not in image_url:
        return image_url  # not a Cloudinary URL, can't transform it

    watermark_public_id = "NgalaAfrica_k3yvqo"
    transformation = f"l_{watermark_public_id},w_200,o_70,g_south_east,x_20,y_20/fl_layer_apply"

    # Insert the transformation right after "/upload/" in the URL
    parts = image_url.split("/upload/")
    if len(parts) != 2:
        return image_url
    return f"{parts[0]}/upload/{transformation}/{parts[1]}"

def slugify(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    return slug[:80]


class BlockInput(BaseModel):
    type: str
    content: str
    is_thumbnail: bool = False


class BlogPostCreate(BaseModel):
    title: str
    summary: str
    blocks: List[BlockInput] = []
    status: str = "draft"

    @field_validator("summary")
    @classmethod
    def summary_length(cls, v):
        if len(v) > 500:
            raise ValueError("Summary must be 500 characters or fewer")
        return v


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    blocks: Optional[List[BlockInput]] = None
    status: Optional[str] = None

    @field_validator("summary")
    @classmethod
    def summary_length(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Summary must be 500 characters or fewer")
        return v

class BlogPostResponse(BaseModel):
    id: str
    title: str
    slug: str
    summary: str
    blocks: List[BlockInput]
    author_name: str
    status: str
    is_pinned: bool
    pinned_order: Optional[int] = None
    created_at: str
    updated_at: str
    published_at: Optional[str] = None
    og_image: Optional[str] = None

def to_response(post: BlogPost) -> BlogPostResponse:
    return BlogPostResponse(
        id=str(post.id),
        title=post.title,
        slug=post.slug,
        summary=post.summary,
        blocks=[BlockInput(type=b.type, content=b.content, is_thumbnail=b.is_thumbnail) for b in post.blocks],
        author_name=post.author_name,
        status=post.status,
        is_pinned=post.is_pinned,
        pinned_order=post.pinned_order,
        created_at=post.created_at.isoformat(),
        updated_at=post.updated_at.isoformat(),
        published_at=post.published_at.isoformat() if post.published_at else None,
        og_image=post.og_image,
    )


# ── POST /blog/ — create a new post (admin only) ──────────────────────────────
@router.post("/", response_model=BlogPostResponse)
async def create_post(
    post_in: BlogPostCreate,
    admin: User = Depends(get_current_admin),
):
    base_slug = slugify(post_in.title)
    slug = base_slug
    counter = 1
    while await BlogPost.find_one(BlogPost.slug == slug):
        slug = f"{base_slug}-{counter}"
        counter += 1

    
    og_image = None
    if post_in.status == "published":
        thumbnail_block = next((b for b in post_in.blocks if b.type == "image" and b.is_thumbnail), None)
        if not thumbnail_block:
            thumbnail_block = next((b for b in post_in.blocks if b.type == "image"), None)
        if thumbnail_block:
            og_image = add_watermark(thumbnail_block.content)

    post = BlogPost(
        title=post_in.title,
        slug=slug,
        summary=post_in.summary,
        blocks=[BlogBlock(type=b.type, content=b.content, is_thumbnail=b.is_thumbnail) for b in post_in.blocks],
        author_id=str(admin.id),
        author_name=admin.full_name,
        status=post_in.status,
        published_at=datetime.utcnow() if post_in.status == "published" else None,
        og_image=og_image,
    )
    await post.insert()
    return to_response(post)


# ── GET /blog/admin — list ALL posts including drafts (admin only) ────────────
@router.get("/admin", response_model=List[BlogPostResponse])
async def list_all_posts_admin(admin: User = Depends(get_current_admin)):
    posts = await BlogPost.find_all().sort(-BlogPost.created_at).to_list()
    return [to_response(p) for p in posts]


# ── GET /blog/admin/{post_id} — get one post for editing (admin only) ─────────
@router.get("/admin/{post_id}", response_model=BlogPostResponse)
async def get_post_for_edit(post_id: str, admin: User = Depends(get_current_admin)):
    post = await BlogPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return to_response(post)


# ── PUT /blog/{post_id} — update a post (admin only) ──────────────────────────
@router.put("/{post_id}", response_model=BlogPostResponse)
async def update_post(
    post_id: str,
    update: BlogPostUpdate,
    admin: User = Depends(get_current_admin),
):
    post = await BlogPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if update.title is not None:
        post.title = update.title
    if update.summary is not None:
        post.summary = update.summary
    if update.blocks is not None:
        post.blocks = [BlogBlock(type=b.type, content=b.content, is_thumbnail=b.is_thumbnail) for b in update.blocks]

    if update.status is not None:
        if update.status == "published" and post.status != "published":
            post.published_at = datetime.utcnow()
            # Generate a watermarked OG image from the thumbnail
            thumbnail_block = next((b for b in post.blocks if b.type == "image" and b.is_thumbnail), None)
            if not thumbnail_block:
                thumbnail_block = next((b for b in post.blocks if b.type == "image"), None)
            if thumbnail_block:
                post.og_image = add_watermark(thumbnail_block.content)
        post.status = update.status

    post.updated_at = datetime.utcnow()
    await post.save()
    return to_response(post)


# ── DELETE /blog/{post_id} — delete a post (admin only) ───────────────────────
@router.delete("/{post_id}")
async def delete_post(post_id: str, admin: User = Depends(get_current_admin)):
    post = await BlogPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await post.delete()
    return {"message": "Post deleted"}


# ── PUT /blog/{post_id}/pin — pin a post (max 5 enforced) ─────────────────────
@router.put("/{post_id}/pin")
async def pin_post(post_id: str, admin: User = Depends(get_current_admin)):
    post = await BlogPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.is_pinned:
        return to_response(post)

    pinned_count = await BlogPost.find(BlogPost.is_pinned == True).count()
    if pinned_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum of 5 pinned posts reached. Unpin one first.")

    post.is_pinned = True
    post.pinned_order = pinned_count  # append to end of pin order
    await post.save()
    return to_response(post)


# ── PUT /blog/{post_id}/unpin — unpin a post ──────────────────────────────────
@router.put("/{post_id}/unpin")
async def unpin_post(post_id: str, admin: User = Depends(get_current_admin)):
    post = await BlogPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.is_pinned = False
    post.pinned_order = None
    await post.save()

    # Re-sequence remaining pinned posts so order stays clean (0,1,2...)
    remaining = await BlogPost.find(BlogPost.is_pinned == True).sort(BlogPost.pinned_order).to_list()
    for i, p in enumerate(remaining):
        if p.pinned_order != i:
            p.pinned_order = i
            await p.save()

    return to_response(post)


# ── GET /blog/ — public: list published posts, pinned first ───────────────────
@router.get("/", response_model=List[BlogPostResponse])
async def list_published_posts():
    pinned = await BlogPost.find(
        BlogPost.status == "published",
        BlogPost.is_pinned == True
    ).sort(BlogPost.pinned_order).to_list()

    unpinned = await BlogPost.find(
        BlogPost.status == "published",
        BlogPost.is_pinned == False
    ).sort(-BlogPost.published_at).to_list()

    return [to_response(p) for p in pinned + unpinned]


# ── GET /blog/{slug} — public: get one published post by slug ─────────────────
@router.get("/{slug}", response_model=BlogPostResponse)
async def get_published_post(slug: str):
    post = await BlogPost.find_one(BlogPost.slug == slug, BlogPost.status == "published")
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return to_response(post)