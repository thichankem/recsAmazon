from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

from database import supabase
from recsys.content_based import get_content_based_recommendations
from recsys.collaborative import get_collaborative_recommendations

app = FastAPI(title="Recommendation System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreateUserRequest(BaseModel):
    name: str
    user_id: str = None

class InteractionRequest(BaseModel):
    user_id: str
    product_id: str
    action: str = "click"
    rating_score: float = None

@app.get("/")
def read_root():
    return {"message": "Welcome to the Recommendation System API"}

@app.get("/api/products", response_model=List[Dict[str, Any]])
def get_products(q: str = None, limit: int = 50):
    query = supabase.table('products').select('*')
    if q:
        query = query.ilike('name', f'%{q}%')
    response = query.limit(limit).execute()
    return response.data

@app.get("/api/products/{product_id}", response_model=Dict[str, Any])
def get_product(product_id: str):
    response = supabase.table('products').select('*').eq('_id', product_id).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    raise HTTPException(status_code=404, detail="Product not found")

@app.get("/api/users", response_model=List[Dict[str, Any]])
def get_users():
    response = supabase.table('users').select('_id, name').execute()
    return response.data

@app.post("/api/users", response_model=Dict[str, Any])
def create_user(user: CreateUserRequest):
    user_id = user.user_id or f"user_{int(datetime.now().timestamp())}"
    data = {"_id": user_id, "name": user.name}
    response = supabase.table('users').insert(data).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    raise HTTPException(status_code=400, detail="Failed to create user")

@app.post("/api/interactions")
def log_interaction(interaction: InteractionRequest):
    data = interaction.dict()
    data.pop("rating_score", None)
    data = {k: v for k, v in data.items() if v is not None}
    data["timestamp"] = datetime.now().astimezone().isoformat()
    supabase.table('interactions').insert(data).execute()
    return {"status": "success", "message": "Interaction logged"}

@app.get("/api/recommendations/home", response_model=List[Dict[str, Any]])
def get_home_recommendations(user_id: str, limit: int = 5):
    return get_collaborative_recommendations(user_id, top_n=limit)

@app.get("/api/recommendations/related/{product_id}", response_model=List[Dict[str, Any]])
def get_related_recommendations(product_id: str, limit: int = 5):
    return get_content_based_recommendations(product_id, top_n=limit)
