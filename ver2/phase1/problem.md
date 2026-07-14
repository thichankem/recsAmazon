# TRẠNG THÁI VẤN ĐỀ: ĐÃ GIẢI QUYẾT (RESOLVED)

Vấn đề nghẽn mạng khi tải mô hình lớn từ Hugging Face đã được giải quyết triệt độ theo chỉ thị của bạn bằng cách áp dụng **Phương án C** kết hợp với các tối ưu hóa tải nâng cao:

*   **Mô hình Embedding:** Chuyển đổi từ `BAAI/bge-m3` (2.27 GB) sang **`BAAI/bge-small-en-v1.5`** (~130 MB).
*   **Mô hình Reranker:** Chuyển đổi từ `BAAI/bge-reranker-v2-m3` (2.27 GB) sang **`cross-encoder/ms-marco-MiniLM-L-6-v2`** (~90 MB).

### Các công việc đã thực hiện để giải quyết:
1. **Lọc định dạng thừa**: Loại bỏ toàn bộ các file định dạng JAX, TensorFlow, LibTorch, ONNX và OpenVINO khỏi danh sách tải của Hugging Face.
2. **Cấu hình thời gian chờ socket**: Thiết lập socket default timeout 30s và tự động thử lại 5 lần để chống rớt kết nối mạng.
3. **Tải trực tiếp có resume**: Tự viết script tải trực tiếp tệp trọng số safetensors qua HTTP stream giúp tải thành công tệp 86.66 MB của reranker và hỗ trợ tiếp tục tải lại khi đứt kết nối giữa chừng.
4. **Đo đạc hiệu năng**: Đã chạy thử nghiệm hiệu năng của cả hai mô hình thành công tốt đẹp và ghi nhận tại [benchmark.md](file:///c:/Users/ADMIN/OneDrive/Máy tính/recsAmazon/benchmark.md).

### Các tệp cấu hình và mã nguồn đã được cập nhật:
1. [Kiến trúc.md](file:///c:/Users/ADMIN/OneDrive/Máy tính/recsAmazon/Kiến trúc.md) - Cập nhật cấu hình mô hình nhỏ hơn và tính toán lại dung lượng RAM lưu trữ index (d=384, ~2GB RAM cho 1M items).
2. [lộ trình.md](file:///c:/Users/ADMIN/OneDrive/Máy tính/recsAmazon/lộ trình.md) - Điều chỉnh tên mô hình và target benchmark tương ứng.
3. [benchmark_embedding.py](file:///c:/Users/ADMIN/OneDrive/Máy tính/recsAmazon/src/phase1/benchmark_embedding.py) - Chuyển sang benchmark mô hình `BAAI/bge-small-en-v1.5`.
4. [benchmark_reranker.py](file:///c:/Users/ADMIN/OneDrive/Máy tính/recsAmazon/src/phase1/benchmark_reranker.py) - Chuyển sang benchmark mô hình `cross-encoder/ms-marco-MiniLM-L-6-v2`.
