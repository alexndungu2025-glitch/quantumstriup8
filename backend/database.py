from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

# MongoDB Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'quantumstrip')

# MongoDB client and database
client = AsyncIOMotorClient(MONGO_URL)
database = client[DB_NAME]

# Collections
users_collection = database.users
viewer_profiles_collection = database.viewer_profiles
model_profiles_collection = database.model_profiles
transactions_collection = database.transactions
withdrawals_collection = database.withdrawals
private_shows_collection = database.private_shows
system_settings_collection = database.system_settings

# Chat System Collections
chat_messages_collection = database.chat_messages
chat_rooms_collection = database.chat_rooms
chat_moderation_collection = database.chat_moderation_actions

async def get_database():
    """Get database instance"""
    return database

async def close_mongo_connection():
    """Close MongoDB connection"""
    client.close()