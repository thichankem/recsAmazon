from typing import List, Dict, Any
from .base_recommender import BaseRecommender

class ContentBasedRecommender(BaseRecommender):
    """Content-Based Recommendation model."""

    def __init__(self):
        self.item_features = {}

    def train(self, data: Any) -> None:
        # Mock training: map item descriptions or categories
        if isinstance(data, dict) and "items" in data:
            for item in data["items"]:
                self.item_features[item["item_id"]] = item.get("categories", [])

    def recommend(self, user_id: str, context_item_id: str = None, top_k: int = 10) -> List[Dict[str, Any]]:
        # If context_item_id is provided, recommend items with similar features/categories
        recommendations = []
        if context_item_id and context_item_id in self.item_features:
            target_cats = set(self.item_features[context_item_id])
            for item_id, cats in self.item_features.items():
                if item_id == context_item_id:
                    continue
                intersection = len(target_cats.intersection(cats))
                if intersection > 0:
                    recommendations.append({
                        "item_id": item_id,
                        "score": float(intersection) / max(len(target_cats.union(cats)), 1)
                    })
        
        # Fallback to general mock recommendations if no matching content items
        if not recommendations:
            for i in range(1, top_k + 1):
                recommendations.append({"item_id": f"item_cb_{i}", "score": 1.0 / i})

        # Sort by score descending and return top K
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:top_k]
