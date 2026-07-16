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

    def register_item(self, item_id: str, title: str, categories: List[str], brand: str) -> None:
        self.cb_model.register_item(item_id, title, categories, brand)
        self.cf_model.register_item(item_id, title, categories, brand)

    def recommend(self, user_id: str, context_item_id: str = None, top_k: int = 10, search_query: str = None, **kwargs) -> List[Dict[str, Any]]:
        cb_recs = self.cb_model.recommend(user_id, context_item_id, top_k * 2, search_query, **kwargs)
        cf_recs = self.cf_model.recommend(user_id, context_item_id, top_k * 2, search_query, **kwargs)

        # Merge scores
        merged_scores = {}
        item_details = {}

        for rec in cb_recs:
            i_id = rec["item_id"]
            merged_scores[i_id] = merged_scores.get(i_id, 0.0) + rec["score"] * self.cb_weight
            item_details[i_id] = {
                "title": rec.get("title", f"Product {i_id}"),
                "brand": rec.get("brand", "Unknown"),
                "categories": rec.get("categories", [])
            }

        for rec in cf_recs:
            i_id = rec["item_id"]
            merged_scores[i_id] = merged_scores.get(i_id, 0.0) + rec["score"] * self.cf_weight
            if i_id not in item_details:
                feats = self.cb_model.item_features.get(i_id, {})
                item_details[i_id] = {
                    "title": feats.get("title", f"Product {i_id}"),
                    "brand": feats.get("brand", "Unknown"),
                    "categories": feats.get("categories", [])
                }

        # Convert back to list and sort
        recommendations = []
        for i_id, score in merged_scores.items():
            rec_obj = {"item_id": i_id, "score": score}
            if i_id in item_details:
                rec_obj.update(item_details[i_id])
            recommendations.append(rec_obj)

        recommendations.sort(key=lambda x: x["score"], reverse=True)

        # Removed pentest logic

        return recommendations[:top_k]
