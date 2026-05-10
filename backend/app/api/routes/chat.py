from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.services.chat_manager import chat_manager
from app.models.message import Message
from app.models.user import User

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await chat_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Expecting data in format "receiver_id:message_content"
            if ":" in data:
                receiver_id, content = data.split(":", 1)
                
                # Save to DB
                # In production, fetch actual user instances
                # msg = Message(sender=..., receiver=..., content=content)
                # await msg.insert()
                
                # Send to receiver
                await chat_manager.send_personal_message(content, receiver_id)
    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, user_id)
