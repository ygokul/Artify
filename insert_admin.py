from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId

# MongoDB connection
MONGODB_URI = "mongodb://localhost:27017/artify"
client = MongoClient(MONGODB_URI)

# Database & collection
db = client["artify"]
collection = db["users"]  # change if your collection name is different

# Admin document
admin_user = {
    "_id": ObjectId("696234c0dcbcea22d168e11b"),
    "name": "admin",
    "email": "admin@gmail.com",
    "password": "Admin@123",  # ⚠️ Hash this in production
    "createdAt": datetime(2026, 1, 10, 11, 15, 12, 845000),
    "role": "admin",
    "__v": 0
}

# Insert document
result = collection.insert_one(admin_user)

print("Admin user inserted with ID:", result.inserted_id)