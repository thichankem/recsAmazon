from typing import List, Dict, Any
from .base_recommender import BaseRecommender
from .content_based import ContentBasedRecommender
from .collaborative_filtering import CollaborativeFilteringRecommender

class HybridRecommender(BaseRecommender):
    """Hybrid Recommendation model combining Content-Based and Collaborative Filtering."""

    def __init__(self, cb_weight: float = 0.5, cf_weight: float = 0.5):
        self.cb_model = ContentBasedRecommender()
        self.cf_model = CollaborativeFilteringRecommender()
        self.cb_weight = cb_weight
        self.cf_weight = cf_weight

    def train(self, data: Any) -> None:
        # Pass relevant portions of dataset to sub-models
        self.cb_model.train(data)
        
        # Collaborative filtering needs raw interactions
        interactions = data.get("interactions", []) if isinstance(data, dict) else data
        self.cf_model.train(interactions)

    def recommend(self, user_id: str, context_item_id: str = None, top_k: int = 10) -> List[Dict[str, Any]]:
        cb_recs = self.cb_model.recommend(user_id, context_item_id, top_k * 2)
        cf_recs = self.cf_model.recommend(user_id, context_item_id, top_k * 2)

        # Merge scores
        merged_scores = {}
        for rec in cb_recs:
            merged_scores[rec["item_id"]] = merged_scores.get(rec["item_id"], 0.0) + rec["score"] * self.cb_weight

        for rec in cf_recs:
            merged_scores[rec["item_id"]] = merged_scores.get(rec["item_id"], 0.0) + rec["score"] * self.cf_weight

        # Convert back to list and sort
        recommendations = [{"item_id": i_id, "score": score} for i_id, score in merged_scores.items()]
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        return recommendations[:top_k]
