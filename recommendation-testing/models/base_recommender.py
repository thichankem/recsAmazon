from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseRecommender(ABC):
    """Base interface for all recommender systems models."""

    @abstractmethod
    def train(self, data: Any) -> None:
        """Train the recommendation model on historical data."""
        pass

    @abstractmethod
    def recommend(self, user_id: str, context_item_id: str = None, top_k: int = 10, search_query: str = None, **kwargs) -> List[Dict[str, Any]]:
        """
        Generate recommendations for a user.
        
        Args:
            user_id: The ID of the user request.
            context_item_id: Optional context item being viewed.
            top_k: The number of items to recommend.
            search_query: Optional search keyword context.
            **kwargs: Extra parameters (like accessory_boost).
            
        Returns:
            A list of dictionary objects, where each object contains {"item_id": str, "score": float}
        """
        pass

    def register_item(self, item_id: str, title: str, categories: List[str], brand: str) -> None:
        """Register a new item dynamically."""
        pass

