# Báo Cáo Vấn Đề Thiết Kế & Hiệu Năng (Sử dụng Static Layered Serving)

Dưới đây là các vấn đề nghiêm trọng về thiết kế kiến trúc, giới hạn tài nguyên phần cứng (RAM 6GB trống), lỗi logic và độ trễ phục vụ đã được phân tích và giải quyết triệt để sau khi loại bỏ luồng tương tác thời gian thực (`user_interactions`).

---

## 1. Tràn Bộ Nhớ (OOM - Out of Memory) & Giảm Tải Offline Pipeline
* **Vấn đề ban đầu**:
  Tính toán ma trận tương tự đầy đủ giữa tất cả các cặp sản phẩm (Item-Item Similarity Matrix) cho **112,565 items** cần hơn **50 GB RAM** nếu làm trực tiếp.
* **Quyết định cấu trúc mới**:
  Bằng cách loại bỏ luồng trộn thời gian thực 70/30, chúng ta cũng loại bỏ hoàn toàn nhu cầu tính toán và lưu trữ `item_similarities`.
* **Kết quả**:
  - Offline Pipeline chạy cực kỳ nhẹ nhàng, RAM sử dụng tối đa luôn **dưới 600MB**.
  - Thời gian huấn luyện Offline Pipeline giảm từ **6.85 giây** xuống chỉ còn **5.11 giây** (nhanh hơn 25%), giúp tiết kiệm CPU và tài nguyên đĩa của máy dev.

---

## 2. Tối Ưu Hóa Latency Cực Hạn (< 1ms)
* **Vấn đề ban đầu**:
  Việc mở và đóng nhiều kết nối SQLite liên tiếp trong một request làm tăng độ trễ lên **6ms - 10ms**, vi phạm mốc latency < 2ms.
* **Khắc phục**:
  - Ở phiên bản tĩnh hiện tại, luồng serving trực tuyến được rút gọn tối đa: Chỉ thực hiện đúng **1 kết nối duy nhất** đến SQLite, chạy truy vấn phân tầng (SVD -> Category -> Global) và đóng kết nối.
  - Kết quả: Độ trễ trung bình (Average Latency) giảm xuống còn **0.98 ms** (P95 đạt **1.32 ms**, P99 đạt **1.64 ms**), đáp ứng cực kỳ xuất sắc mục tiêu hiệu năng.

---

## 3. Sự Đánh Đổi (Trade-off) Giữa Hiệu Năng Và Chất Lượng Gợi Ý
* **Phân tích kết quả benchmark**:
  - Khi có trộn 70% Real-time (sử dụng clicks ngắn hạn): Recall@10 đạt **0.0010** và NDCG@10 đạt **0.0004**.
  - Khi chuyển sang Static Serving hoàn toàn: Recall@10 giảm xuống **0.0003** và NDCG@10 giảm xuống **0.0002**.
* **Đánh giá**:
  - Việc loại bỏ tương tác thời gian thực giúp hệ thống đạt độ trễ siêu thấp (< 1ms), giảm tải ghi I/O lên SQLite, và làm sạch mã nguồn.
  - Tuy nhiên, hệ thống bị mất đi khả năng **phản xạ nhanh (Online Reflex)** theo hành vi của phiên hiện tại. Đối với Cold-start users, hệ thống buộc phải phụ thuộc vào gợi ý phổ biến danh mục hoặc toàn sàn thay vì cá nhân hóa theo các click gần nhất.
  - **Khuyến nghị**: Trên môi trường thực tế, nếu muốn giữ độ trễ thấp dưới 2ms mà vẫn giữ được chất lượng cá nhân hóa thời gian thực, **bắt buộc** phải sử dụng một bộ nhớ đệm in-memory (như Redis) để lưu click session và tính toán tương tự Content-Based trực tiếp trên RAM, tránh xa hoàn toàn việc đọc/ghi SQLite real-time trên đĩa.
