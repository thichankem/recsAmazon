# KẾT QUẢ BENCHMARK CÁC MÔ HÌNH (PHASE 1 - PHƯƠNG ÁN C)

Báo cáo kết quả đo đạc hiệu năng thực tế của Mô hình Embedding (`BAAI/bge-small-en-v1.5`) và Mô hình Reranker (`cross-encoder/ms-marco-MiniLM-L-6-v2`) trên phần cứng kiểm thử:
*   **CPU**: AMD Ryzen 7 7840HS (8 Cores / 16 Threads)
*   **GPU**: NVIDIA GeForce RTX 4080 Mobile (12GB VRAM, Cấu hình FP16)
*   **Hệ điều hành**: Windows 11

---

## 1. MÔ HÌNH EMBEDDING: `BAAI/bge-small-en-v1.5`

Mô hình được chạy hoàn toàn trên **CPU** nhằm kiểm tra khả năng phục vụ khi không sử dụng tài nguyên đồ họa.

*   **Thời gian load mô hình**: `8.60 giây`
*   **Dung lượng RAM tiêu thụ thêm**: `279.90 MB` (Rất nhẹ, tối ưu RAM cực tốt so với giới hạn 6GB trống).

### Kết quả Latency theo Batch Size:

| Kích thước lô (Batch Size) | Tổng thời gian thực thi (Wall Time) | CPU Time tương ứng | Latency trung bình mỗi Query | RAM hệ thống sau khi chạy |
| :--- | :--- | :--- | :--- | :--- |
| **1 query** (Warmup) | `0.0219 giây` | `0.0312 giây` | **21.87 ms** | `760.08 MB` |
| **100 queries** | `0.4546 giây` | `1.2188 giây` | **4.55 ms** | `792.46 MB` |
| **1000 queries** | `4.3937 giây` | `12.8594 giây` | **4.39 ms** | `807.80 MB` |

> [!NOTE]
> Latency đơn query chỉ tốn **21.87 ms** trên CPU thô, tiệm cận rất sát mục tiêu thiết kế ban đầu (`< 20 ms`). Khi xử lý batch lớn (100 - 1000 queries), tốc độ xử lý song song trên CPU được tối ưu hóa giúp ép latency trung bình xuống chỉ còn **4.39 - 4.55 ms/query**.

---

## 2. MÔ HÌNH RERANKER: `cross-encoder/ms-marco-MiniLM-L-6-v2`

Mô hình được chạy trên **GPU (CUDA)** ở định dạng bán chính xác **FP16** (Half Precision).

*   **Thời gian load mô hình**: `8.07 giây`
*   **Dung lượng RAM hệ thống tiêu thụ thêm**: `337.41 MB`
*   **Dung lượng VRAM tiêu thụ thêm**: **43.87 MB** (Cực kỳ tiết kiệm VRAM, gần như không ảnh hưởng tới các tác vụ khác).

### Kết quả Latency theo Số lượng cặp (Batch Size):

| Số lượng cặp châm điểm (Query-Passage Pairs) | Tổng thời gian (Wall Time) | CPU Time | RAM hệ thống sau chạy | VRAM tiêu thụ thực tế |
| :--- | :--- | :--- | :--- | :--- |
| **1 cặp** | `11.72 ms` | `0.00 ms` | `1163.31 MB` | `51.99 MB` |
| **10 cặp** | `14.77 ms` | `0.00 ms` | `1163.98 MB` | `52.00 MB` |
| **30 cặp** (Kích thước ứng viên mục tiêu) | **22.20 ms** | `0.00 ms` | `1155.96 MB` | `52.02 MB` |
| **50 cặp** | `14.87 ms` | `0.00 ms` | `1159.36 MB` | `52.05 MB` |

> [!IMPORTANT]
> Latency châm điểm cho **30 ứng viên** (batch size 30 pairs) trên GPU RTX 4080 Mobile chỉ mất **22.20 ms**, vượt trội so với mục tiêu thiết kế ban đầu (`Target: < 30 ms`). 
> Điểm đặc biệt là kết quả này đạt được bằng **PyTorch FP16 thông thường**, chưa cần qua các bước biên dịch phức tạp sang TensorRT INT8. Điều này giúp giảm độ phức tạp khi triển khai mà vẫn đảm bảo hiệu năng cực kỳ ấn tượng và tải nhiệt độ (TDP) rất thấp cho GPU laptop.

---

## 3. NHẬN XÉT & ĐÁNH GIÁ (CONCLUSION)

1.  **Đạt chỉ tiêu tài nguyên (RAM/VRAM)**: Tổng dung lượng RAM cần cho cả 2 mô hình chạy đồng thời chỉ khoảng **~617 MB** (Embedding ~280MB + Reranker ~337MB). Dung lượng VRAM chiếm dụng chỉ vỏn vẹn **~44 MB**. Phương án C hoàn toàn giải quyết triệt để bài toán thắt chặt RAM hệ thống (< 6GB trống).
2.  **Latency siêu tốc**: 
    *   Retrieval (Embedding CPU): **~21 ms**
    *   Reranking (GPU FP16): **~22 ms**
    *   Tổng thời gian xử lý AI (AI Latency): **~43 ms** (Mục tiêu hệ thống là `< 100 ms`, do đó chúng ta còn dư **~57 ms** cho phần logic SQLite, RRF, MMR và FastAPI Serving).
3.  **Khả năng đơn giản hóa**: Vì PyTorch FP16 đã đạt latency 22 ms cho batch 30 sản phẩm, chúng ta có thể cân nhắc sử dụng trực tiếp PyTorch FP16 ở Phase 3 thay vì bắt buộc phải compile qua TensorRT INT8 (giúp giảm thiểu lỗi tương thích thư viện trên Windows).
