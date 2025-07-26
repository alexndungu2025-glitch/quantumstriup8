import asyncio
from database import (
    users_collection, 
    viewer_profiles_collection, 
    model_profiles_collection,
    system_settings_collection,
    client
)
from models import User, UserRole, ViewerProfile, SystemSettings
from auth import hash_password
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # User indexes
        await users_collection.create_index([("email", 1)], unique=True)
        await users_collection.create_index([("username", 1)], unique=True)
        await users_collection.create_index([("role", 1)])
        
        # Viewer profile indexes
        await viewer_profiles_collection.create_index([("user_id", 1)], unique=True)
        
        # Model profile indexes
        await model_profiles_collection.create_index([("user_id", 1)], unique=True)
        await model_profiles_collection.create_index([("is_live", 1)])
        await model_profiles_collection.create_index([("is_available", 1)])
        
        # System settings indexes
        await system_settings_collection.create_index([("key", 1)], unique=True)
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
        raise e

async def init_system_settings():
    """Initialize default system settings"""
    try:
        # Default settings
        default_settings = [
            {
                "key": "platform_name",
                "value": "QuantumStrip",
                "description": "Platform name"
            },
            {
                "key": "private_show_rate",
                "value": "20",
                "description": "Default private show rate in tokens per minute"
            },
            {
                "key": "min_tip_amount",
                "value": "1", 
                "description": "Minimum tip amount in tokens"
            },
            {
                "key": "min_withdrawal_amount",
                "value": "20000",
                "description": "Minimum withdrawal amount in KES"
            },
            {
                "key": "platform_revenue_share",
                "value": "50",
                "description": "Platform revenue share percentage"
            },
            {
                "key": "token_packages",
                "value": '{"50": 500, "100": 1000, "200": 1900, "500": 4500, "1000": 8500}',
                "description": "Available token packages with prices in KES"
            }
        ]
        
        for setting_data in default_settings:
            existing = await system_settings_collection.find_one({"key": setting_data["key"]})
            
            if not existing:
                setting = SystemSettings(**setting_data)
                await system_settings_collection.insert_one(setting.model_dump(by_alias=True))
                logger.info(f"Added system setting: {setting_data['key']}")
        
        logger.info("System settings initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing system settings: {e}")
        raise e

async def create_admin_user():
    """Create default admin user"""
    try:
        # Check if admin exists
        admin_exists = await users_collection.find_one({"role": UserRole.ADMIN})
        
        if not admin_exists:
            admin_user = User(
                username="admin",
                email="admin@quantumstrip.com",
                phone="254700000000",
                password_hash=hash_password("admin123"),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                age=25,
                country="ke"
            )
            
            await users_collection.insert_one(admin_user.model_dump(by_alias=True))
            logger.info("Default admin user created: admin@quantumstrip.com / admin123")
        else:
            logger.info("Admin user already exists")
            
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        raise e

async def create_test_users():
    """Create test users for development"""
    try:
        # Test viewer
        test_viewer_exists = await users_collection.find_one({"email": "viewer@test.com"})
        if not test_viewer_exists:
            test_viewer = User(
                username="testviewer",
                email="viewer@test.com",
                phone="254712345678",
                password_hash=hash_password("password123"),
                role=UserRole.VIEWER,
                is_active=True,
                is_verified=True,
                age=25,
                country="ke"
            )
            result = await users_collection.insert_one(test_viewer.model_dump(by_alias=True))
            
            # Create viewer profile
            viewer_profile = ViewerProfile(
                user_id=result.inserted_id,
                token_balance=100.00  # Give test user some tokens
            )
            await viewer_profiles_collection.insert_one(viewer_profile.model_dump(by_alias=True))
            logger.info("Test viewer created: viewer@test.com / password123")
        
        # Test model
        test_model_exists = await users_collection.find_one({"email": "model@test.com"})
        if not test_model_exists:
            test_model = User(
                username="testmodel",
                email="model@test.com",
                phone="254787654321",
                password_hash=hash_password("password123"),
                role=UserRole.MODEL,
                is_active=True,
                is_verified=True,
                age=22,
                country="ke"
            )
            result = await users_collection.insert_one(test_model.model_dump(by_alias=True))
            
            # Create model profile
            from models import ModelProfile
            model_profile = ModelProfile(
                user_id=result.inserted_id,
                display_name="testmodel"
            )
            await model_profiles_collection.insert_one(model_profile.model_dump(by_alias=True))
            logger.info("Test model created: model@test.com / password123")
            
    except Exception as e:
        logger.error(f"Error creating test users: {e}")
        raise e

async def main():
    """Initialize the database"""
    try:
        logger.info("Starting QuantumStrip database initialization...")
        
        # Step 1: Create indexes
        logger.info("Creating database indexes...")
        await create_indexes()
        
        # Step 2: Initialize system settings
        logger.info("Initializing system settings...")
        await init_system_settings()
        
        # Step 3: Create admin user
        logger.info("Creating admin user...")
        await create_admin_user()
        
        # Step 4: Create test users (for development)
        logger.info("Creating test users...")
        await create_test_users()
        
        logger.info("Database initialization completed successfully!")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise e
    finally:
        # Close the MongoDB connection
        client.close()

if __name__ == "__main__":
    asyncio.run(main())