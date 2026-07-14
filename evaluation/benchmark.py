import os
import json
import sqlite3
import time
import numpy as np
from src.pipeline_offline import run_offline_pipeline
from src.service_online import OnlineRecommenderService
from evaluation.metrics import recall_at_k, ndcg_at_k

def prepare_benchmark_datasets(raw_reviews_path, train_path, test_path, limit=50000):
    """
    Reads a subset of reviews, splits them temporally into train (80%) and test (20%).
    """
    print(f"Preparing benchmark dataset from first {limit} reviews...")
    reviews = []
    
    with open(raw_reviews_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                reviews.append(json.loads(line))
                if len(reviews) >= limit:
                    break
            except Exception:
                continue
                
    # Sort reviews by timestamp
    reviews.sort(key=lambda x: x.get("timestamp", 0))
    
    # Split
    split_idx = int(len(reviews) * 0.8)
    train_reviews = reviews[:split_idx]
    test_reviews = reviews[split_idx:]
    
    # Write files
    os.makedirs(os.path.dirname(train_path), exist_ok=True)
    with open(train_path, "w", encoding="utf-8") as f:
        for r in train_reviews:
            f.write(json.dumps(r) + "\n")
            
    with open(test_path, "w", encoding="utf-8") as f:
        for r in test_reviews:
            f.write(json.dumps(r) + "\n")
            
    print(f"Prepared benchmark data. Train size: {len(train_reviews)}, Test size: {len(test_reviews)}")

def run_benchmark(db_path, schema_path, train_reviews_path, test_reviews_path, metadata_path):
    """
    Runs the offline pipeline on train data and evaluates online recommendations using test data.
    """
    # 1. Run offline pipeline on train reviews
    print("Running offline pipeline on train dataset...")
    run_offline_pipeline(db_path, schema_path, train_reviews_path, metadata_path)
    
    # 2. Load test reviews and group by user
    print("Loading test reviews...")
    user_test_interactions = {}
    with open(test_reviews_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                data = json.loads(line)
                u = data["user_id"]
                item = data["parent_asin"]
                if u not in user_test_interactions:
                    user_test_interactions[u] = []
                user_test_interactions[u].append(item)
            except Exception:
                continue
                
    print(f"Test data contains interactions for {len(user_test_interactions)} unique users.")
    
    # 3. Initialize Online Service
    service = OnlineRecommenderService(db_path=db_path)
    
    # 4. Evaluate
    recalls = []
    ndcgs = []
    latencies = []
    
    print("Evaluating recommendations...")
    start_eval_time = time.time()
    
    test_users = list(user_test_interactions.keys())
    if len(test_users) > 1000:
        np.random.seed(42)
        test_users = np.random.choice(test_users, 1000, replace=False)
        
    for user_id in test_users:
        actual_items = user_test_interactions[user_id]
        
        # Get recommendations (static layered serving only)
        res = service.get_recommendations(user_id=user_id)
        predicted = res["recommendations"]
        latency = res["latency_ms"]
        
        # Calculate metrics
        rec = recall_at_k(actual_items, predicted, k=10)
        ndcg = ndcg_at_k(actual_items, predicted, k=10)
        
        recalls.append(rec)
        ndcgs.append(ndcg)
        latencies.append(latency)
        
    eval_duration = time.time() - start_eval_time
    print(f"Evaluation completed in {eval_duration:.2f} seconds.")
    print("--------------------------------------------------")
    print(f"Average Recall@10: {np.mean(recalls):.4f}")
    print(f"Average NDCG@10:   {np.mean(ndcgs):.4f}")
    print(f"Average Latency:   {np.mean(latencies):.4f} ms")
    print(f"P95 Latency:       {np.percentile(latencies, 95):.4f} ms")
    print(f"P99 Latency:       {np.percentile(latencies, 99):.4f} ms")
    print("--------------------------------------------------")
    
    return {
        "recall_at_10": float(np.mean(recalls)),
        "ndcg_at_10": float(np.mean(ndcgs)),
        "avg_latency_ms": float(np.mean(latencies)),
        "p95_latency_ms": float(np.percentile(latencies, 95)),
        "p99_latency_ms": float(np.percentile(latencies, 99))
    }

if __name__ == "__main__":
    RAW_REVIEWS_PATH = "data/raw_reviews.json"
    METADATA_PATH = "data/raw_metadata.json"
    
    DB_PATH = "db/benchmark_recommendations.db"
    SCHEMA_PATH = "db/schema.sql"
    TRAIN_REVIEWS_PATH = "data/benchmark_train_reviews.json"
    TEST_REVIEWS_PATH = "data/benchmark_test_reviews.json"
    
    if os.path.exists(RAW_REVIEWS_PATH) and os.path.exists(METADATA_PATH):
        prepare_benchmark_datasets(RAW_REVIEWS_PATH, TRAIN_REVIEWS_PATH, TEST_REVIEWS_PATH, limit=30000)
        run_benchmark(DB_PATH, SCHEMA_PATH, TRAIN_REVIEWS_PATH, TEST_REVIEWS_PATH, METADATA_PATH)
    else:
        print("Data files not found.")
