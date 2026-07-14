import os
import json
import sqlite3
import time

class OnlineRecommenderService:
    def __init__(self, db_path="db/recommendations.db"):
        self.db_path = db_path
        self._init_db_settings()
        
    def _get_connection(self):
        """
        Tạo kết nối tới cơ sở dữ liệu SQLite với cấu hình Row để dễ truy xuất.
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db_settings(self):
        """
        Khởi tạo kết nối nháp (warm up) để tối ưu hóa tốc độ truy vấn cho các request sau.
        """
        if not os.path.exists(self.db_path):
            return
        conn = self._get_connection()
        conn.close()

    def get_recommendations(self, user_id, category_context=None, limit=10):
        """
        Hàm phục vụ gợi ý trực tuyến (Online Serving). 
        Áp dụng chiến lược phòng thủ 3 lớp (3-layer Cold-start defense strategy) 
        để giải quyết triệt để bài toán Cold Start:
        - Layer 1: Gợi ý Cá nhân hóa dựa trên lịch sử mua sắm và độ tương đồng Jaccard.
        - Layer 2: Gợi ý theo sản phẩm nổi bật của danh mục hiện tại (nếu là user mới và có ngữ cảnh danh mục).
        - Layer 3: Gợi ý theo sản phẩm nổi bật toàn sàn (nếu là user mới tinh và không có ngữ cảnh).
        
        Đồng thời kết hợp thuật toán tự động bù đắp (Padding logic) để đảm bảo trả về chính xác số sản phẩm yêu cầu.
        """
        start_time = time.perf_counter()
        
        # Nếu database chưa tồn tại thì trả về danh sách rỗng
        if not os.path.exists(self.db_path):
            return {
                "user_id": user_id,
                "recommendations": [],
                "latency_ms": (time.perf_counter() - start_time) * 1000.0,
                "layer_used": 0
            }

        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            layer_used = 3
            recommendations = []
            
            # --- LAYER 1: GỢI Ý CÁ NHÂN HÓA DÀNH CHO USER CŨ ---
            # Tra cứu lịch sử mua sắm/tương tác của user trong bảng user_history
            cursor.execute("SELECT items FROM user_history WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            
            if row and row["items"]:
                history_items = json.loads(row["items"])
                history_set = set(history_items)
                
                # Tìm kiếm các sản phẩm tương đồng Jaccard với các sản phẩm trong lịch sử
                candidate_scores = {}
                for h_item in history_items:
                    cursor.execute("SELECT similar_items FROM item_similarities WHERE item_id = ?", (h_item,))
                    sim_row = cursor.fetchone()
                    if sim_row and sim_row["similar_items"]:
                        sims = json.loads(sim_row["similar_items"]) # Danh sách dạng [[item, score], ...]
                        for sim_item, score in sims:
                            # Chỉ gợi ý những sản phẩm user CHƯA từng tương tác
                            if sim_item not in history_set:
                                candidate_scores[sim_item] = candidate_scores.get(sim_item, 0.0) + score
                
                # Sắp xếp các sản phẩm tương tự có điểm Jaccard tích lũy cao nhất
                recommendations = sorted(candidate_scores.keys(), key=lambda x: candidate_scores[x], reverse=True)
                layer_used = 1
                
                # BÙ ĐẮP BẬC 1: Nếu danh sách tương tự chưa đủ số lượng, đề xuất các sản phẩm hot cùng danh mục
                if len(recommendations) < limit:
                    # Lấy danh sách danh mục (categories) của các sản phẩm trong lịch sử
                    categories = set()
                    for h_item in history_items:
                        cursor.execute("SELECT category FROM item_metadata WHERE item_id = ?", (h_item,))
                        cat_row = cursor.fetchone()
                        if cat_row and cat_row["category"]:
                            categories.add(cat_row["category"])
                    
                    # Quét qua các danh mục này và lấy sản phẩm nổi bật nhất
                    for cat in categories:
                        cursor.execute("SELECT top_items FROM category_top_rated WHERE category = ?", (cat,))
                        cat_row = cursor.fetchone()
                        if cat_row and cat_row["top_items"]:
                            cat_items = json.loads(cat_row["top_items"])
                            for item in cat_items:
                                if item not in history_set and item not in recommendations:
                                    recommendations.append(item)
                                    if len(recommendations) >= limit:
                                        break
                        if len(recommendations) >= limit:
                            break
                            
                # BÙ ĐẮP BẬC 2: Nếu vẫn chưa đủ, bù đắp bằng sản phẩm hot nhất toàn sàn
                if len(recommendations) < limit:
                    cursor.execute("SELECT top_items FROM global_top_rated WHERE id = 1")
                    global_row = cursor.fetchone()
                    if global_row and global_row["top_items"]:
                        global_items = json.loads(global_row["top_items"])
                        for item in global_items:
                            if item not in history_set and item not in recommendations:
                                recommendations.append(item)
                                if len(recommendations) >= limit:
                                    break
                                    
            # --- LAYER 2: GỢI Ý THEO DANH MỤC CHO USER MỚI (COLD START) ---
            # Kích hoạt khi không có lịch sử mua sắm, nhưng có truyền ngữ cảnh danh mục đang xem
            elif category_context:
                cursor.execute("SELECT top_items FROM category_top_rated WHERE category = ?", (category_context,))
                row = cursor.fetchone()
                if row and row["top_items"]:
                    recommendations = json.loads(row["top_items"])
                    layer_used = 2
                    
                # Bù đắp bằng sản phẩm hot toàn sàn nếu danh sách danh mục không đủ
                if len(recommendations) < limit:
                    cursor.execute("SELECT top_items FROM global_top_rated WHERE id = 1")
                    global_row = cursor.fetchone()
                    if global_row and global_row["top_items"]:
                        global_items = json.loads(global_row["top_items"])
                        for item in global_items:
                            if item not in recommendations:
                                recommendations.append(item)
                                if len(recommendations) >= limit:
                                    break
                                    
            # --- LAYER 3: GỢI Ý TOÀN SÀN CHO USER MỚI TINH (FALLBACK TRANG CHỦ) ---
            # Kích hoạt khi không tìm thấy lịch sử và không có ngữ cảnh danh mục
            if not recommendations:
                cursor.execute("SELECT top_items FROM global_top_rated WHERE id = 1")
                row = cursor.fetchone()
                if row and row["top_items"]:
                    recommendations = json.loads(row["top_items"])
                    layer_used = 3
                    
            # Cắt danh sách đúng số lượng yêu cầu
            recommendations = recommendations[:limit]
            
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            
            return {
                "user_id": user_id,
                "recommendations": recommendations,
                "latency_ms": latency_ms,
                "layer_used": layer_used
            }
            
        except sqlite3.Error as e:
            print(f"Lỗi khi truy xuất gợi ý: {e}")
            return {
                "user_id": user_id,
                "recommendations": [],
                "latency_ms": (time.perf_counter() - start_time) * 1000.0,
                "layer_used": 0
            }
        finally:
            conn.close()
