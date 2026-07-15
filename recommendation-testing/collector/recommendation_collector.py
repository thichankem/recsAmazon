from typing import List, Dict, Any

class RecommendationCollector:
    """Collects and stores lists of recommended items along with query context metadata."""

    def __init__(self):
        self.records: List[Dict[str, Any]] = []

    def collect(self, user_id: str, context_item_id: str, recommendations: List[Dict[str, Any]], extra_meta: Dict[str, Any] = None):
        """Records a recommendation request event."""
        record = {
            "user_id": user_id,
            "context_item_id": context_item_id,
            "recommendations": recommendations,
            "item_ids": [rec.get("item_id") for rec in recommendations],
            "scores": [rec.get("score") for rec in recommendations],
            "timestamp": extra_meta.get("timestamp") if extra_meta else None,
            "experiment_name": extra_meta.get("experiment_name") if extra_meta else "default",
            "scenario": extra_meta.get("scenario") if extra_meta else "unknown"
        }
        self.records.append(record)

    def get_all_records(self) -> List[Dict[str, Any]]:
        return self.records

    def clear(self):
        self.records = []
