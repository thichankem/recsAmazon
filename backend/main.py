from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

from database import products_collection, interactions_collection, users_collection
from recsys.content_based import get_content_based_recommendations
from recsys.collaborative import get_collaborative_recommendations

app = FastAPI(title="Recommendation System API")

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InteractionRequest(BaseModel):
    user_id: str
    product_id: str
    action: str = "click"

@app.get("/")
def read_root():
    return {"message": "Welcome to the Recommendation System API"}

@app.get("/api/products", response_model=List[Dict[str, Any]])
def get_products(q: str = None, limit: int = 50):
    query = {}
    if q:
        query = {"name": {"$regex": q, "$options": "i"}}
    products = list(products_collection.find(query).limit(limit))
    return products

@app.get("/api/products/{product_id}", response_model=Dict[str, Any])
def get_product(product_id: str):
    product = products_collection.find_one({"_id": product_id})
    if product:
        return product
    raise HTTPException(status_code=404, detail="Product not found")

@app.get("/api/users", response_model=List[Dict[str, Any]])
def get_users():
    users = list(users_collection.find({}, {"_id": 1, "name": 1}))
    # rename _id to id for frontend compatibility or just leave it
    # We will return _id and name
    return users

from datetime import datetime

@app.post("/api/interactions")
def log_interaction(interaction: InteractionRequest):
    data = interaction.dict()
    data["timestamp"] = datetime.now().astimezone().isoformat()
    interactions_collection.insert_one(data)
    return {"status": "success", "message": "Interaction logged"}

@app.get("/api/recommendations/home", response_model=List[Dict[str, Any]])
def get_home_recommendations(user_id: str, limit: int = 5):
    """
    Get Collaborative Filtering recommendations for the home page.
    """
    recommendations = get_collaborative_recommendations(user_id, top_n=limit)
    return recommendations

@app.get("/api/recommendations/related/{product_id}", response_model=List[Dict[str, Any]])
def get_related_recommendations(product_id: str, limit: int = 5):
    """
    Get Content-Based recommendations for the product detail page.
    """
    recommendations = get_content_based_recommendations(product_id, top_n=limit)
    return recommendations
