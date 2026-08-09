"""
Stub MongoDB client module for deployment environments without Motor/MongoDB.
"""

async def connect_db():
    print("[DB] Skipping MongoDB - using in-memory storage")
    return None

async def close_db():
    pass

def get_db():
    return None
