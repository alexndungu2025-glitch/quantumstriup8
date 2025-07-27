from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid
import json
import logging

from auth import get_current_user, get_current_user_websocket
from database import get_database
from models import User, UserRole, ChatMessage, ChatRoom, ChatModerationAction, MessageType
from websocket_manager import chat_manager

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class SendMessageRequest(BaseModel):
    room_id: str
    content: str
    message_type: MessageType = MessageType.TEXT
    tip_amount: Optional[int] = None

class SendPrivateMessageRequest(BaseModel):
    recipient_id: str
    content: str

class ModerationActionRequest(BaseModel):
    target_user_id: str
    action_type: str = Field(..., description="mute, kick, ban, delete_message")
    duration_minutes: Optional[int] = None
    reason: Optional[str] = None
    message_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: str
    room_id: str
    sender_id: str
    sender_username: str
    sender_role: UserRole
    message_type: MessageType
    content: str
    tip_amount: Optional[int] = None
    is_deleted: bool
    created_at: datetime

class ChatRoomResponse(BaseModel):
    id: str
    room_type: str
    name: str
    model_id: Optional[str] = None
    participants: List[str] = []
    is_active: bool
    online_users_count: int
    created_at: datetime

# WebSocket Chat Endpoint
@router.websocket("/ws/chat/{room_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(...)
):
    """WebSocket endpoint for real-time chat"""
    try:
        # Authenticate user
        user = await get_current_user_websocket(token)
        if not user:
            await websocket.close(code=4003, reason="Authentication failed")
            return
        
        user_info = {
            "user_id": user.id,
            "username": user.username,
            "role": user.role
        }
        
        # Connect to chat manager
        await chat_manager.connect(websocket, room_id, user_info)
        
        # Get database
        db = await get_database()
        
        # Send recent chat history
        recent_messages = await db.chat_messages.find({
            "room_id": room_id,
            "is_deleted": False
        }).sort("created_at", -1).limit(50).to_list(length=None)
        
        # Send messages in chronological order
        for message in reversed(recent_messages):
            await chat_manager.send_personal_message({
                "type": "chat_message",
                "message": {
                    "id": message["_id"],
                    "room_id": message["room_id"],
                    "sender_id": message["sender_id"],
                    "sender_username": message["sender_username"],
                    "sender_role": message["sender_role"],
                    "message_type": message["message_type"],
                    "content": message["content"],
                    "tip_amount": message.get("tip_amount"),
                    "created_at": message["created_at"].isoformat()
                }
            }, websocket)
        
        # Send current online users
        online_users = chat_manager.get_room_users(room_id)
        await chat_manager.send_personal_message({
            "type": "online_users",
            "users": online_users
        }, websocket)
        
        # Listen for messages
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle different message types
                if message_data["type"] == "chat_message":
                    await handle_chat_message(db, user, room_id, message_data)
                elif message_data["type"] == "private_message":
                    await handle_private_message(db, user, message_data)
                elif message_data["type"] == "typing":
                    await handle_typing_indicator(room_id, user, message_data)
                elif message_data["type"] == "moderation_action":
                    await handle_moderation_action(db, user, room_id, message_data)
                    
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await chat_manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format"
                }, websocket)
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                await chat_manager.send_personal_message({
                    "type": "error",
                    "message": "Error processing message"
                }, websocket)
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        await chat_manager.disconnect(websocket)

async def handle_chat_message(db: Any, user: User, room_id: str, message_data: dict):
    """Handle incoming chat message"""
    try:
        content = message_data.get("content", "").strip()
        if not content:
            return
        
        # Check if user is banned or muted
        current_time = datetime.utcnow()
        moderation_check = await db.chat_moderation_actions.find_one({
            "room_id": room_id,
            "target_user_id": user.id,
            "action_type": {"$in": ["mute", "ban"]},
            "$or": [
                {"expires_at": None},
                {"expires_at": {"$gt": current_time}}
            ]
        })
        
        if moderation_check:
            return  # User is muted/banned
        
        # Process tip messages
        tip_amount = None
        message_type = MessageType.TEXT
        
        if message_data.get("message_type") == "tip" and message_data.get("tip_amount"):
            tip_amount = int(message_data["tip_amount"])
            message_type = MessageType.TIP
            
            # Verify user has enough tokens
            viewer_profile = await db.viewer_profiles.find_one({"user_id": user.id})
            if not viewer_profile or viewer_profile.get("token_balance", 0) < tip_amount:
                return  # Insufficient tokens
            
            # Process tip transaction (similar to existing tip logic)
            await process_tip_transaction(db, user.id, room_id, tip_amount, content)
        
        # Create chat message
        chat_message = ChatMessage(
            room_id=room_id,
            sender_id=user.id,
            sender_username=user.username,
            sender_role=user.role,
            message_type=message_type,
            content=content,
            tip_amount=tip_amount
        )
        
        # Save to database
        await db.chat_messages.insert_one(chat_message.model_dump(by_alias=True))
        
        # Broadcast to room
        await chat_manager.broadcast_to_room(room_id, {
            "type": "chat_message",
            "message": {
                "id": chat_message.id,
                "room_id": room_id,
                "sender_id": user.id,
                "sender_username": user.username,
                "sender_role": user.role,
                "message_type": message_type,
                "content": content,
                "tip_amount": tip_amount,
                "created_at": chat_message.created_at.isoformat()
            }
        })
        
        logger.info(f"Chat message from {user.username} in room {room_id}")
        
    except Exception as e:
        logger.error(f"Error handling chat message: {e}")

async def handle_private_message(db: Any, user: User, message_data: dict):
    """Handle private message between users"""
    try:
        recipient_id = message_data.get("recipient_id")
        content = message_data.get("content", "").strip()
        
        if not recipient_id or not content:
            return
        
        # Create private room ID (consistent for both users)
        room_participants = sorted([user.id, recipient_id])
        private_room_id = f"private_{room_participants[0]}_{room_participants[1]}"
        
        # Create/get private room
        private_room = await db.chat_rooms.find_one({"_id": private_room_id})
        if not private_room:
            room = ChatRoom(
                id=private_room_id,
                room_type="private",
                name=f"Private Chat",
                participants=room_participants
            )
            await db.chat_rooms.insert_one(room.model_dump(by_alias=True))
        
        # Create private message
        private_message = ChatMessage(
            room_id=private_room_id,
            sender_id=user.id,
            sender_username=user.username,
            sender_role=user.role,
            message_type=MessageType.PRIVATE,
            content=content
        )
        
        # Save to database
        await db.chat_messages.insert_one(private_message.model_dump(by_alias=True))
        
        # Send to recipient if online
        message_payload = {
            "type": "private_message",
            "message": {
                "id": private_message.id,
                "sender_id": user.id,
                "sender_username": user.username,
                "content": content,
                "created_at": private_message.created_at.isoformat()
            }
        }
        
        await chat_manager.send_private_message(recipient_id, message_payload)
        
        logger.info(f"Private message from {user.username} to {recipient_id}")
        
    except Exception as e:
        logger.error(f"Error handling private message: {e}")

async def handle_typing_indicator(room_id: str, user: User, message_data: dict):
    """Handle typing indicator"""
    try:
        is_typing = message_data.get("is_typing", False)
        
        await chat_manager.broadcast_to_room(room_id, {
            "type": "typing",
            "user_id": user.id,
            "username": user.username,
            "is_typing": is_typing
        })
        
    except Exception as e:
        logger.error(f"Error handling typing indicator: {e}")

async def handle_moderation_action(db: Any, user: User, room_id: str, message_data: dict):
    """Handle chat moderation actions"""
    try:
        # Only models and admins can moderate
        if user.role not in [UserRole.MODEL, UserRole.ADMIN]:
            return
        
        # For model-specific rooms, only that model or admins can moderate
        if user.role == UserRole.MODEL:
            model_profile = await db.model_profiles.find_one({"user_id": user.id})
            if not model_profile or model_profile["_id"] != room_id:
                return
        
        target_user_id = message_data.get("target_user_id")
        action_type = message_data.get("action_type")
        duration_minutes = message_data.get("duration_minutes")
        reason = message_data.get("reason")
        message_id = message_data.get("message_id")
        
        if not target_user_id or not action_type:
            return
        
        # Create moderation action
        expires_at = None
        if duration_minutes:
            expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
        
        moderation_action = ChatModerationAction(
            room_id=room_id,
            moderator_id=user.id,
            target_user_id=target_user_id,
            action_type=action_type,
            duration_minutes=duration_minutes,
            reason=reason,
            message_id=message_id,
            expires_at=expires_at
        )
        
        # Save to database
        await db.chat_moderation_actions.insert_one(moderation_action.model_dump(by_alias=True))
        
        # Handle specific actions
        if action_type == "delete_message" and message_id:
            await db.chat_messages.update_one(
                {"_id": message_id},
                {
                    "$set": {
                        "is_deleted": True,
                        "deleted_by": user.id,
                        "deleted_at": datetime.utcnow()
                    }
                }
            )
            
            # Broadcast message deletion
            await chat_manager.broadcast_to_room(room_id, {
                "type": "message_deleted",
                "message_id": message_id,
                "deleted_by": user.username
            })
        
        elif action_type in ["mute", "ban", "kick"]:
            # Broadcast moderation action
            await chat_manager.broadcast_to_room(room_id, {
                "type": "moderation_action",
                "action_type": action_type,
                "target_user_id": target_user_id,
                "moderator": user.username,
                "reason": reason,
                "duration_minutes": duration_minutes
            })
        
        logger.info(f"Moderation action: {action_type} by {user.username} on {target_user_id}")
        
    except Exception as e:
        logger.error(f"Error handling moderation action: {e}")

async def process_tip_transaction(db: Any, user_id: str, room_id: str, tip_amount: int, message: str):
    """Process tip transaction (similar to existing tip logic)"""
    try:
        from models import Transaction, TransactionType, TransactionStatus
        
        # Get model profile from room_id (assuming room_id is model_id for public rooms)
        model_profile = await db.model_profiles.find_one({"_id": room_id})
        if not model_profile:
            return
        
        # Deduct tokens from viewer
        await db.viewer_profiles.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "token_balance": -tip_amount,
                    "total_spent": tip_amount
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # Add earnings to model (50% platform fee)
        platform_fee = tip_amount * 0.5
        model_earnings = tip_amount - platform_fee
        
        await db.model_profiles.update_one(
            {"_id": room_id},
            {
                "$inc": {
                    "total_earnings": model_earnings,
                    "available_balance": model_earnings
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # Create transaction records
        viewer_transaction = Transaction(
            user_id=user_id,
            transaction_type=TransactionType.TIP,
            amount=tip_amount,
            tokens=tip_amount,
            status=TransactionStatus.COMPLETED,
            model_id=room_id,
            description=f"Chat tip: {message[:50]}{'...' if len(message) > 50 else ''}",
            metadata={"tip_message": message}
        )
        
        model_transaction = Transaction(
            user_id=model_profile["user_id"],
            transaction_type=TransactionType.EARNING,
            amount=model_earnings,
            tokens=int(model_earnings),
            status=TransactionStatus.COMPLETED,
            description=f"Chat tip earnings: {message[:50]}{'...' if len(message) > 50 else ''}",
            metadata={
                "tip_message": message,
                "original_amount": tip_amount,
                "platform_fee": platform_fee
            }
        )
        
        await db.transactions.insert_many([
            viewer_transaction.model_dump(by_alias=True),
            model_transaction.model_dump(by_alias=True)
        ])
        
    except Exception as e:
        logger.error(f"Error processing tip transaction: {e}")

# REST API Endpoints for Chat

@router.get("/rooms", response_model=List[ChatRoomResponse])
async def get_chat_rooms(
    current_user: User = Depends(get_current_user)
):
    """Get available chat rooms"""
    try:
        db = await get_database()
        
        # Get public chat rooms (linked to live models)
        live_models = await db.model_profiles.find({
            "is_live": True,
            "is_available": True
        }).to_list(length=None)
        
        rooms = []
        for model in live_models:
            room_id = model["_id"]
            online_count = chat_manager.get_online_users_count(room_id)
            
            rooms.append(ChatRoomResponse(
                id=room_id,
                room_type="public",
                name=f"{model.get('display_name', 'Unknown')} Live Chat",
                model_id=room_id,
                is_active=True,
                online_users_count=online_count,
                created_at=model.get("created_at", datetime.utcnow())
            ))
        
        return rooms
        
    except Exception as e:
        logger.error(f"Error getting chat rooms: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chat rooms"
        )

@router.get("/rooms/{room_id}/messages", response_model=List[ChatMessageResponse])
async def get_chat_history(
    room_id: str,
    limit: int = Query(default=50, le=100),
    before: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user)
):
    """Get chat history for a room"""
    try:
        db = await get_database()
        
        # Build query
        query = {"room_id": room_id, "is_deleted": False}
        if before:
            # Parse before timestamp
            before_dt = datetime.fromisoformat(before.replace('Z', '+00:00'))
            query["created_at"] = {"$lt": before_dt}
        
        # Get messages
        messages = await db.chat_messages.find(query).sort("created_at", -1).limit(limit).to_list(length=None)
        
        # Convert to response format
        result = []
        for msg in reversed(messages):
            result.append(ChatMessageResponse(
                id=msg["_id"],
                room_id=msg["room_id"],
                sender_id=msg["sender_id"],
                sender_username=msg["sender_username"],
                sender_role=msg["sender_role"],
                message_type=msg["message_type"],
                content=msg["content"],
                tip_amount=msg.get("tip_amount"),
                is_deleted=msg["is_deleted"],
                created_at=msg["created_at"]
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chat history"
        )

@router.get("/rooms/{room_id}/users")
async def get_room_users(
    room_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get online users in a chat room"""
    try:
        online_users = chat_manager.get_room_users(room_id)
        return {
            "success": True,
            "room_id": room_id,
            "online_users": online_users,
            "count": len(online_users)
        }
        
    except Exception as e:
        logger.error(f"Error getting room users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get room users"
        )

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a chat message (moderators only)"""
    try:
        db = await get_database()
        
        # Get message
        message = await db.chat_messages.find_one({"_id": message_id})
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        # Check permissions
        can_delete = False
        if current_user.role == UserRole.ADMIN:
            can_delete = True
        elif current_user.role == UserRole.MODEL:
            # Model can delete messages in their own room
            model_profile = await db.model_profiles.find_one({"user_id": current_user.id})
            if model_profile and model_profile["_id"] == message["room_id"]:
                can_delete = True
        elif message["sender_id"] == current_user.id:
            # Users can delete their own messages
            can_delete = True
        
        if not can_delete:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this message"
            )
        
        # Mark message as deleted
        await db.chat_messages.update_one(
            {"_id": message_id},
            {
                "$set": {
                    "is_deleted": True,
                    "deleted_by": current_user.id,
                    "deleted_at": datetime.utcnow()
                }
            }
        )
        
        # Broadcast deletion
        await chat_manager.broadcast_to_room(message["room_id"], {
            "type": "message_deleted",
            "message_id": message_id,
            "deleted_by": current_user.username
        })
        
        return {
            "success": True,
            "message": "Message deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete message"
        )