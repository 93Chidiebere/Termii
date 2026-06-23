from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.models.user import User
from app.api.dependencies import get_current_admin
from app.api.routes.posts import PostLike  # not used directly, placeholder for future post counts

router = APIRouter()


class AdminUserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    status: str
    is_admin: bool
    suspension_reason: Optional[str] = None
    created_at: str


class StatusUpdateRequest(BaseModel):
    status: str  # "active" | "suspended" | "banned"
    reason: Optional[str] = None


@router.get("/users", response_model=List[AdminUserResponse])
async def list_all_users(admin: User = Depends(get_current_admin)):
    users = await User.find_all().sort(-User.created_at).to_list()
    return [
        AdminUserResponse(
            id=str(u.id),
            full_name=u.full_name,
            email=u.email,
            avatar_url=u.avatar_url,
            status=getattr(u, "status", "active"),
            is_admin=u.is_admin,
            suspension_reason=getattr(u, "suspension_reason", None),
            created_at=u.created_at.isoformat(),
        )
        for u in users
    ]


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    update: StatusUpdateRequest,
    admin: User = Depends(get_current_admin),
):
    if update.status not in ("active", "suspended", "banned"):
        raise HTTPException(status_code=400, detail="Invalid status value")

    target = await User.get(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if str(target.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="You cannot change your own status")

    target.status = update.status
    target.suspension_reason = update.reason if update.status in ("suspended", "banned") else None
    await target.save()

    return {
        "id": str(target.id),
        "status": target.status,
        "suspension_reason": target.suspension_reason,
    }