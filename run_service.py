import os
from fastapi import FastAPI, HTTPException, Query
from src.service_online import OnlineRecommenderService

app = FastAPI(
    title="Amazon Product Recommendation API",
    description="Online Serving Engine supporting 3-layer Static Cold-start defense.",
    version="2.0.0"
)

# Initialize recommender service
DB_PATH = os.getenv("RECOMMENDER_DB", "db/recommendations.db")
service = OnlineRecommenderService(db_path=DB_PATH)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Amazon Personalized Static Recommendation Engine",
        "database": DB_PATH,
        "db_exists": os.path.exists(DB_PATH)
    }

@app.get("/recommendations")
def get_recommendations(
    user_id: str = Query(..., description="The unique ID of the user"),
    category: str = Query(None, description="Current category context (optional)"),
    limit: int = Query(10, ge=1, le=50, description="Number of items to recommend")
):
    """
    Retrieves personalized recommendations for a user.
    Uses 3-layer static fallback: SVD -> Category Top Rated -> Global Top Rated.
    """
    if not os.path.exists(DB_PATH):
        raise HTTPException(
            status_code=503, 
            detail="Recommendation database not initialized. Please run the offline pipeline first."
        )
        
    try:
        recs = service.get_recommendations(user_id=user_id, category_context=category, limit=limit)
        return recs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
