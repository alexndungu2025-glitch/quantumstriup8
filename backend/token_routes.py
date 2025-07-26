from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
import logging

from auth import get_current_user
from database import get_database
from models import User, Transaction, TransactionType, TransactionStatus, ViewerProfile, ModelProfile
from mpesa_service import mpesa_service, get_available_packages, get_token_price

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class TokenPurchaseRequest(BaseModel):
    tokens: int = Field(..., description="Number of tokens to purchase")
    phone_number: str = Field(..., description="M-Pesa phone number")

class TokenPurchaseResponse(BaseModel):
    success: bool
    message: str
    transaction_id: Optional[str] = None
    checkout_request_id: Optional[str] = None
    customer_message: Optional[str] = None
    tokens: Optional[int] = None
    amount: Optional[float] = None

class TokenBalanceResponse(BaseModel):
    user_id: str
    token_balance: float
    total_spent: float

class TransactionHistoryResponse(BaseModel):
    id: str
    transaction_type: str
    amount: float
    tokens: Optional[int]
    status: str
    description: Optional[str]
    created_at: datetime
    mpesa_code: Optional[str] = None

class TokenPackagesResponse(BaseModel):
    packages: dict[int, float]

class MpesaCallbackRequest(BaseModel):
    Body: dict

# Token Package Routes
@router.get("/packages", response_model=TokenPackagesResponse)
async def get_token_packages():
    """Get available token packages"""
    try:
        packages = get_available_packages()
        return TokenPackagesResponse(packages=packages)
    except Exception as e:
        logger.error(f"Error getting token packages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get token packages"
        )

# Token Purchase Routes
@router.post("/purchase", response_model=TokenPurchaseResponse)
async def purchase_tokens(
    request: TokenPurchaseRequest,
    current_user: User = Depends(get_current_user)
):
    """Initiate token purchase via M-Pesa STK push"""
    try:
        db = await get_database()
        
        # Validate token package
        amount = get_token_price(request.tokens)
        if not amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid token package. Available packages: {list(get_available_packages().keys())}"
            )
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        transaction = Transaction(
            id=transaction_id,
            user_id=current_user.id,
            transaction_type=TransactionType.PURCHASE,
            amount=amount,
            tokens=request.tokens,
            status=TransactionStatus.PENDING,
            phone_number=request.phone_number,
            description=f"Purchase {request.tokens} tokens for KES {amount}"
        )
        
        # Save transaction to database
        await db.transactions.insert_one(transaction.model_dump(by_alias=True))
        
        # Initiate M-Pesa STK push
        mpesa_response = mpesa_service.initiate_stk_push(
            phone_number=request.phone_number,
            amount=amount,
            transaction_id=transaction_id,
            account_reference=f"QS-{current_user.username}",
            transaction_desc=f"QuantumStrip {request.tokens} tokens"
        )
        
        if mpesa_response['success']:
            # Update transaction with M-Pesa details
            await db.transactions.update_one(
                {"_id": transaction_id},
                {
                    "$set": {
                        "metadata": {
                            "merchant_request_id": mpesa_response.get('merchant_request_id'),
                            "checkout_request_id": mpesa_response.get('checkout_request_id'),
                            "response_code": mpesa_response.get('response_code')
                        },
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return TokenPurchaseResponse(
                success=True,
                message="STK push sent successfully. Please check your phone to complete payment.",
                transaction_id=transaction_id,
                checkout_request_id=mpesa_response.get('checkout_request_id'),
                customer_message=mpesa_response.get('customer_message'),
                tokens=request.tokens,
                amount=amount
            )
        else:
            # Update transaction status to failed
            await db.transactions.update_one(
                {"_id": transaction_id},
                {
                    "$set": {
                        "status": TransactionStatus.FAILED,
                        "metadata": mpesa_response,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return TokenPurchaseResponse(
                success=False,
                message=mpesa_response.get('message', 'Failed to initiate payment'),
                transaction_id=transaction_id
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error purchasing tokens: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process token purchase"
        )

@router.get("/balance", response_model=TokenBalanceResponse)
async def get_token_balance(current_user: User = Depends(get_current_user)):
    """Get user's current token balance"""
    try:
        db = await get_database()
        
        # Get viewer profile
        viewer_profile = await db.viewer_profiles.find_one({"user_id": current_user.id})
        
        if not viewer_profile:
            # Create viewer profile if it doesn't exist
            new_profile = ViewerProfile(user_id=current_user.id)
            await db.viewer_profiles.insert_one(new_profile.model_dump(by_alias=True))
            
            return TokenBalanceResponse(
                user_id=current_user.id,
                token_balance=0.0,
                total_spent=0.0
            )
        
        return TokenBalanceResponse(
            user_id=current_user.id,
            token_balance=viewer_profile.get('token_balance', 0.0),
            total_spent=viewer_profile.get('total_spent', 0.0)
        )
        
    except Exception as e:
        logger.error(f"Error getting token balance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get token balance"
        )

@router.get("/transactions", response_model=List[TransactionHistoryResponse])
async def get_transaction_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get user's transaction history"""
    try:
        db = await get_database()
        
        transactions = await db.transactions.find(
            {"user_id": current_user.id}
        ).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
        
        return [
            TransactionHistoryResponse(
                id=transaction["_id"],
                transaction_type=transaction["transaction_type"],
                amount=transaction["amount"],
                tokens=transaction.get("tokens"),
                status=transaction["status"],
                description=transaction.get("description"),
                created_at=transaction["created_at"],
                mpesa_code=transaction.get("mpesa_code")
            )
            for transaction in transactions
        ]
        
    except Exception as e:
        logger.error(f"Error getting transaction history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get transaction history"
        )

# M-Pesa Callback Routes
@router.post("/mpesa/callback")
async def mpesa_callback(callback_data: dict):
    """Handle M-Pesa STK push callback"""
    try:
        logger.info(f"M-Pesa Callback received: {callback_data}")
        
        db = await get_database()
        
        # Extract callback data
        body = callback_data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        
        merchant_request_id = stk_callback.get('MerchantRequestID')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        
        if not checkout_request_id:
            logger.error("No CheckoutRequestID in callback")
            return {"status": "error", "message": "Invalid callback data"}
        
        # Find transaction by checkout_request_id
        transaction = await db.transactions.find_one({
            "metadata.checkout_request_id": checkout_request_id
        })
        
        if not transaction:
            logger.error(f"Transaction not found for CheckoutRequestID: {checkout_request_id}")
            return {"status": "error", "message": "Transaction not found"}
        
        if result_code == 0:  # Success
            # Extract payment details
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])
            
            mpesa_code = None
            phone_number = None
            amount_paid = None
            
            for item in items:
                name = item.get('Name', '')
                if name == 'MpesaReceiptNumber':
                    mpesa_code = item.get('Value')
                elif name == 'PhoneNumber':
                    phone_number = str(item.get('Value'))
                elif name == 'Amount':
                    amount_paid = float(item.get('Value'))
            
            # Update transaction to completed
            await db.transactions.update_one(
                {"_id": transaction["_id"]},
                {
                    "$set": {
                        "status": TransactionStatus.COMPLETED,
                        "mpesa_code": mpesa_code,
                        "updated_at": datetime.utcnow(),
                        "metadata.callback_data": callback_data
                    }
                }
            )
            
            # Add tokens to user's balance
            tokens_to_add = transaction.get('tokens', 0)
            await db.viewer_profiles.update_one(
                {"user_id": transaction["user_id"]},
                {
                    "$inc": {
                        "token_balance": tokens_to_add,
                        "total_spent": transaction["amount"]
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                },
                upsert=True
            )
            
            logger.info(f"Payment successful: {mpesa_code}, added {tokens_to_add} tokens to user {transaction['user_id']}")
            
        else:  # Payment failed
            await db.transactions.update_one(
                {"_id": transaction["_id"]},
                {
                    "$set": {
                        "status": TransactionStatus.FAILED,
                        "updated_at": datetime.utcnow(),
                        "metadata.callback_data": callback_data,
                        "metadata.failure_reason": result_desc
                    }
                }
            )
            
            logger.info(f"Payment failed: {result_desc} for transaction {transaction['_id']}")
        
        return {"status": "success", "message": "Callback processed"}
        
    except Exception as e:
        logger.error(f"Error processing M-Pesa callback: {e}")
        return {"status": "error", "message": "Failed to process callback"}

@router.get("/mpesa/status/{checkout_request_id}")
async def check_payment_status(
    checkout_request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check the status of an M-Pesa payment"""
    try:
        db = await get_database()
        
        # Find transaction
        transaction = await db.transactions.find_one({
            "user_id": current_user.id,
            "metadata.checkout_request_id": checkout_request_id
        })
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        # Query M-Pesa for status
        mpesa_status = mpesa_service.query_stk_push_status(checkout_request_id)
        
        return {
            "transaction_id": transaction["_id"],
            "status": transaction["status"],
            "mpesa_status": mpesa_status,
            "tokens": transaction.get("tokens"),
            "amount": transaction["amount"],
            "created_at": transaction["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking payment status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check payment status"
        )