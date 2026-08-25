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


from fastapi import Request

@router.post("/subscribe")
async def subscribe(
    sub: PushSubscriptionCreate,
    request: Request,
):
    # Dynamically check for optional authenticated user token
    user_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from jose import jwt
            from app.core.config import settings
            from app.models.user import User
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            if email:
                user = await User.find_one(User.email == email)
                if user:
                    user_id = str(user.id)
        except Exception:
            pass

    # Find subscription strictly by browser endpoint
    existing = await PushSubscription.find_one(
        PushSubscription.endpoint == sub.endpoint
    )
    if existing:
        existing.user_id = user_id  # Update user ID if user logs in
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
):
    existing = await PushSubscription.find_one(
        PushSubscription.endpoint == sub.endpoint
    )
    if existing:
        await existing.delete()
    return {"status": "unsubscribed"}