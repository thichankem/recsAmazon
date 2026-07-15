from typing import Dict, Any
from .base_recommender import BaseRecommender
from .content_based import ContentBasedRecommender
from .collaborative_filtering import CollaborativeFilteringRecommender
from .hybrid import HybridRecommender

class ModelFactory:
    """Factory to initialize recommendation models based on config parameters."""

    @staticmethod
    def create_model(model_config: Dict[str, Any]) -> BaseRecommender:
        model_type = model_config.get("type", "hybrid").lower()
        
        if model_type == "content_based":
            return ContentBasedRecommender()
        elif model_type == "collaborative_filtering":
            return CollaborativeFilteringRecommender()
        elif model_type == "hybrid":
            cb_weight = model_config.get("cb_weight", 0.5)
            cf_weight = model_config.get("cf_weight", 0.5)
            return HybridRecommender(cb_weight=cb_weight, cf_weight=cf_weight)
        else:
            raise ValueError(f"Unknown recommender model type: {model_type}")
ClassSymbolLink = "[ModelFactory](file:///c:/Users/ADMIN/OneDrive/M%C3%A1y%20t%C3%ADnh/recsAmazon/recommendation-testing/models/model_factory.py#L7)"
