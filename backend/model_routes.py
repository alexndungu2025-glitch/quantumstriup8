from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
import logging
import os

from auth import get_current_user
from database import get_database
from models import User, UserRole, Transaction, TransactionType, TransactionStatus, ModelProfile, Withdrawal, WithdrawalStatus

logger = logging.getLogger(__name__)

router = APIRouter()

# Configuration from environment
MIN_WITHDRAWAL_AMOUNT = float(os.getenv("MIN_WITHDRAWAL_AMOUNT", 20000))
PLATFORM_REVENUE_SHARE = float(os.getenv("PLATFORM_REVENUE_SHARE", 50))

# Request/Response Models
class TipRequest(BaseModel):
    model_id: str = Field(..., description="ID of the model to tip")
    tokens: int = Field(..., ge=1, description="Number of tokens to tip")
    message: Optional[str] = Field(None, description="Optional tip message")

class WithdrawalRequest(BaseModel):
    amount: float = Field(..., ge=MIN_WITHDRAWAL_AMOUNT, description=f"Amount to withdraw (minimum KES {MIN_WITHDRAWAL_AMOUNT})")
    phone_number: str = Field(..., description="M-Pesa phone number for withdrawal")

class ModelEarningsResponse(BaseModel):
    model_id: str
    total_earnings: float
    available_balance: float
    pending_withdrawals: float
    total_withdrawn: float
    revenue_share_percentage: float

class WithdrawalHistoryResponse(BaseModel):
    id: str
    amount: float
    phone_number: str
    status: str
    created_at: datetime
    processed_at: Optional[datetime] = None
    mpesa_code: Optional[str] = None
    admin_notes: Optional[str] = None

class TipResponse(BaseModel):
    success: bool
    message: str
    transaction_id: Optional[str] = None
    remaining_balance: Optional[float] = None

# Tipping Routes
@router.post("/tip", response_model=TipResponse)
async def send_tip(
    request: TipRequest,
    current_user: User = Depends(get_current_user)
):
    """Send tip to a model"""
    try:
        db = await get_database()
        
        # Verify user has viewer role and enough tokens
        viewer_profile = await db.viewer_profiles.find_one({"user_id": current_user.id})
        if not viewer_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Viewer profile not found"
            )
        
        current_balance = viewer_profile.get('token_balance', 0)
        if current_balance < request.tokens:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient tokens. You have {current_balance} tokens, need {request.tokens}"
            )
        
        # Verify model exists and is active
        model_profile = await db.model_profiles.find_one({"_id": request.model_id})
        if not model_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model not found"
            )
        
        # Calculate earnings (model gets their share, platform takes commission)
        model_earnings = request.tokens * (100 - PLATFORM_REVENUE_SHARE) / 100
        platform_fee = request.tokens * PLATFORM_REVENUE_SHARE / 100
        
        # Create transaction records
        transaction_id = str(uuid.uuid4())
        
        # Tip transaction (viewer perspective)
        tip_transaction = Transaction(
            id=transaction_id,
            user_id=current_user.id,
            transaction_type=TransactionType.TIP,
            amount=request.tokens,  # Store as token amount
            tokens=request.tokens,
            status=TransactionStatus.COMPLETED,
            model_id=request.model_id,
            description=f"Tip to {model_profile.get('display_name', 'Model')}",
            metadata={
                "message": request.message,
                "model_earnings": model_earnings,
                "platform_fee": platform_fee
            }
        )
        
        # Earning transaction (model perspective)
        earning_transaction = Transaction(
            id=str(uuid.uuid4()),
            user_id=model_profile["user_id"],
            transaction_type=TransactionType.EARNING,
            amount=model_earnings,  # Model's earnings in tokens
            tokens=int(model_earnings),
            status=TransactionStatus.COMPLETED,
            description=f"Tip from {current_user.username}",
            metadata={
                "original_tip": request.tokens,
                "platform_fee": platform_fee,
                "tip_transaction_id": transaction_id
            }
        )
        
        # Start database transaction
        await db.transactions.insert_many([
            tip_transaction.model_dump(by_alias=True),
            earning_transaction.model_dump(by_alias=True)
        ])
        
        # Update viewer balance
        new_balance = current_balance - request.tokens
        await db.viewer_profiles.update_one(
            {"user_id": current_user.id},
            {
                "$set": {
                    "token_balance": new_balance,
                    "updated_at": datetime.utcnow()
                },
                "$inc": {"total_spent": request.tokens}
            }
        )
        
        # Update model earnings
        await db.model_profiles.update_one(
            {"_id": request.model_id},
            {
                "$inc": {
                    "total_earnings": model_earnings,
                    "available_balance": model_earnings
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        logger.info(f"Tip successful: {request.tokens} tokens from {current_user.id} to {request.model_id}")
        
        return TipResponse(
            success=True,
            message=f"Successfully sent {request.tokens} tokens tip!",
            transaction_id=transaction_id,
            remaining_balance=new_balance
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing tip: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process tip"
        )

# Model Earnings Routes
@router.get("/earnings", response_model=ModelEarningsResponse)
async def get_model_earnings(current_user: User = Depends(get_current_user)):
    """Get model's earnings summary"""
    try:
        if current_user.role != UserRole.MODEL:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only models can access earnings"
            )
        
        db = await get_database()
        
        # Get model profile
        model_profile = await db.model_profiles.find_one({"user_id": current_user.id})
        if not model_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model profile not found"
            )
        
        # Calculate pending withdrawals
        pending_withdrawals = await db.withdrawals.aggregate([
            {
                "$match": {
                    "model_id": model_profile["_id"],
                    "status": {"$in": [WithdrawalStatus.REQUESTED, WithdrawalStatus.PROCESSING]}
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(length=1)
        
        pending_amount = pending_withdrawals[0]["total"] if pending_withdrawals else 0
        
        # Calculate total withdrawn
        completed_withdrawals = await db.withdrawals.aggregate([
            {
                "$match": {
                    "model_id": model_profile["_id"],
                    "status": WithdrawalStatus.COMPLETED
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(length=1)
        
        total_withdrawn = completed_withdrawals[0]["total"] if completed_withdrawals else 0
        
        return ModelEarningsResponse(
            model_id=model_profile["_id"],
            total_earnings=model_profile.get("total_earnings", 0),
            available_balance=model_profile.get("available_balance", 0),
            pending_withdrawals=pending_amount,
            total_withdrawn=total_withdrawn,
            revenue_share_percentage=100 - PLATFORM_REVENUE_SHARE
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model earnings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get earnings"
        )

# Withdrawal Routes
@router.post("/withdraw")
async def request_withdrawal(
    request: WithdrawalRequest,
    current_user: User = Depends(get_current_user)
):
    """Request withdrawal of earnings"""
    try:
        if current_user.role != UserRole.MODEL:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only models can request withdrawals"
            )
        
        db = await get_database()
        
        # Get model profile
        model_profile = await db.model_profiles.find_one({"user_id": current_user.id})
        if not model_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model profile not found"
            )
        
        # Check available balance
        available_balance = model_profile.get("available_balance", 0)
        if available_balance < request.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient balance. Available: {available_balance} tokens, Requested: {request.amount}"
            )
        
        # Check minimum withdrawal amount
        if request.amount < MIN_WITHDRAWAL_AMOUNT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum withdrawal amount is KES {MIN_WITHDRAWAL_AMOUNT}"
            )
        
        # Create withdrawal request
        withdrawal = Withdrawal(
            model_id=model_profile["_id"],
            amount=request.amount,
            phone_number=request.phone_number
        )
        
        # Insert withdrawal request
        await db.withdrawals.insert_one(withdrawal.model_dump(by_alias=True))
        
        # Update model's available balance (reserve the amount)
        await db.model_profiles.update_one(
            {"_id": model_profile["_id"]},
            {
                "$inc": {"available_balance": -request.amount},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        logger.info(f"Withdrawal request created: {withdrawal.id} for model {model_profile['_id']}")
        
        return {
            "success": True,
            "message": "Withdrawal request submitted successfully. It will be processed within 24 hours.",
            "withdrawal_id": withdrawal.id,
            "amount": request.amount,
            "status": WithdrawalStatus.REQUESTED
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error requesting withdrawal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process withdrawal request"
        )

@router.get("/withdrawals", response_model=List[WithdrawalHistoryResponse])
async def get_withdrawal_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get model's withdrawal history"""
    try:
        if current_user.role != UserRole.MODEL:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only models can access withdrawal history"
            )
        
        db = await get_database()
        
        # Get model profile
        model_profile = await db.model_profiles.find_one({"user_id": current_user.id})
        if not model_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model profile not found"
            )
        
        # Get withdrawals
        withdrawals = await db.withdrawals.find(
            {"model_id": model_profile["_id"]}
        ).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
        
        return [
            WithdrawalHistoryResponse(
                id=withdrawal["_id"],
                amount=withdrawal["amount"],
                phone_number=withdrawal["phone_number"],
                status=withdrawal["status"],
                created_at=withdrawal["created_at"],
                processed_at=withdrawal.get("processed_at"),
                mpesa_code=withdrawal.get("mpesa_code"),
                admin_notes=withdrawal.get("admin_notes")
            )
            for withdrawal in withdrawals
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting withdrawal history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get withdrawal history"
        )

# Conversion rate (1 token = 1 KES for simplicity)
TOKEN_TO_KES_RATE = 1.0

def tokens_to_kes(tokens: float) -> float:
    """Convert tokens to KES"""
    return tokens * TOKEN_TO_KES_RATE

def kes_to_tokens(kes: float) -> float:
    """Convert KES to tokens"""
    return kes / TOKEN_TO_KES_RATE