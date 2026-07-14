KIẾN TRÚC HỆ THỐNG GỢI Ý SẢN PHẨM AMAZON 2026 (LOCAL-SCALE)
Cấu hình mục tiêu: Laptop AMD Ryzen 7 7840 (8 Cores/16 Threads), NVIDIA RTX 4080 Mobile (12GB VRAM), RAM hệ thống trống tối đa 6GB.

I. TỔNG QUAN HỆ THỐNG (OVERVIEW)
Pipeline phục vụ: Gồm 4 tầng cốt lõi: Preprocessing -> Retrieval -> Reranking -> Serving.

Triết lý thiết kế: Bảo vệ RAM nghiêm ngặt. Chuyển dịch toàn bộ cơ chế từ In-Memory sang Disk-based (Lazy Loading) và áp dụng Quantization triệt để.

Vị trí LLM: Loại bỏ hoàn toàn khỏi đường truyền chính (Critical Path). Chỉ chạy bất đồng bộ (Async) ngoài luồng serving.

II. CHI TIẾT CÁC TẦNG KIẾN TRÚC
1. Preprocessing (Offline & Lazy Loading)
Quản lý Metadata: Sử dụng SQLite lưu trên SSD để map từ parent_asin sang thông tin sản phẩm (title, category, price). Không load Dict/Dataframe vào RAM để tránh lỗi Out-Of-Memory (OOM).

Quản lý Embedding: Dữ liệu vector có 384 chiều (float32). Lưu trữ tập trung dưới dạng file nhị phân và truy xuất qua numpy.memmap hoặc RocksDB/LMDB để đọc trực tiếp từ SSD theo cơ chế lazy loading khi cần.
 
Item Embedding Model: Sử dụng bge-small-en-v1.5 chạy trên CPU. Đầu vào chỉ gồm Title + Features + Aspect Summary của review (không embed review thô).

2. Retrieval (Online, Mục tiêu: ~50-60ms)
Cấu trúc Index: Sử dụng Faiss HNSW hoặc IVF-PQ tùy thuộc vào Dimension:

Lựa chọn ưu tiên: Với 1M vector d=384 (float32), kích thước vector thô chỉ khoảng ~1.5GB RAM. Hệ thống sẽ sử dụng HNSW với tham số thấp (M=16, ef=64) để giữ tổng dung lượng index ở mức ~2GB RAM, đảm bảo an toàn cho mức 6GB trống và giữ mức Recall@K cao nhất.

Candidate Pool Size: Rút gọn từ Top-100 xuống Top-30 ứng viên. Giảm tải tối đa cho tầng Rerank phía sau để bù đắp cho giới hạn điện năng (TDP) của GPU Laptop.

Cold-start Path: Tách riêng một nhánh logic lấy nhanh Top-10 sản phẩm mới dựa trên thuộc tính/danh mục (Metadata-driven), merge thẳng vào pool 30 ứng viên trước khi chuyển tầng.

3. Reranking (Online, Mục tiêu: ~50-80ms)
Mô hình cốt lõi: Sử dụng cross-encoder/ms-marco-MiniLM-L-6-v2 Cross-Encoder. Bắt buộc phải được compile sang định dạng TensorRT INT8 để chạy trên GPU RTX 4080 Mobile.

Cơ chế Batching: Điểm nghẽn xử lý được giải quyết nhờ việc giảm Candidate Pool xuống Top-30. Khối lượng tính toán 30 pairs (Query - Item) trên TensorRT INT8 giúp ép Latency xuống mức tối thiểu mà không gây tụt xung GPU do quá nhiệt trên laptop.

Score Fusion & Đa dạng hóa: Điểm số từ tầng Retrieval và độ phổ biến (Popularity) được kết hợp qua thuật toán RRF (Reciprocal Rank Fusion). Kết quả sau đó qua bộ lọc MMR (Maximal Marginal Relevance) ngay trên CPU (tốn ~3ms) để xuất ra Top-10 sản phẩm cuối cùng.

4. Serving & Memory Management
Framework: Sử dụng FastAPI chạy qua Uvicorn với cấu hình duy nhất 1 Worker (--workers 1) nhằm triệt tiêu hành vi nhân bản process (Process Cloning) làm cạn kiệt RAM của Python.

Xử lý Concurrency: Tách biệt các tác vụ I/O bound (đọc SSD, SQLite) bằng asyncio, còn các tác vụ nặng CPU (như Faiss Search) được đẩy vào một Process Pool riêng để tận dụng kiến trúc nhiều nhân của Ryzen 7 7840.

Quản lý Cache: Loại bỏ Redis server để tiết kiệm RAM chạy nền. Thay thế bằng LRU Cache cục bộ (In-process) thông qua thư viện Python thuần (cachetools) với giới hạn lưu tối đa lịch sử của 1,000 user active.

Giải phóng Bộ nhớ: Gọi lệnh gc.collect() chủ động sau các phiên xử lý batch nặng để hỗ trợ dọn dẹp tài nguyên.

5. Asynchronous LLM (Cold-start & Explanation)
Mô hình: Dùng mô hình nhỏ Qwen2.5-3B hoặc Gemma-3-4B định dạng GGUF 4-bit chạy trên nền llama.cpp tận dụng CPU.

Luồng hoạt động: Hoàn toàn tách biệt. Request yêu cầu giải thích lý do gợi ý hoặc hội thoại cold-start sẽ được đẩy vào Background Task của FastAPI. Kết quả trả về sau qua cặp giao thức WebSocket/Long-polling, tuyệt đối không block luồng API gợi ý chính.

III. CHI TIẾT HỆ THỐNG ĐÁNH GIÁ & BENCHMARK THỰC TẾ
Hệ thống không dựa trên các con số ước tính lý thuyết mà bắt buộc phải chạy script kiểm thử độc lập (Sanity Check) để đo đạc:

RAM Footprint: Tổng dung lượng RAM khi nạp đồng thời FastAPI + Faiss Index + SQLite + 1,000 LRU Cache items (Target: < 3.5 GB).

CPU Encoding Latency: Thời gian bge-small-en-v1.5 sinh vector cho 1 query trên Ryzen 7 (Target: < 20 ms).
 
GPU Inference Latency: Thời gian TensorRT INT8 cross-encoder/ms-marco-MiniLM-L-6-v2 châm điểm batch 30 sản phẩm trên RTX 4080 Mobile (Target: < 30 ms).