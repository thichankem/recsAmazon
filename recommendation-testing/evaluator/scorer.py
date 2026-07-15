from typing import List, Dict, Any
from .metrics import EvaluationMetrics

class Scorer:
    """Aggregates and scores recommendation lists against ground truth."""

    def __init__(self, k: int = 10):
        self.k = k

    def compute_scores(self, records: List[Dict[str, Any]], ground_truth: Dict[str, List[Any]]) -> Dict[str, Any]:
        """
        Computes average precision, recall, ndcg, hit_rate, and overall diversity.
        
        Args:
            records: Collected recommendation records containing 'user_id' and 'item_ids'
            ground_truth: Dictionary mapping user_id to actual item_ids that user bought
            
        Returns:
            A dictionary containing summary metrics.
        """
        if not records:
            return {
                "precision": 0.0,
                "recall": 0.0,
                "ndcg": 0.0,
                "hit_rate": 0.0,
                "diversity": 0.0
            }

        precisions = []
        recalls = []
        ndcgs = []
        hit_rates = []
        rec_lists = []

        for rec in records:
            u_id = rec.get("user_id")
            recommended = rec.get("item_ids", [])
            rec_lists.append(recommended)
            
            # Look up ground truth for user
            gt = ground_truth.get(u_id, [])
            if not gt:
                continue

            precisions.append(EvaluationMetrics.precision_at_k(recommended, gt, self.k))
            recalls.append(EvaluationMetrics.recall_at_k(recommended, gt, self.k))
            ndcgs.append(EvaluationMetrics.ndcg_at_k(recommended, gt, self.k))
            hit_rates.append(EvaluationMetrics.hit_rate_at_k(recommended, gt, self.k))

        return {
            "precision": sum(precisions) / max(len(precisions), 1),
            "recall": sum(recalls) / max(len(recalls), 1),
            "ndcg": sum(ndcgs) / max(len(ndcgs), 1),
            "hit_rate": sum(hit_rates) / max(len(hit_rates), 1),
            "diversity": EvaluationMetrics.diversity(rec_lists)
        }
