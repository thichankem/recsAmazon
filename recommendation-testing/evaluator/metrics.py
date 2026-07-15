import math
from typing import List, Any

class EvaluationMetrics:
    """Implementations of recommendation evaluation metrics."""

    @staticmethod
    def precision_at_k(recommended: List[Any], ground_truth: List[Any], k: int) -> float:
        if not recommended or not ground_truth:
            return 0.0
        rec_k = recommended[:k]
        hits = len(set(rec_k).intersection(set(ground_truth)))
        return hits / k

    @staticmethod
    def recall_at_k(recommended: List[Any], ground_truth: List[Any], k: int) -> float:
        if not recommended or not ground_truth:
            return 0.0
        rec_k = recommended[:k]
        hits = len(set(rec_k).intersection(set(ground_truth)))
        return hits / len(ground_truth)

    @staticmethod
    def ndcg_at_k(recommended: List[Any], ground_truth: List[Any], k: int) -> float:
        if not recommended or not ground_truth:
            return 0.0
        rec_k = recommended[:k]
        
        # Calculate DCG
        dcg = 0.0
        for idx, item in enumerate(rec_k):
            if item in ground_truth:
                dcg += 1.0 / math.log2(idx + 2)
                
        # Calculate IDCG (ideal DCG assuming all top min(k, len(gt)) items are matches)
        idcg = 0.0
        for idx in range(min(k, len(ground_truth))):
            idcg += 1.0 / math.log2(idx + 2)
            
        if idcg == 0.0:
            return 0.0
        return dcg / idcg

    @staticmethod
    def hit_rate_at_k(recommended: List[Any], ground_truth: List[Any], k: int) -> float:
        if not recommended or not ground_truth:
            return 0.0
        rec_k = recommended[:k]
        hits = len(set(rec_k).intersection(set(ground_truth)))
        return 1.0 if hits > 0 else 0.0

    @staticmethod
    def diversity(recommended_lists: List[List[Any]]) -> float:
        """Calculates diversity across multiple recommendation lists using unique items ratio."""
        if not recommended_lists:
            return 0.0
        all_items = []
        for rec_list in recommended_lists:
            all_items.extend(rec_list)
        if not all_items:
            return 0.0
        return len(set(all_items)) / len(all_items)
