from fastapi import WebSocket
from typing import Dict, List
import asyncio

class ChatManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChatManager, cls).__new__(cls)
            # Store connections as user_id -> List[WebSocket]
            cls._instance.active_connections: Dict[str, List[WebSocket]] = {}
        return cls._instance

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, receiver_id: str):
        if receiver_id in self.active_connections:
            for connection in self.active_connections[receiver_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    self.disconnect(connection, receiver_id)

chat_manager = ChatManager() # Singleton instance
