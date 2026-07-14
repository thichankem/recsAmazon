import os
import json
import sqlite3
import math
import time
from collections import defaultdict, Counter
import numpy as np
import pandas as pd

def load_schema(db_path, schema_path):
    """
    Nạp cấu trúc (schema) cơ sở dữ liệu SQLite từ file SQL.
    
    db_path: Đường dẫn tới file database recommendations.db
    schema_path: Đường dẫn tới file schema.sql chứa câu lệnh tạo bảng
    """
    print(f"Đang khởi tạo cơ sở dữ liệu tại: {db_path}")
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
        
    # Kết nối SQLite và thực thi script SQL tạo bảng
    conn = sqlite3.connect(db_path)
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()
    print("Đã tải cấu trúc cơ sở dữ liệu thành công.")

def parse_metadata(metadata_path):
    """
    Đọc tệp tin raw_metadata.json theo từng dòng (dạng chunk) 
    và trích xuất danh mục sản phẩm (main category) cũng như tiêu đề.
    
    metadata_path: Đường dẫn tới file chứa thông tin chi tiết của sản phẩm
    """
    print("Đang phân tích thông tin sản phẩm (Metadata)...")
    item_metadata = {}
    start_time = time.time()
    
    with open(metadata_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                item = json.loads(line)
                asin = item.get("parent_asin")
                if asin:
                    main_cat = item.get("main_category")
                    title = item.get("title")
                    # Nếu danh mục trống hoặc null thì gán mặc định là 'Other'
                    if not main_cat or main_cat == "null":
                        main_cat = "Other"
                    item_metadata[asin] = {
                        "category": main_cat,
                        "title": title or "Unknown Product"
                    }
            except Exception:
                continue
                
    print(f"Đã phân tích xong metadata cho {len(item_metadata)} sản phẩm trong {time.time() - start_time:.2f} giây.")
    return item_metadata

def analyze_reviews_first_pass(reviews_path):
    """
    Quét qua tập dữ liệu reviews lần thứ nhất (First Pass) 
    để tìm ra thời gian tương tác mới nhất (max timestamp). 
    Dùng cho việc tính toán hệ số suy giảm độ quan tâm theo thời gian.
    
    reviews_path: Đường dẫn tới file raw_reviews.json
    """
    print("Đang quét reviews lần 1 để tìm mốc thời gian lớn nhất...")
    max_timestamp = 0
    start_time = time.time()
    
    with open(reviews_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                data = json.loads(line)
                ts = data.get("timestamp")
                if ts and ts > max_timestamp:
                    max_timestamp = ts
            except Exception:
                continue
                
    print(f"Mốc thời gian lớn nhất tìm thấy: {max_timestamp} ({time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(max_timestamp/1000.0))})")
    print(f"Hoàn thành quét lần 1 trong {time.time() - start_time:.2f} giây.")
    return max_timestamp

def process_reviews_and_scores(reviews_path, max_timestamp, item_metadata):
    """
    Quét reviews lần 2, tính toán điểm số tương tác cho từng cặp (user, item)
    dựa trên trọng số của verified purchase, helpful vote và độ suy giảm thời gian (decay factor).
    
    reviews_path: Đường dẫn tới file raw_reviews.json
    max_timestamp: Mốc thời gian mới nhất để làm mốc tính decay
    item_metadata: Metadata sản phẩm để phục vụ phân loại
    """
    print("Đang tính toán điểm số tương tác cho từng review...")
    interactions = []
    item_ratings = {}
    decay_lambda = 4.456e-8  # Hệ số decay theo giây (khoảng nửa năm sẽ giảm phân nửa)
    start_time = time.time()
    
    with open(reviews_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                data = json.loads(line)
                user_id = data.get("user_id")
                asin = data.get("parent_asin")
                rating = data.get("rating")
                ts = data.get("timestamp")
                
                if not user_id or not asin or rating is None or ts is None:
                    continue
                
                # Lưu trữ lịch sử rating thô để tính toán mức độ phổ biến sau này
                if asin not in item_ratings:
                    item_ratings[asin] = []
                item_ratings[asin].append(rating)
                
                # Trọng số khuyến khích cho tài khoản đã xác thực mua hàng
                verified = 1.0 if data.get("verified_purchase") is True else 0.0
                # Trọng số log cho helpful votes (giảm thiểu nhiễu từ spam)
                helpful = float(data.get("helpful_vote", 0))
                
                # Tính độ trôi thời gian (decay factor)
                delta_t_sec = max(0.0, (max_timestamp - ts) / 1000.0)
                decay = math.exp(-decay_lambda * delta_t_sec)
                
                # Công thức tính điểm tương tác tổng hợp
                score = rating * (1.0 + 0.2 * verified + 0.1 * math.log1p(helpful)) * decay
                interactions.append((user_id, asin, score))
            except Exception:
                continue
                
    print(f"Đã xử lý xong {len(interactions)} lượt reviews trong {time.time() - start_time:.2f} giây.")
    
    print("Đang gộp nhóm tương tác theo (user_id, parent_asin)...")
    agg_start = time.time()
    df_inter = pd.DataFrame(interactions, columns=["user_id", "parent_asin", "score"])
    # Chọn ra điểm số tương tác lớn nhất của mỗi cặp user-item
    df_inter = df_inter.groupby(["user_id", "parent_asin"], as_index=False)["score"].max()
    
    aggregated_interactions = list(df_inter.itertuples(index=False, name=None))
    print(f"Số lượng tương tác sau gộp: {len(aggregated_interactions)} (giảm từ {len(interactions)}) trong {time.time() - agg_start:.2f} giây.")
    
    return aggregated_interactions, item_ratings

def compute_popular_items(item_ratings, item_metadata, db_path):
    """
    Tính toán danh sách sản phẩm phổ biến nhất toàn sàn và theo từng danh mục
    dựa trên tần suất tương tác (số lượt mua/đánh giá) và rating trung bình.
    
    item_ratings: Map chứa danh sách các ratings của từng sản phẩm
    item_metadata: Metadata chứa thông tin phân loại
    db_path: Đường dẫn database SQLite
    """
    print("Đang tính toán mức độ phổ biến của sản phẩm...")
    item_stats = {}
    for asin, ratings in item_ratings.items():
        item_stats[asin] = {
            "mean": np.mean(ratings),
            "count": len(ratings)
        }
        
    item_popularity = []
    for asin, stats in item_stats.items():
        item_popularity.append((asin, stats["count"], stats["mean"]))
        
    # Sắp xếp sản phẩm: Ưu tiên lượt mua (count) giảm dần, sau đó đến rating trung bình giảm dần
    item_popularity.sort(key=lambda x: (x[1], x[2]), reverse=True)
    
    # Lấy ra Top 20 sản phẩm hot nhất toàn sàn
    global_top_20 = [item[0] for item in item_popularity[:20]]
    
    # Phân nhóm mức độ phổ biến theo danh mục (main category)
    category_items = {}
    for asin, count, mean in item_popularity:
        meta = item_metadata.get(asin, {"category": "Other", "title": "Unknown"})
        cat = meta["category"]
        if cat not in category_items:
            category_items[cat] = []
        category_items[cat].append((asin, count, mean))
        
    category_top_20 = {}
    for cat, items in category_items.items():
        # Sắp xếp tương tự trong từng danh mục
        items.sort(key=lambda x: (x[1], x[2]), reverse=True)
        category_top_20[cat] = [item[0] for item in items[:20]]
        
    print("Đang lưu danh sách phổ biến (global & category) vào cơ sở dữ liệu SQLite...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Ghi vào bảng global_top_rated
    cursor.execute("INSERT OR REPLACE INTO global_top_rated (id, top_items) VALUES (?, ?)", 
                   (1, json.dumps(global_top_20)))
    
    # Ghi vào bảng category_top_rated
    cursor.executemany("INSERT OR REPLACE INTO category_top_rated (category, top_items) VALUES (?, ?)",
                       [(cat, json.dumps(items)) for cat, items in category_top_20.items()])
    
    conn.commit()
    conn.close()
    print(f"Đã lưu thành công danh sách hot items của {len(category_top_20)} danh mục vào SQLite.")

def train_collaborative_filtering(interactions, item_metadata, db_path):
    """
    Tính toán ma trận tương tự độ đo Jaccard giữa các sản phẩm (Item-to-Item CF)
    và lưu vết lịch sử mua sắm của người dùng vào SQLite.
    
    interactions: Danh sách các tương tác dạng (user_id, item_id, score)
    item_metadata: Metadata chứa thông tin danh mục
    db_path: Đường dẫn cơ sở dữ liệu SQLite
    """
    print("Đang thiết lập đồ thị đồng xuất hiện (co-occurrence graph) cho Jaccard...")
    start_time = time.time()
    
    user_train_items = defaultdict(set)
    item_users = defaultdict(set)
    
    # Xây dựng index ngược: user -> items và item -> users
    for u, item, score in interactions:
        user_train_items[u].add(item)
        item_users[item].add(u)
        
    print(f"Tổng số unique users: {len(user_train_items)}, unique items: {len(item_users)}")
    
    print("Đang tính toán độ tương tương đồng Jaccard giữa các cặp sản phẩm...")
    t0 = time.time()
    item_sims = defaultdict(dict)
    
    # Tính độ đo Jaccard: J(A, B) = |Users_A giao Users_B| / |Users_A hợp Users_B|
    for item, users in item_users.items():
        if len(users) < 1:
            continue
        
        # Chỉ quét qua những sản phẩm có chung người dùng để tránh nhân ma trận thưa vô nghĩa
        co_items = Counter()
        for u in users:
            for other in user_train_items[u]:
                if other != item:
                    co_items[other] += 1
        
        len_item_users = len(users)
        for other, intersection_sz in co_items.items():
            union_sz = len_item_users + len(item_users[other]) - intersection_sz
            if union_sz > 0:
                score = intersection_sz / union_sz
                if score > 0.0:
                    item_sims[item][other] = score
                    
    # Lọc và giữ lại tối đa 20 sản phẩm tương đồng nhất cho mỗi sản phẩm để tối ưu lưu trữ
    item_sims_cleaned = {}
    for item, sims in item_sims.items():
        sorted_sims = sorted(sims.items(), key=lambda x: x[1], reverse=True)[:20]
        if sorted_sims:
            item_sims_cleaned[item] = sorted_sims
            
    print(f"Đã tính xong Jaccard similarities cho {len(item_sims_cleaned)} sản phẩm trong {time.time() - t0:.2f} giây.")
    
    print("Đang lưu lịch sử user, ma trận tương đồng Jaccard và thông tin danh mục vào SQLite...")
    t0 = time.time()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Xóa dữ liệu cũ
    cursor.execute("DELETE FROM user_history")
    cursor.execute("DELETE FROM item_similarities")
    cursor.execute("DELETE FROM item_metadata")
    
    # Lưu bảng user_history (lịch sử mua sắm dạng JSON của user)
    user_hist_data = [(u, json.dumps(list(items))) for u, items in user_train_items.items()]
    cursor.executemany("INSERT OR REPLACE INTO user_history (user_id, items) VALUES (?, ?)", user_hist_data)
    
    # Lưu bảng item_similarities (danh sách tương đồng Jaccard)
    item_sim_data = [(item, json.dumps(sims)) for item, sims in item_sims_cleaned.items()]
    cursor.executemany("INSERT OR REPLACE INTO item_similarities (item_id, similar_items) VALUES (?, ?)", item_sim_data)
    
    # Lưu bảng item_metadata (phân loại danh mục nhanh cho phục vụ trực tuyến)
    item_meta_data = [(item, meta.get("category", "Other")) for item, meta in item_metadata.items()]
    cursor.executemany("INSERT OR REPLACE INTO item_metadata (item_id, category) VALUES (?, ?)", item_meta_data)
    
    conn.commit()
    conn.close()
    print(f"Đã ghi vào SQLite thành công trong {time.time() - t0:.2f} giây.")
    print(f"Hoàn thành toàn bộ Offline Training Pipeline trong {time.time() - start_time:.2f} giây.")

def run_offline_pipeline(db_path, schema_path, reviews_path, metadata_path):
    """
    Khởi chạy toàn bộ luồng huấn luyện offline (Offline Pipeline).
    """
    print("=================== BẮT ĐẦU CHẠY OFFLINE PIPELINE ===================")
    pipeline_start = time.time()
    
    # 1. Khởi tạo cấu trúc bảng SQLite
    load_schema(db_path, schema_path)
    
    # 2. Phân tích tệp metadata sản phẩm
    item_metadata = parse_metadata(metadata_path)
    
    # 3. Tìm timestamp mới nhất trong reviews
    max_timestamp = analyze_reviews_first_pass(reviews_path)
    
    # 4. Tính toán điểm tương tác và gộp nhóm tương tác
    interactions, item_ratings = process_reviews_and_scores(reviews_path, max_timestamp, item_metadata)
    
    # 5. Thống kê và lưu trữ danh sách sản phẩm phổ biến nhất (Global & Category)
    compute_popular_items(item_ratings, item_metadata, db_path)
    
    # 6. Tính toán Item-to-Item CF và xuất lịch sử vào DB SQLite
    train_collaborative_filtering(interactions, item_metadata, db_path)
    
    print(f"=================== HOÀN THÀNH OFFLINE PIPELINE ({time.time() - pipeline_start:.2f}s) ===================")

if __name__ == "__main__":
    DB_PATH = "db/recommendations.db"
    SCHEMA_PATH = "db/schema.sql"
    REVIEWS_PATH = "data/raw_reviews.json"
    METADATA_PATH = "data/raw_metadata.json"
    
    if os.path.exists(REVIEWS_PATH) and os.path.exists(METADATA_PATH):
        run_offline_pipeline(DB_PATH, SCHEMA_PATH, REVIEWS_PATH, METADATA_PATH)
    else:
        print("Không tìm thấy các file dữ liệu trong data/.")
