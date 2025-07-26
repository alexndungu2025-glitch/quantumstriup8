#!/usr/bin/env python3
"""
Create test users for QuantumStrip backend testing
"""

import asyncio
import sys
import os
sys.path.append('/app/backend')

from database import users_collection, viewer_profiles_collection, model_profiles_collection
from models import User, UserRole, ViewerProfile, ModelProfile
from auth import hash_password
import uuid

async def create_test_users():
    """Create test users for backend testing"""
    
    # Test viewer user
    viewer_user = User(
        username="testviewer",
        email="viewer@test.com",
        phone="254712345678",
        password_hash=hash_password("password123"),
        role=UserRole.VIEWER,
        age=25,
        country="ke"
    )
    
    # Check if viewer already exists
    existing_viewer = await users_collection.find_one({"email": "viewer@test.com"})
    if not existing_viewer:
        result = await users_collection.insert_one(viewer_user.model_dump(by_alias=True))
        viewer_user.id = result.inserted_id
        
        # Create viewer profile
        viewer_profile = ViewerProfile(user_id=viewer_user.id)
        await viewer_profiles_collection.insert_one(viewer_profile.model_dump(by_alias=True))
        print("✅ Test viewer user created")
    else:
        print("ℹ️ Test viewer user already exists")
    
    # Test model user
    model_user = User(
        username="testmodel",
        email="model@test.com",
        phone="254787654321",
        password_hash=hash_password("password123"),
        role=UserRole.MODEL,
        age=22,
        country="ke"
    )
    
    # Check if model already exists
    existing_model = await users_collection.find_one({"email": "model@test.com"})
    if not existing_model:
        result = await users_collection.insert_one(model_user.model_dump(by_alias=True))
        model_user.id = result.inserted_id
        
        # Create model profile
        model_profile = ModelProfile(
            user_id=model_user.id,
            display_name="testmodel"
        )
        await model_profiles_collection.insert_one(model_profile.model_dump(by_alias=True))
        print("✅ Test model user created")
    else:
        print("ℹ️ Test model user already exists")

if __name__ == "__main__":
    asyncio.run(create_test_users())