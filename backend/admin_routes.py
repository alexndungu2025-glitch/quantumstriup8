from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid
import logging

from auth import get_current_user
from database import get_database
from models import User, UserRole, SystemSettings, Withdrawal, WithdrawalStatus, Transaction, TransactionType

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class SystemSettingRequest(BaseModel):
    key: str = Field(..., description="Setting key")
    value: str = Field(..., description="Setting value")
    description: Optional[str] = Field(None, description="Setting description")

class SystemSettingResponse(BaseModel):
    id: str
    key: str
    value: str
    description: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

class WithdrawalApprovalRequest(BaseModel):
    action: str = Field(..., description="approve or reject")
    admin_notes: Optional[str] = Field(None, description="Admin notes")
    mpesa_code: Optional[str] = Field(None, description="M-Pesa confirmation code (for approvals)")

class PlatformStatsResponse(BaseModel):
    total_users: int
    total_models: int
    total_viewers: int
    active_models: int
    total_transactions: float
    platform_revenue: float
    pending_withdrawals: float
    total_tokens_purchased: int
    daily_active_users: int

class UserManagementResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# System Settings Routes
@router.get("/settings", response_model=List[SystemSettingResponse])
async def get_system_settings(admin_user: User = Depends(require_admin)):
    """Get all system settings"""
    try:
        db = await get_database()
        
        settings = await db.system_settings.find({}).to_list(length=None)
        
        return [
            SystemSettingResponse(
                id=setting["_id"],
                key=setting["key"],
                value=setting["value"],
                description=setting.get("description"),
                created_at=setting["created_at"],
                updated_at=setting.get("updated_at")
            )
            for setting in settings
        ]
        
    except Exception as e:
        logger.error(f"Error getting system settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get system settings"
        )

@router.post("/settings", response_model=SystemSettingResponse)
async def create_or_update_setting(
    request: SystemSettingRequest,
    admin_user: User = Depends(require_admin)
):
    """Create or update a system setting"""
    try:
        db = await get_database()
        
        # Check if setting exists
        existing_setting = await db.system_settings.find_one({"key": request.key})
        
        if existing_setting:
            # Update existing setting
            await db.system_settings.update_one(
                {"key": request.key},
                {
                    "$set": {
                        "value": request.value,
                        "description": request.description,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            updated_setting = await db.system_settings.find_one({"key": request.key})
            
            return SystemSettingResponse(
                id=updated_setting["_id"],
                key=updated_setting["key"],
                value=updated_setting["value"],
                description=updated_setting.get("description"),
                created_at=updated_setting["created_at"],
                updated_at=updated_setting["updated_at"]
            )
        else:
            # Create new setting
            new_setting = SystemSettings(
                key=request.key,
                value=request.value,
                description=request.description
            )
            
            await db.system_settings.insert_one(new_setting.model_dump(by_alias=True))
            
            return SystemSettingResponse(
                id=new_setting.id,
                key=new_setting.key,
                value=new_setting.value,
                description=new_setting.description,
                created_at=new_setting.created_at,
                updated_at=new_setting.updated_at
            )
        
    except Exception as e:
        logger.error(f"Error creating/updating system setting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create/update system setting"
        )

@router.delete("/settings/{setting_key}")
async def delete_setting(
    setting_key: str,
    admin_user: User = Depends(require_admin)
):
    """Delete a system setting"""
    try:
        db = await get_database()
        
        result = await db.system_settings.delete_one({"key": setting_key})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found"
            )
        
        return {"success": True, "message": f"Setting '{setting_key}' deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting system setting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete system setting"
        )

# Platform Statistics Routes
@router.get("/stats", response_model=PlatformStatsResponse)
async def get_platform_stats(admin_user: User = Depends(require_admin)):
    """Get platform statistics"""
    try:
        db = await get_database()
        
        # Count users by role
        total_users = await db.users.count_documents({})
        total_models = await db.users.count_documents({"role": UserRole.MODEL})
        total_viewers = await db.users.count_documents({"role": UserRole.VIEWER})
        
        # Count active models (online in last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        active_models = await db.model_profiles.count_documents({
            "last_online": {"$gte": yesterday}
        })
        
        # Calculate total transactions and platform revenue
        transaction_stats = await db.transactions.aggregate([
            {
                "$match": {
                    "status": "completed",
                    "transaction_type": {"$in": ["purchase", "tip", "private_show"]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_amount": {"$sum": "$amount"},
                    "total_tokens": {"$sum": "$tokens"}
                }
            }
        ]).to_list(length=1)
        
        total_amount = transaction_stats[0]["total_amount"] if transaction_stats else 0
        total_tokens = transaction_stats[0]["total_tokens"] if transaction_stats else 0
        
        # Platform revenue (50% of all transactions)
        platform_revenue = total_amount * 0.5
        
        # Pending withdrawals
        pending_withdrawals_stats = await db.withdrawals.aggregate([
            {
                "$match": {
                    "status": {"$in": [WithdrawalStatus.REQUESTED, WithdrawalStatus.PROCESSING]}
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(length=1)
        
        pending_withdrawals = pending_withdrawals_stats[0]["total"] if pending_withdrawals_stats else 0
        
        # Daily active users (logged in last 24 hours)
        daily_active_users = await db.users.count_documents({
            "last_login": {"$gte": yesterday}
        })
        
        return PlatformStatsResponse(
            total_users=total_users,
            total_models=total_models,
            total_viewers=total_viewers,
            active_models=active_models,
            total_transactions=total_amount,
            platform_revenue=platform_revenue,
            pending_withdrawals=pending_withdrawals,
            total_tokens_purchased=total_tokens,
            daily_active_users=daily_active_users
        )
        
    except Exception as e:
        logger.error(f"Error getting platform stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get platform statistics"
        )

# User Management Routes
@router.get("/users", response_model=List[UserManagementResponse])
async def get_all_users(
    role: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    admin_user: User = Depends(require_admin)
):
    """Get all users with optional role filtering"""
    try:
        db = await get_database()
        
        # Build query
        query = {}
        if role:
            query["role"] = role
        
        users = await db.users.find(query).skip(offset).limit(limit).to_list(length=limit)
        
        return [
            UserManagementResponse(
                id=user["_id"],
                username=user["username"],
                email=user["email"],
                role=user["role"],
                is_active=user["is_active"],
                is_verified=user["is_verified"],
                created_at=user["created_at"],
                last_login=user.get("last_login")
            )
            for user in users
        ]
        
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get users"
        )

@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    is_active: bool,
    admin_user: User = Depends(require_admin)
):
    """Activate or deactivate a user"""
    try:
        db = await get_database()
        
        result = await db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "is_active": is_active,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        status_text = "activated" if is_active else "deactivated"
        return {
            "success": True,
            "message": f"User {status_text} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user status"
        )

# Withdrawal Management Routes
@router.get("/withdrawals", response_model=List[Dict[str, Any]])
async def get_all_withdrawals(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    admin_user: User = Depends(require_admin)
):
    """Get all withdrawal requests"""
    try:
        db = await get_database()
        
        # Build query
        query = {}
        if status_filter:
            query["status"] = status_filter
        
        # Get withdrawals with model information
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "model_profiles",
                    "localField": "model_id",
                    "foreignField": "_id",
                    "as": "model_info"
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "model_info.user_id",
                    "foreignField": "_id",
                    "as": "user_info"
                }
            },
            {"$sort": {"created_at": -1}},
            {"$skip": offset},
            {"$limit": limit}
        ]
        
        withdrawals = await db.withdrawals.aggregate(pipeline).to_list(length=limit)
        
        return [
            {
                "id": withdrawal["_id"],
                "amount": withdrawal["amount"],
                "phone_number": withdrawal["phone_number"],
                "status": withdrawal["status"],
                "created_at": withdrawal["created_at"],
                "processed_at": withdrawal.get("processed_at"),
                "mpesa_code": withdrawal.get("mpesa_code"),
                "admin_notes": withdrawal.get("admin_notes"),
                "model_name": withdrawal["model_info"][0]["display_name"] if withdrawal["model_info"] else "Unknown",
                "model_username": withdrawal["user_info"][0]["username"] if withdrawal["user_info"] else "Unknown"
            }
            for withdrawal in withdrawals
        ]
        
    except Exception as e:
        logger.error(f"Error getting withdrawals: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get withdrawals"
        )

@router.patch("/withdrawals/{withdrawal_id}")
async def process_withdrawal(
    withdrawal_id: str,
    request: WithdrawalApprovalRequest,
    admin_user: User = Depends(require_admin)
):
    """Approve or reject a withdrawal request"""
    try:
        db = await get_database()
        
        # Get withdrawal
        withdrawal = await db.withdrawals.find_one({"_id": withdrawal_id})
        if not withdrawal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Withdrawal request not found"
            )
        
        if withdrawal["status"] != WithdrawalStatus.REQUESTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Withdrawal request has already been processed"
            )
        
        if request.action == "approve":
            # Update withdrawal status
            await db.withdrawals.update_one(
                {"_id": withdrawal_id},
                {
                    "$set": {
                        "status": WithdrawalStatus.COMPLETED,
                        "processed_by": admin_user.id,
                        "processed_at": datetime.utcnow(),
                        "mpesa_code": request.mpesa_code,
                        "admin_notes": request.admin_notes,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            message = "Withdrawal approved successfully"
            
        elif request.action == "reject":
            # Update withdrawal status
            await db.withdrawals.update_one(
                {"_id": withdrawal_id},
                {
                    "$set": {
                        "status": WithdrawalStatus.REJECTED,
                        "processed_by": admin_user.id,
                        "processed_at": datetime.utcnow(),
                        "admin_notes": request.admin_notes,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Return the amount back to model's available balance
            await db.model_profiles.update_one(
                {"_id": withdrawal["model_id"]},
                {
                    "$inc": {"available_balance": withdrawal["amount"]},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            message = "Withdrawal rejected successfully"
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Action must be 'approve' or 'reject'"
            )
        
        logger.info(f"Withdrawal {withdrawal_id} {request.action}d by admin {admin_user.id}")
        
        return {
            "success": True,
            "message": message,
            "withdrawal_id": withdrawal_id,
            "action": request.action
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing withdrawal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process withdrawal request"
        )