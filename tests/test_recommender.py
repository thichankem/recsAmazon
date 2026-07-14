import os
import json
import sqlite3
import time
import pytest
from src.service_online import OnlineRecommenderService

# Cấu hình đường dẫn phục vụ kiểm thử
TEST_DB_PATH = "db/test_recommendations.db"
SCHEMA_PATH = "db/schema.sql"

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    """
    Fixture khởi tạo cơ sở dữ liệu giả lập (mock database) trước khi chạy các unit test.
    Sau khi các test kết thúc, tự động dọn dẹp các tệp database tạm.
    """
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    db_dir = os.path.dirname(TEST_DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
        
    # Tạo cấu trúc bảng từ schema.sql
    conn = sqlite3.connect(TEST_DB_PATH)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    
    # Nạp dữ liệu giả lập vào database test
    cursor = conn.cursor()
    
    # Giả lập lịch sử mua sắm của user_old_1 (đã mua sản phẩm prod_hist_1)
    cursor.execute(
        "INSERT INTO user_history (user_id, items) VALUES (?, ?)",
        ("user_old_1", json.dumps(["prod_hist_1"]))
    )
    
    # Giả lập danh sách sản phẩm tương tự Jaccard cho prod_hist_1
    cursor.execute(
        "INSERT INTO item_similarities (item_id, similar_items) VALUES (?, ?)",
        ("prod_hist_1", json.dumps([["prod_svd_1", 0.9], ["prod_svd_2", 0.8], ["prod_svd_3", 0.7]]))
    )
    
    # Giả lập metadata ánh xạ sản phẩm sang danh mục
    cursor.execute(
        "INSERT INTO item_metadata (item_id, category) VALUES (?, ?)",
        ("prod_hist_1", "Electronics")
    )
    
    # Giả lập danh sách top sản phẩm của danh mục Electronics (Layer 2)
    cursor.execute(
        "INSERT INTO category_top_rated (category, top_items) VALUES (?, ?)",
        ("Electronics", json.dumps(["prod_elec_1", "prod_elec_2", "prod_elec_3", "prod_elec_4"]))
    )
    
    # Giả lập danh sách top sản phẩm bán chạy toàn sàn (Layer 3)
    cursor.execute(
        "INSERT INTO global_top_rated (id, top_items) VALUES (?, ?)",
        (1, json.dumps(["prod_global_1", "prod_global_2", "prod_global_3", "prod_global_4", "prod_global_5", "prod_global_6", "prod_global_7"]))
    )
    
    conn.commit()
    conn.close()
    
    yield
    
    # Dọn dẹp cơ sở dữ liệu test sau khi hoàn tất kiểm thử
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
            if os.path.exists(TEST_DB_PATH + "-wal"):
                os.remove(TEST_DB_PATH + "-wal")
            if os.path.exists(TEST_DB_PATH + "-shm"):
                os.remove(TEST_DB_PATH + "-shm")
        except Exception as e:
            print(f"Lỗi khi dọn dẹp database test: {e}")

def test_layered_recommendations_cold_start():
    """
    Kiểm thử cơ chế gợi ý phân tầng (3-layer Cold-start defense strategy).
    """
    service = OnlineRecommenderService(db_path=TEST_DB_PATH)
    
    # Tầng 1: Đánh giá cho người dùng cũ (user_old_1) -> Kỳ vọng nhận gợi ý cá nhân hóa + bù đắp
    res_old = service.get_recommendations(user_id="user_old_1", limit=10)
    res_layer_1_items = res_old["recommendations"]
    assert res_layer_1_items
    assert len(res_layer_1_items) == 10
    
    # Kiểm tra xem các gợi ý Jaccard có xuất hiện hay không
    assert "prod_svd_1" in res_layer_1_items
    assert "prod_svd_2" in res_layer_1_items
    assert "prod_svd_3" in res_layer_1_items
    # Kiểm tra xem có bù đắp (padding) bằng sản phẩm hot của Electronics và toàn sàn không
    assert "prod_global_1" in res_layer_1_items
    assert res_old["layer_used"] == 1
    
    # Tầng 2: Người dùng mới nhưng có ngữ cảnh danh mục Electronics đang xem
    res_new_cat = service.get_recommendations(user_id="user_new_1", category_context="Electronics")
    assert res_new_cat["layer_used"] == 2
    assert "prod_elec_1" in res_new_cat["recommendations"]
    
    # Tầng 3: Người dùng mới tinh ở trang chủ (không có lịch sử, không có ngữ cảnh danh mục)
    res_new_none = service.get_recommendations(user_id="user_new_2")
    assert res_new_none["layer_used"] == 3
    assert "prod_global_1" in res_new_none["recommendations"]

def test_online_serving_latency():
    """
    Kiểm tra xem độ trễ đáp ứng của API trực tuyến có đạt chỉ tiêu cực hạn dưới 2ms hay không.
    """
    service = OnlineRecommenderService(db_path=TEST_DB_PATH)
    user = "user_old_1"
    
    # Chạy nháp truy vấn đầu tiên (Warm-up) để nạp kết nối SQLite vào cache
    service.get_recommendations(user_id=user)
    
    # Thực thi 100 truy vấn liên tiếp và đo độ trễ trung bình
    latencies = []
    for _ in range(100):
        t_start = time.perf_counter()
        service.get_recommendations(user_id=user)
        t_end = time.perf_counter()
        latencies.append((t_end - t_start) * 1000.0)
        
    avg_latency = sum(latencies) / len(latencies)
    print(f"\nĐộ trễ trung bình của test serving tĩnh: {avg_latency:.4f} ms")
    
    # Ràng buộc: Độ trễ trung bình phải nhỏ hơn 2.0 ms (Kiến trúc tĩnh thường đạt < 0.5ms)
    assert avg_latency < 2.0, f"Độ trễ trung bình là {avg_latency:.2f}ms, vượt quá ngưỡng cho phép 2ms!"
