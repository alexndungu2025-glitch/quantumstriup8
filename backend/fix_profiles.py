#!/usr/bin/env python3
"""
Fix missing profiles for existing test users
"""

import asyncio
from database import (
    users_collection, 
    viewer_profiles_collection, 
    model_profiles_collection,
    client
)
from models import ViewerProfile, ModelProfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_profiles():
    """Create missing profiles for existing test users"""
    try:
        # Check viewer profile
        viewer_user = await users_collection.find_one({"email": "viewer@test.com"})
        if viewer_user:
            existing_profile = await viewer_profiles_collection.find_one({"user_id": viewer_user["_id"]})
            if not existing_profile:
                viewer_profile = ViewerProfile(
                    user_id=viewer_user["_id"],
                    token_balance=100.00
                )
                await viewer_profiles_collection.insert_one(viewer_profile.model_dump(by_alias=True))
                logger.info("Created viewer profile for viewer@test.com")
            else:
                logger.info("Viewer profile already exists")
        
        # Check model profile
        model_user = await users_collection.find_one({"email": "model@test.com"})
        if model_user:
            existing_profile = await model_profiles_collection.find_one({"user_id": model_user["_id"]})
            if not existing_profile:
                model_profile = ModelProfile(
                    user_id=model_user["_id"],
                    display_name="testmodel"
                )
                await model_profiles_collection.insert_one(model_profile.model_dump(by_alias=True))
                logger.info("Created model profile for model@test.com")
            else:
                logger.info("Model profile already exists")
                
        logger.info("Profile fix completed!")
        
    except Exception as e:
        logger.error(f"Error fixing profiles: {e}")
        raise e
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_profiles())