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
    Chuẩn bị tập dữ liệu kiểm thử (Benchmark Datasets).
    Đọc một lượng giới hạn reviews, sắp xếp theo thời gian và chia theo tỷ lệ 80% huấn luyện / 20% kiểm thử.
    
    raw_reviews_path: Đường dẫn file tương tác gốc
    train_path: Đường dẫn file train được chia
    test_path: Đường dẫn file test được chia
    limit: Số lượng reviews thô được lấy ra
    """
    print(f"Đang chuẩn bị tập dữ liệu benchmark từ {limit} reviews đầu tiên...")
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
                
    # Sắp xếp các tương tác theo dòng thời gian (temporal split) để tránh rò rỉ dữ liệu (data leakage)
    reviews.sort(key=lambda x: x.get("timestamp", 0))
    
    # Chia tập dữ liệu 80% train, 20% test
    split_idx = int(len(reviews) * 0.8)
    train_reviews = reviews[:split_idx]
    test_reviews = reviews[split_idx:]
    
    # Ghi dữ liệu ra các file tạm phục vụ benchmark
    os.makedirs(os.path.dirname(train_path), exist_ok=True)
    with open(train_path, "w", encoding="utf-8") as f:
        for r in train_reviews:
            f.write(json.dumps(r) + "\n")
            
    with open(test_path, "w", encoding="utf-8") as f:
        for r in test_reviews:
            f.write(json.dumps(r) + "\n")
            
    print(f"Chuẩn bị xong benchmark data. Train size: {len(train_reviews)}, Test size: {len(test_reviews)}")

def run_benchmark(db_path, schema_path, train_reviews_path, test_reviews_path, metadata_path):
    """
    Khởi chạy toàn bộ quy trình benchmark:
    1. Huấn luyện offline trên tập train.
    2. Đánh giá chất lượng của Online Service bằng tập test (chỉ số Recall@10, NDCG@10, Latency).
    """
    # 1. Chạy offline pipeline để nạp dữ liệu huấn luyện vào SQLite
    print("Đang chạy offline pipeline trên tập train...")
    run_offline_pipeline(db_path, schema_path, train_reviews_path, metadata_path)
    
    # 2. Đọc tập kiểm thử (test) và gom tương tác thực tế theo từng user_id
    print("Đang đọc tập reviews kiểm thử...")
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
                
    print(f"Tập kiểm thử chứa thông tin tương tác của {len(user_test_interactions)} users độc nhất.")
    
    # 3. Khởi tạo dịch vụ gợi ý trực tuyến (Online Service)
    service = OnlineRecommenderService(db_path=db_path)
    
    # 4. Thực hiện đánh giá chất lượng gợi ý
    recalls = []
    ndcgs = []
    latencies = []
    
    print("Đang đánh giá chất lượng gợi ý trên tập test...")
    start_eval_time = time.time()
    
    test_users = list(user_test_interactions.keys())
    # Nếu số lượng người dùng quá nhiều, lấy mẫu ngẫu nhiên 1000 người dùng để tăng tốc độ tính benchmark
    if len(test_users) > 1000:
        np.random.seed(42)
        test_users = np.random.choice(test_users, 1000, replace=False)
        
    for user_id in test_users:
        actual_items = user_test_interactions[user_id]
        
        # Truy vấn danh sách gợi ý trực tuyến từ SQLite
        res = service.get_recommendations(user_id=user_id)
        predicted = res["recommendations"]
        latency = res["latency_ms"]
        
        # Tính toán các chỉ số chất lượng
        rec = recall_at_k(actual_items, predicted, k=10)
        ndcg = ndcg_at_k(actual_items, predicted, k=10)
        
        recalls.append(rec)
        ndcgs.append(ndcg)
        latencies.append(latency)
        
    eval_duration = time.time() - start_eval_time
    print(f"Đánh giá hoàn tất trong {eval_duration:.2f} giây.")
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
        # Thiết lập chạy thử benchmark trên 30,000 dòng dữ liệu đầu tiên
        prepare_benchmark_datasets(RAW_REVIEWS_PATH, TRAIN_REVIEWS_PATH, TEST_REVIEWS_PATH, limit=30000)
        run_benchmark(DB_PATH, SCHEMA_PATH, TRAIN_REVIEWS_PATH, TEST_REVIEWS_PATH, METADATA_PATH)
    else:
        print("Không tìm thấy các file dữ liệu trong data/.")
