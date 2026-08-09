"""
MongoDB client setup using Motor.
"""

from motor.motor_asyncio import AsyncIOMotorClient
import logging
from config import settings

logger = logging.getLogger(__name__)

client = None
db = None


async def connect_db():
    """Establish connection to MongoDB on startup."""
    global client, db
    try:
        if settings.MONGODB_URI:
            client = AsyncIOMotorClient(settings.MONGODB_URI)
            db = client.get_default_database()
            logger.info("[DB] Connected to MongoDB")
        else:
            logger.warning("[DB] MONGODB_URI not set")
    except Exception as exc:
        logger.error(f"[DB] Failed to connect to MongoDB: {exc}")


async def close_db():
    """Close MongoDB connection on shutdown."""
    global client
    if client:
        client.close()
        logger.info("[DB] Closed MongoDB connection")


def get_db():
    """Return the active MongoDB database instance."""
    return db
