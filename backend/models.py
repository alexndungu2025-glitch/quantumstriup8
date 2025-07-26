from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    VIEWER = "viewer"
    MODEL = "model"
    ADMIN = "admin"

class TransactionType(str, Enum):
    PURCHASE = "purchase"
    TIP = "tip"
    PRIVATE_SHOW = "private_show"
    WITHDRAWAL = "withdrawal"
    EARNING = "earning"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class WithdrawalStatus(str, Enum):
    REQUESTED = "requested"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REJECTED = "rejected"

# MongoDB Document Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    username: str
    email: str
    phone: Optional[str] = None
    password_hash: str
    role: UserRole = UserRole.VIEWER
    is_active: bool = True
    is_verified: bool = False
    age: Optional[int] = None
    country: str = "ke"
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ViewerProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    token_balance: float = 0.00
    total_spent: float = 0.00
    favorite_models: List[str] = []
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ModelProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    display_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Streaming settings
    show_rate: int = 20  # tokens per minute
    is_live: bool = False
    is_available: bool = True
    
    # Stats
    total_earnings: float = 0.00
    available_balance: float = 0.00
    total_viewers: int = 0
    rating: float = 0.00
    total_shows: int = 0
    online_hours: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    last_online: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    transaction_type: TransactionType
    amount: float  # In KES for purchases, tokens for others
    tokens: Optional[int] = None  # Token amount
    status: TransactionStatus = TransactionStatus.PENDING
    
    # Payment details
    mpesa_code: Optional[str] = None  # M-Pesa confirmation code
    phone_number: Optional[str] = None
    reference: Optional[str] = None
    
    # Additional data
    model_id: Optional[str] = None  # For tips and private shows
    description: Optional[str] = None
    metadata: Optional[dict] = None  # Additional data
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class Withdrawal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    model_id: str
    amount: float  # Amount in KES
    phone_number: str
    status: WithdrawalStatus = WithdrawalStatus.REQUESTED
    
    # Processing details
    mpesa_code: Optional[str] = None
    admin_notes: Optional[str] = None
    processed_by: Optional[str] = None  # Admin user ID
    processed_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PrivateShow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    viewer_id: str
    model_id: str
    
    # Show details
    rate_per_minute: int  # tokens per minute
    duration_minutes: int = 0  # Actual duration
    total_cost: int = 0  # Total tokens spent
    
    # Status and timing
    status: str = "requested"  # requested, active, completed, cancelled
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class SystemSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    key: str
    value: str
    description: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }