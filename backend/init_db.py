import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
from database import create_tables, engine
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database():
    """Create the QuantumStrip database if it doesn't exist"""
    try:
        # Connect to MySQL server without specifying database
        connection = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            port=int(os.getenv("MYSQL_PORT", "3306")),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", "")
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            database_name = os.getenv("MYSQL_DATABASE", "quantumstrip")
            
            # Create database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name}")
            logger.info(f"Database '{database_name}' created or already exists")
            
            # Use the database
            cursor.execute(f"USE {database_name}")
            logger.info(f"Using database '{database_name}'")
            
            cursor.close()
            connection.close()
            
    except Error as e:
        logger.error(f"Error creating database: {e}")
        raise e

def init_system_settings():
    """Initialize default system settings"""
    from models import SystemSettings
    from database import SessionLocal
    
    db = SessionLocal()
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
        
        for setting in default_settings:
            existing = db.query(SystemSettings).filter(
                SystemSettings.key == setting["key"]
            ).first()
            
            if not existing:
                new_setting = SystemSettings(**setting)
                db.add(new_setting)
                logger.info(f"Added system setting: {setting['key']}")
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error initializing system settings: {e}")
        raise e
    finally:
        db.close()

def create_admin_user():
    """Create default admin user"""
    from models import User, UserRole
    from auth import hash_password
    from database import SessionLocal
    
    db = SessionLocal()
    try:
        # Check if admin exists
        admin_exists = db.query(User).filter(
            User.role == UserRole.ADMIN
        ).first()
        
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
            
            db.add(admin_user)
            db.commit()
            logger.info("Default admin user created: admin@quantumstrip.com / admin123")
        else:
            logger.info("Admin user already exists")
            
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating admin user: {e}")
        raise e
    finally:
        db.close()

def main():
    """Initialize the database and create all tables"""
    try:
        logger.info("Starting database initialization...")
        
        # Step 1: Create database
        create_database()
        
        # Step 2: Create all tables
        logger.info("Creating database tables...")
        create_tables()
        logger.info("Database tables created successfully")
        
        # Step 3: Initialize system settings
        logger.info("Initializing system settings...")
        init_system_settings()
        
        # Step 4: Create admin user
        logger.info("Creating admin user...")
        create_admin_user()
        
        logger.info("Database initialization completed successfully!")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise e

if __name__ == "__main__":
    main()