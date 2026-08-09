import asyncio
import os
from dotenv import load_dotenv

load_dotenv(override=True)
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    uri = os.getenv("MONGODB_URI")
    print(f"Connecting to: {uri}")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    try:
        # ping the database
        await client.admin.command('ping')
        print("MongoDB connection SUCCESS!")
        
        db = client.get_default_database()
        count = await db["sessions"].count_documents({})
        print(f"Found {count} sessions in the database.")
    except Exception as e:
        print(f"MongoDB connection FAILED: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check())
