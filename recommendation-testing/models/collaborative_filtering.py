from typing import List, Dict, Any
from collections import defaultdict
from .base_recommender import BaseRecommender

class CollaborativeFilteringRecommender(BaseRecommender):
    """Collaborative Filtering Recommendation model (Item-to-Item mock)."""

    def __init__(self):
        self.user_history = defaultdict(list)
        self.item_users = defaultdict(set)
        self.popular_items = []

    def train(self, data: Any) -> None:
        # Handle dict or list training data
        if isinstance(data, dict):
            interactions = data.get("interactions", [])
        elif isinstance(data, list):
            interactions = data
        else:
            interactions = []

        self.user_history = defaultdict(list)
        self.item_users = defaultdict(set)
        
        item_counts = defaultdict(int)
        for interaction in interactions:
            u_id = interaction.get("user_id")
            i_id = interaction.get("item_id")
            if u_id and i_id:
                self.user_history[u_id].append(i_id)
                self.item_users[i_id].add(u_id)
                item_counts[i_id] += 1
                
        # Sort items by activity/popularity
        self.popular_items = sorted(item_counts.keys(), key=lambda x: item_counts[x], reverse=True)

    def register_item(self, item_id: str, title: str, categories: List[str], brand: str) -> None:
        if item_id not in self.popular_items:
            self.popular_items.insert(0, item_id)

    def recommend(self, user_id: str, context_item_id: str = None, top_k: int = 10, search_query: str = None, **kwargs) -> List[Dict[str, Any]]:
        user_items = set(self.user_history.get(user_id, []))
        
        # Optimize candidate search space: only items sharing at least one user with user's history
        candidate_items = set()
        for item_id in user_items:
            co_users = self.item_users[item_id]
            for co_user in co_users:
                for other_item_id in self.user_history[co_user]:
                    if other_item_id not in user_items:
                        candidate_items.add(other_item_id)
        
        # Calculate item similarity scores based on co-occurrence in user histories
        scores = defaultdict(float)
        for item_id in user_items:
            co_users = self.item_users[item_id]
            for other_item_id in candidate_items:
                other_users = self.item_users[other_item_id]
                intersection = len(co_users.intersection(other_users))
                union = len(co_users.union(other_users))
                if union > 0:
                    jaccard = intersection / union
                    scores[other_item_id] += jaccard
        
        recommendations = [{"item_id": i_id, "score": score} for i_id, score in scores.items()]
        
        # Sort by score descending
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        # Fallback to general popular items if the user is new or has no similar items
        if not recommendations:
            for i, i_id in enumerate(self.popular_items[:top_k]):
                recommendations.append({"item_id": i_id, "score": 1.0 / (i + 1)})
            # Fallback to mock item IDs only if there's no training data at all
            if not recommendations:
                for i in range(1, top_k + 1):
                    recommendations.append({"item_id": f"item_cf_{i}", "score": 1.0 / i})

        return recommendations[:top_k]
