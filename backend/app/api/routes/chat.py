from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from app.services.chat_manager import chat_manager
from app.models.message import Message
from app.models.user import User
from app.api.routes.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    text: str
    timestamp: str
    read: bool

class ConversationSummary(BaseModel):
    participant_id: str
    participant_name: str
    participant_email: str
    last_message: str
    last_timestamp: str
    unread_count: int


# ── GET /chat/conversations — list all conversations for current user ──────────
@router.get("/conversations", response_model=List[ConversationSummary])
async def get_conversations(current_user: User = Depends(get_current_user)):
    # Find all messages where current user is sender or receiver
    messages = await Message.find(
        (Message.sender.id == current_user.id) |  # type: ignore
        (Message.receiver.id == current_user.id)  # type: ignore
    ).sort(-Message.created_at).to_list()

    # Group by conversation partner
    conv_map: dict = {}
    for msg in messages:
        await msg.fetch_all_links()
        sender = msg.sender
        receiver = msg.receiver

        # Figure out who the other person is
        if hasattr(sender, "id") and str(sender.id) == str(current_user.id):
            partner = receiver
        else:
            partner = sender

        if not hasattr(partner, "id"):
            continue

        partner_id = str(partner.id)
        if partner_id not in conv_map:
            conv_map[partner_id] = {
                "participant_id": partner_id,
                "participant_name": partner.full_name,
                "participant_email": partner.email,
                "last_message": msg.content,
                "last_timestamp": msg.created_at.isoformat(),
                "unread_count": 0,
            }
        # Count unread messages sent TO current user
        if (
            hasattr(receiver, "id")
            and str(receiver.id) == str(current_user.id)
            and not msg.is_read
        ):
            conv_map[partner_id]["unread_count"] += 1

    return list(conv_map.values())


# ── GET /chat/history/{partner_id} — get message history with one user ────────
@router.get("/history/{partner_id}", response_model=List[MessageResponse])
async def get_history(
    partner_id: str,
    current_user: User = Depends(get_current_user),
):
    partner = await User.get(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="User not found")

    messages = await Message.find(
        (
            (Message.sender.id == current_user.id) &   # type: ignore
            (Message.receiver.id == partner.id)         # type: ignore
        ) | (
            (Message.sender.id == partner.id) &         # type: ignore
            (Message.receiver.id == current_user.id)    # type: ignore
        )
    ).sort(Message.created_at).to_list()

    result = []
    for msg in messages:
        await msg.fetch_all_links()
        result.append(MessageResponse(
            id=str(msg.id),
            sender_id=str(msg.sender.id) if hasattr(msg.sender, "id") else "",
            sender_name=msg.sender.full_name if hasattr(msg.sender, "full_name") else "",
            receiver_id=str(msg.receiver.id) if hasattr(msg.receiver, "id") else "",
            text=msg.content,
            timestamp=msg.created_at.isoformat(),
            read=msg.is_read,
        ))
    return result


# ── WebSocket /chat/ws — real-time messaging ──────────────────────────────────
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
):
    # Validate JWT token passed as query param: /chat/ws?token=xxx
    from jose import jwt, JWTError
    from app.core.config import settings

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            await websocket.close(code=1008)
            return
        current_user = await User.find_one(User.email == email)
        if not current_user:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    user_id = str(current_user.id)
    await chat_manager.connect(websocket, user_id)

    try:
        while True:
            data = await websocket.receive_text()
            # Expect JSON: { "receiver_id": "...", "text": "..." }
            try:
                payload_data = json.loads(data)
                receiver_id = payload_data.get("receiver_id")
                text = payload_data.get("text", "").strip()
            except Exception:
                continue

            if not receiver_id or not text:
                continue

            receiver = await User.get(receiver_id)
            if not receiver:
                continue

            # Save message to database
            msg = Message(
                sender=current_user,
                receiver=receiver,
                content=text,
            )
            await msg.insert()

            # Send to receiver if online
            outgoing = json.dumps({
                "id": str(msg.id),
                "sender_id": user_id,
                "sender_name": current_user.full_name,
                "text": text,
                "timestamp": msg.created_at.isoformat(),
            })
            await chat_manager.send_personal_message(outgoing, receiver_id)

            # Also echo back to sender so their UI updates
            await chat_manager.send_personal_message(outgoing, user_id)

    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, user_id)