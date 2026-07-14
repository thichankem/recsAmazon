import numpy as np

def recall_at_k(actual, predicted, k=10):
    """
    Computes Recall@K.
    actual: list or set of actual interacted items in the test set.
    predicted: list of predicted items in order of recommendation.
    """
    if not actual:
        return 0.0
    actual_set = set(actual)
    predicted_k = predicted[:k]
    hits = len(actual_set.intersection(predicted_k))
    return float(hits) / len(actual_set)

def ndcg_at_k(actual, predicted, k=10):
    """
    Computes NDCG@K (Normalized Discounted Cumulative Gain).
    actual: list or set of actual interacted items in the test set.
    predicted: list of predicted items in order of recommendation.
    """
    if not actual:
        return 0.0
    actual_set = set(actual)
    predicted_k = predicted[:k]
    
    dcg = 0.0
    for i, p in enumerate(predicted_k):
        if p in actual_set:
            dcg += 1.0 / np.log2(i + 2) # i is 0-indexed, so discount is log2(i+2)
            
    # Calculate Ideal DCG (IDCG)
    idcg = 0.0
    n_rel = min(k, len(actual_set))
    for i in range(n_rel):
        idcg += 1.0 / np.log2(i + 2)
        
    if idcg == 0.0:
        return 0.0
        
    return dcg / idcg
