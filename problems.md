# Báo Cáo Giải Quyết Vấn Đề Thiết Kế & Hiệu Năng (Sử dụng Hybrid Item-to-Item Serving)

Dưới đây là báo cáo về các vấn đề kỹ thuật nghiêm trọng của hệ thống cũ (sử dụng Truncated SVD) và cách thức cấu trúc lại hệ thống mới đã giải quyết triệt để các hạn chế này trên dữ liệu 700,000 tương tác.

---

## 1. Khắc Phục Tràn Bộ Nhớ (OOM) & Treo Pipeline Ngoại Tuyến
* **Vấn đề ban đầu (SVD)**:
  - Để lưu trữ các gợi ý cá nhân hóa cho từng user, hệ thống cũ phải thực hiện nhân ma trận ẩn `U` ($630,513 \times 32$) và `V^T` ($32 \times 112,565$).
  - Quá trình này tạo ra các ma trận điểm số khổng lồ (kích thước $5000 \times 112,565$ tương đương 4.5 GB RAM cho mỗi chunk). Trên môi trường máy dev có RAM trống dưới 6GB, điều này làm cạn kiệt bộ nhớ vật lý, kích hoạt swapping đĩa và làm đơ/treo hệ thống (`KeyboardInterrupt`).
  - Hơn nữa, việc lặp qua 630,000 người dùng trong Python để phân tách và sắp xếp `argpartition` tốn hàng chục phút và phình to cơ sở dữ liệu SQLite lên hàng trăm Megabytes.
* **Giải pháp Cấu trúc mới (Jaccard Item-to-Item + User History)**:
  - Thay vì tính toán và lưu sẵn danh sách gợi ý cho từng user (phụ thuộc quy mô user rất lớn), hệ thống mới tính độ tương đồng **Jaccard Item-to-Item** giữa các sản phẩm (phụ thuộc số lượng item nhỏ hơn và ổn định hơn).
  - Do ma trận tương tác của dữ liệu Amazon cực kỳ thưa (interaction density ~ 0.00098%), chỉ có 7.6% người dùng có trên 2 tương tác. Đồ thị đồng xuất hiện của sản phẩm rất thưa, giúp tính toán Jaccard cực kỳ nhanh và chỉ tốn chưa tới **500MB RAM**.
  - **Kết quả**: Offline Pipeline chạy hoàn tất tập dữ liệu 700k chỉ trong **~14 giây** (quá trình tính Jaccard chỉ mất 1.1 giây), kích thước Database SQLite giảm xuống tối đa chỉ còn **~56.88 MB** (giảm hơn 10 lần).

---

## 2. Giải Quyết Vấn Đề Chất Lượng Gợi Ý Cực Tệ (Recall@10 ~ 0.0003)
* **Vấn đề ban đầu**:
  - Do độ thưa thớt cực lớn (phần lớn user chỉ có đúng 1 đánh giá), mô hình SVD không thể học được các latent factors chuẩn xác cho người dùng và sản phẩm. Điểm tích chập của các vector ẩn sinh ra gợi ý mang tính ngẫu nhiên rất cao.
  - Bộ thống kê sản phẩm phổ biến sử dụng công thức Bayesian Average thuần túy bị nhiễu bởi các sản phẩm có ít tương tác nhưng điểm đánh giá cao (niche items), khiến việc gợi ý cho nhóm người dùng Cold-Start (82% lượng test) đạt hiệu quả rất thấp.
* **Khắc phục**:
  - Sử dụng **Jaccard Item-to-Item CF** giúp trả về sản phẩm tương tự một cách trực quan và liên quan mật thiết với các sản phẩm trong lịch sử của user cũ.
  - Sử dụng thống kê **Category Popularity** và **Global Popularity** dựa trên tần suất mua sắm thực tế để gợi ý cho người dùng Cold-Start và làm đệm bù đắp (Padding). Các sản phẩm bán chạy nhất được đề xuất trước, mang lại xác suất khớp nhu cầu khách hàng cao hơn nhiều.
* **Kết quả Benchmark**:
  - **Recall@10**: Tăng từ **0.0003** lên **0.0120** (tăng gấp **40 lần**).
  - **NDCG@10**: Tăng từ **0.0002** lên **0.0065** (tăng gấp **32 lần**).

---

## 3. Đảm Bảo Tối Ưu Hóa Latency (< 1ms)
* **Vấn đề**:
  - Quy trình truy vấn phức tạp của Item-to-Item CF (đọc lịch sử -> đọc độ tương đồng -> tổng hợp điểm -> fallback theo category -> fallback toàn sàn) có nguy cơ làm tăng độ trễ phục vụ vượt ngưỡng 2ms nếu không tối ưu.
* **Khắc phục**:
  - Sử dụng thuộc tính `WITHOUT ROWID` cho các bảng tĩnh chính trong SQLite (`user_history`, `item_similarities`, `item_metadata`) giúp lưu trữ dữ liệu trực tiếp trong B-Tree của khóa chính, giảm I/O tra cứu.
  - Gom các bảng metadata và danh sách tương tự thành dạng JSON tĩnh để chỉ cần thực hiện truy vấn khóa chính đơn giản.
* **Kết quả**:
  - Độ trễ phục vụ trung bình (Average Latency) chỉ đạt **0.88 ms** (P95 đạt **1.21 ms**, P99 đạt **1.40 ms**), đáp ứng xuất sắc mục tiêu hiệu năng < 2ms trên môi trường Production.
