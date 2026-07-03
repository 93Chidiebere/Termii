from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.models.push_subscription import PushSubscription
from app.api.dependencies import get_current_user
from app.models.user import User
from app.core.config import settings

router = APIRouter()


class SubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    keys: SubscriptionKeys


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Returns the VAPID public key for the frontend to use when subscribing."""
    return {"public_key": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe")
async def subscribe(
    sub: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
):
    user_id = str(current_user.id)

    # Update existing or create new subscription for this user
    existing = await PushSubscription.find_one(
        PushSubscription.user_id == user_id,
        PushSubscription.endpoint == sub.endpoint,
    )
    if existing:
        existing.p256dh = sub.keys.p256dh
        existing.auth = sub.keys.auth
        await existing.save()
    else:
        await PushSubscription(
            user_id=user_id,
            endpoint=sub.endpoint,
            p256dh=sub.keys.p256dh,
            auth=sub.keys.auth,
        ).insert()

    return {"status": "subscribed"}


@router.delete("/unsubscribe")
async def unsubscribe(
    sub: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
):
    existing = await PushSubscription.find_one(
        PushSubscription.user_id == str(current_user.id),
        PushSubscription.endpoint == sub.endpoint,
    )
    if existing:
        await existing.delete()
    return {"status": "unsubscribed"}