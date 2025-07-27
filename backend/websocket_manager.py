from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import logging
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        # Store active connections by room
        self.room_connections: Dict[str, List[WebSocket]] = {}
        # Store user information by connection
        self.connection_users: Dict[WebSocket, dict] = {}
        # Store connections by user ID for private messaging
        self.user_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, room_id: str, user_info: dict):
        """Accept WebSocket connection and add to room"""
        await websocket.accept()
        
        # Add to room connections
        if room_id not in self.room_connections:
            self.room_connections[room_id] = []
        self.room_connections[room_id].append(websocket)
        
        # Store user info
        self.connection_users[websocket] = {
            "user_id": user_info["user_id"],
            "username": user_info["username"],
            "role": user_info["role"],
            "room_id": room_id
        }
        
        # Store user connection for private messaging
        self.user_connections[user_info["user_id"]] = websocket
        
        logger.info(f"User {user_info['username']} connected to room {room_id}")
        
        # Notify room of new user
        await self.broadcast_to_room(room_id, {
            "type": "user_connected",
            "user_id": user_info["user_id"],
            "username": user_info["username"],
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_websocket=websocket)
        
    async def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        if websocket in self.connection_users:
            user_info = self.connection_users[websocket]
            room_id = user_info["room_id"]
            user_id = user_info["user_id"]
            username = user_info["username"]
            
            # Remove from room connections
            if room_id in self.room_connections:
                if websocket in self.room_connections[room_id]:
                    self.room_connections[room_id].remove(websocket)
                    
                # Clean up empty rooms
                if not self.room_connections[room_id]:
                    del self.room_connections[room_id]
            
            # Remove user info
            del self.connection_users[websocket]
            
            # Remove user connection
            if user_id in self.user_connections:
                del self.user_connections[user_id]
            
            logger.info(f"User {username} disconnected from room {room_id}")
            
            # Notify room of user disconnect
            await self.broadcast_to_room(room_id, {
                "type": "user_disconnected",
                "user_id": user_id,
                "username": username,
                "timestamp": datetime.utcnow().isoformat()
            })
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            await self.disconnect(websocket)
    
    async def send_private_message(self, target_user_id: str, message: dict):
        """Send private message to specific user"""
        if target_user_id in self.user_connections:
            websocket = self.user_connections[target_user_id]
            await self.send_personal_message(message, websocket)
            return True
        return False
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_websocket: WebSocket = None):
        """Broadcast message to all connections in a room"""
        if room_id not in self.room_connections:
            return
        
        # Create a copy of connections to avoid modification during iteration
        connections = self.room_connections[room_id].copy()
        
        for connection in connections:
            if connection != exclude_websocket:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error broadcasting to room {room_id}: {e}")
                    await self.disconnect(connection)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all connected users"""
        for room_id in self.room_connections:
            await self.broadcast_to_room(room_id, message)
    
    def get_room_users(self, room_id: str) -> List[dict]:
        """Get list of users in a room"""
        users = []
        if room_id in self.room_connections:
            for connection in self.room_connections[room_id]:
                if connection in self.connection_users:
                    user_info = self.connection_users[connection]
                    users.append({
                        "user_id": user_info["user_id"],
                        "username": user_info["username"],
                        "role": user_info["role"]
                    })
        return users
    
    def get_online_users_count(self, room_id: str) -> int:
        """Get count of online users in a room"""
        return len(self.room_connections.get(room_id, []))

# Global connection manager instance
chat_manager = ConnectionManager()