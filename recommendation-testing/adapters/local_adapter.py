from typing import List, Dict, Any
from .base_adapter import BaseAdapter
from models.base_recommender import BaseRecommender
from utils.timer import Timer

class LocalAdapter(BaseAdapter):
    """Adapter that calls python models directly in-memory."""

    def __init__(self, recommender: BaseRecommender):
        self.recommender = recommender

    def get_recommendations(self, user_id: str, context_item_id: str = None, top_k: int = 10) -> Dict[str, Any]:
        result = {
            "items": [],
            "latency_ms": 0.0,
            "status_code": 200,
            "error": None
        }
        
        timer = Timer()
        try:
            with timer:
                items = self.recommender.recommend(user_id, context_item_id, top_k)
            result["items"] = items
            result["latency_ms"] = timer.get_duration_ms()
        except Exception as e:
            result["status_code"] = 500
            result["error"] = str(e)
            result["latency_ms"] = timer.get_duration_ms()
            
        return result
