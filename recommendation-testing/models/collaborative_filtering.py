from typing import List, Dict, Any
from collections import defaultdict
from .base_recommender import BaseRecommender

class CollaborativeFilteringRecommender(BaseRecommender):
    """Collaborative Filtering Recommendation model (Item-to-Item mock)."""

    def __init__(self):
        self.user_history = defaultdict(list)
        self.item_users = defaultdict(set)

    def train(self, data: Any) -> None:
        # Mock training: populate user history and item interactions
        if isinstance(data, list):
            for interaction in data:
                u_id = interaction.get("user_id")
                i_id = interaction.get("item_id")
                if u_id and i_id:
                    self.user_history[u_id].append(i_id)
                    self.item_users[i_id].add(u_id)

    def recommend(self, user_id: str, context_item_id: str = None, top_k: int = 10) -> List[Dict[str, Any]]:
        user_items = set(self.user_history.get(user_id, []))
        
        # Calculate item similarity scores based on co-occurrence in user histories
        scores = defaultdict(float)
        for item_id in user_items:
            co_users = self.item_users[item_id]
            for other_item_id, other_users in self.item_users.items():
                if other_item_id in user_items:
                    continue
                intersection = len(co_users.intersection(other_users))
                union = len(co_users.union(other_users))
                if union > 0:
                    jaccard = intersection / union
                    scores[other_item_id] += jaccard
        
        recommendations = [{"item_id": i_id, "score": score} for i_id, score in scores.items()]
        
        # Fallback to general mock recommendations if the user is new
        if not recommendations:
            for i in range(1, top_k + 1):
                recommendations.append({"item_id": f"item_cf_{i}", "score": 1.0 / i})

        # Sort by score descending and return top K
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:top_k]
