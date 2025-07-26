from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from database import close_mongo_connection
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime

# Import all route modules
from auth_routes import router as auth_router
from token_routes import router as token_router
from model_routes import router as model_router
from admin_routes import router as admin_router
from streaming_routes import router as streaming_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="QuantumStrip API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Basic health check models (keeping for compatibility)
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Basic routes
@api_router.get("/")
async def root():
    return {
        "message": "QuantumStrip API v1.0.0",
        "platform": os.getenv("PLATFORM_NAME", "QuantumStrip"),
        "status": "running"
    }

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

# Include all routers
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(token_router, prefix="/tokens", tags=["Token System"])
api_router.include_router(model_router, prefix="/models", tags=["Model Features"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin Panel"])
api_router.include_router(streaming_router, prefix="/streaming", tags=["Live Streaming"])

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("QuantumStrip API starting up...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("QuantumStrip API shutting down...")
    await close_mongo_connection()
