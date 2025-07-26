from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from datetime import datetime
from database import users_collection, viewer_profiles_collection, model_profiles_collection
from models import User, UserRole, ViewerProfile, ModelProfile
from schemas import (
    UserCreate, UserLogin, TokenResponse, UserResponse,
    ViewerDashboard, ModelDashboard, SuccessResponse
)
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_current_viewer, get_current_model
)
import uuid

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    
    # Check if email already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = await users_collection.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    user = User(
        username=user_data.username,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        age=user_data.age,
        country=user_data.country
    )
    
    # Insert user into database
    result = await users_collection.insert_one(user.model_dump(by_alias=True))
    user.id = result.inserted_id
    
    # Create role-specific profile
    if user_data.role == UserRole.VIEWER:
        viewer_profile = ViewerProfile(user_id=user.id)
        await viewer_profiles_collection.insert_one(viewer_profile.model_dump(by_alias=True))
    elif user_data.role == UserRole.MODEL:
        model_profile = ModelProfile(
            user_id=user.id,
            display_name=user_data.username  # Default display name
        )
        await model_profiles_collection.insert_one(model_profile.model_dump(by_alias=True))
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    # Prepare user response
    user_response = UserResponse(**user.model_dump())
    
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )

@router.post("/login", response_model=TokenResponse)
async def login_user(login_data: UserLogin):
    """Authenticate user and return access token"""
    
    # Find user by email
    user_data = await users_collection.find_one({"email": login_data.email})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user = User(**user_data)
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )
    
    # Update last login
    await users_collection.update_one(
        {"_id": user.id},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    # Prepare user response
    user_response = UserResponse(**user.model_dump())
    
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(**current_user.model_dump())

@router.get("/viewer/dashboard", response_model=ViewerDashboard)
async def get_viewer_dashboard(current_user: User = Depends(get_current_viewer)):
    """Get viewer dashboard data"""
    
    # Get viewer profile
    profile_data = await viewer_profiles_collection.find_one({"user_id": current_user.id})
    if not profile_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viewer profile not found"
        )
    
    profile = ViewerProfile(**profile_data)
    
    # TODO: Get recent transactions
    recent_transactions = []
    
    return ViewerDashboard(
        user=UserResponse(**current_user.model_dump()),
        profile=profile,
        recent_transactions=recent_transactions
    )

@router.get("/model/dashboard", response_model=ModelDashboard)
async def get_model_dashboard(current_user: User = Depends(get_current_model)):
    """Get model dashboard data"""
    
    # Get model profile
    profile_data = await model_profiles_collection.find_one({"user_id": current_user.id})
    if not profile_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model profile not found"
        )
    
    profile = ModelProfile(**profile_data)
    
    # TODO: Get recent earnings
    recent_earnings = []
    
    return ModelDashboard(
        user=UserResponse(**current_user.model_dump()),
        profile=profile,
        recent_earnings=recent_earnings,
        total_earnings_today=0.00
    )

@router.put("/model/profile", response_model=SuccessResponse)
async def update_model_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_model)
):
    """Update model profile"""
    
    # Update model profile
    update_data = {
        "updated_at": datetime.utcnow()
    }
    
    # Add allowed fields to update
    allowed_fields = ["display_name", "bio", "show_rate", "is_available"]
    for field in allowed_fields:
        if field in profile_data:
            update_data[field] = profile_data[field]
    
    await model_profiles_collection.update_one(
        {"user_id": current_user.id},
        {"$set": update_data}
    )
    
    return SuccessResponse(message="Profile updated successfully")

@router.post("/logout", response_model=SuccessResponse)
async def logout_user():
    """Logout user (client should remove token)"""
    return SuccessResponse(message="Logged out successfully")