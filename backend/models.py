from sqlalchemy import Column, Integer, String, Boolean, DateTime, Decimal, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum
from datetime import datetime
import uuid

# Enums
class UserRole(enum.Enum):
    VIEWER = "viewer"
    MODEL = "model"
    ADMIN = "admin"

class TransactionType(enum.Enum):
    PURCHASE = "purchase"
    TIP = "tip"
    PRIVATE_SHOW = "private_show"
    WITHDRAWAL = "withdrawal"
    EARNING = "earning"

class TransactionStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class WithdrawalStatus(enum.Enum):
    REQUESTED = "requested"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REJECTED = "rejected"

# User Model
class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    age = Column(Integer, nullable=True)
    country = Column(String(5), default="ke")  # Country code
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    viewer_profile = relationship("ViewerProfile", back_populates="user", uselist=False)
    model_profile = relationship("ModelProfile", back_populates="user", uselist=False)
    transactions = relationship("Transaction", back_populates="user")
    
# Viewer Profile
class ViewerProfile(Base):
    __tablename__ = "viewer_profiles"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    token_balance = Column(Decimal(10, 2), default=0.00)
    total_spent = Column(Decimal(10, 2), default=0.00)
    favorite_models = Column(Text, nullable=True)  # JSON string of model IDs
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="viewer_profile")

# Model Profile
class ModelProfile(Base):
    __tablename__ = "model_profiles"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Streaming settings
    show_rate = Column(Integer, default=20)  # tokens per minute
    is_live = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)
    
    # Stats
    total_earnings = Column(Decimal(10, 2), default=0.00)
    available_balance = Column(Decimal(10, 2), default=0.00)
    total_viewers = Column(Integer, default=0)
    rating = Column(Decimal(3, 2), default=0.00)
    total_shows = Column(Integer, default=0)
    online_hours = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_online = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="model_profile")
    withdrawals = relationship("Withdrawal", back_populates="model")

# Transaction Model
class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Decimal(10, 2), nullable=False)  # In KES for purchases, tokens for others
    tokens = Column(Integer, nullable=True)  # Token amount
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    
    # Payment details
    mpesa_code = Column(String(20), nullable=True)  # M-Pesa confirmation code
    phone_number = Column(String(15), nullable=True)
    reference = Column(String(100), nullable=True)
    
    # Additional data
    model_id = Column(String(36), nullable=True)  # For tips and private shows
    description = Column(String(255), nullable=True)
    metadata = Column(Text, nullable=True)  # JSON string for additional data
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="transactions")

# Withdrawal Model
class Withdrawal(Base):
    __tablename__ = "withdrawals"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String(36), ForeignKey("model_profiles.id"), nullable=False)
    amount = Column(Decimal(10, 2), nullable=False)  # Amount in KES
    phone_number = Column(String(15), nullable=False)
    status = Column(Enum(WithdrawalStatus), default=WithdrawalStatus.REQUESTED)
    
    # Processing details
    mpesa_code = Column(String(20), nullable=True)
    admin_notes = Column(Text, nullable=True)
    processed_by = Column(String(36), nullable=True)  # Admin user ID
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    model = relationship("ModelProfile", back_populates="withdrawals")

# Private Show Model
class PrivateShow(Base):
    __tablename__ = "private_shows"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    viewer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    model_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Show details
    rate_per_minute = Column(Integer, nullable=False)  # tokens per minute
    duration_minutes = Column(Integer, default=0)  # Actual duration
    total_cost = Column(Integer, default=0)  # Total tokens spent
    
    # Status and timing
    status = Column(String(20), default="requested")  # requested, active, completed, cancelled
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# System Settings Model
class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())