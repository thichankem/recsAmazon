import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)

db = client["recsys_db"]

# Collections
users_collection = db["users"]
products_collection = db["products"]
interactions_collection = db["interactions"]

def get_db():
    return db
