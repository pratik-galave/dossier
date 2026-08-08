"""
Async MongoDB client using Motor.
Provides a module-level client instance shared across the app.

Note: If MONGODB_URI is unreachable at startup the server still boots —
a warning is printed and DB operations will fail gracefully at request time.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import settings

# Module-level state
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    """Open the MongoDB connection. Called at app startup."""
    global _client, _db
    try:
        _client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        try:
            _db = _client.get_default_database()
        except Exception:
            _db = _client["dossier"]
        await _db.command("ping")
        print(f"[DB] Connected to MongoDB database '{_db.name}'")
    except Exception as exc:
        print(f"[DB] MongoDB connection error ({exc}). Sessions will not be persisted.")
        _client = None
        _db = None


async def close_db() -> None:
    """Close the MongoDB connection. Called at app shutdown."""
    global _client
    if _client is not None:
        _client.close()
        print("[DB] MongoDB connection closed.")


def get_db() -> AsyncIOMotorDatabase | None:
    """
    Return the active database instance, or None if not connected.
    Callers should handle None gracefully (e.g. in-memory fallback).
    """
    return _db
