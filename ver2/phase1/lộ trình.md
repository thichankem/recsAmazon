```text
LỘ TRÌNH TRIỂN KHAI HỆ THỐNG GỢI Ý SẢN PHẨM AMAZON (RECOMMENDED)

Sơ đồ tổng quan

[GĐ 1: Dataset & Benchmark]
            ↓
[GĐ 2: Embedding & Storage]
            ↓
[GĐ 3: Retrieval & Evaluation]
            ↓
[GĐ 4: Reranking & Serving]
            ↓
[GĐ 5: Optimization & Load Test]
            ↓
(Optional)
[LLM Explanation]

====================================================
GIAI ĐOẠN 1: DATASET & BENCHMARK (Tuần 1)
====================================================

Mục tiêu:
- Hiểu rõ dataset.
- Kiểm tra giới hạn phần cứng.
- Có baseline trước khi tối ưu.

Nhiệm vụ 1: Dataset EDA

- Đọc dataset Amazon Reviews 2023.
- Thống kê:
  - Số lượng user.
  - Số lượng item.
  - Số review.
  - Phân bố category.
  - Rating distribution.
  - Missing value.
  - Duplicate.
  - Sparsity user-item.
- Xác định:
  - Cold-start user.
  - Cold-start item.
  - Long-tail products.

Nhiệm vụ 2: Benchmark Embedding

- Cài sentence-transformers.
- Tải BGE-Small-EN-V1.5.
- Encode thử:
  - 1 query.
  - 100 query.
  - 1000 query.
- Đo:
  - Latency.
  - CPU usage.
  - RAM usage.

Target:

- Encode 1 query < 20ms (tham khảo).
- Không OOM.

Nhiệm vụ 3: Benchmark GPU

- Chạy cross-encoder/ms-marco-MiniLM-L-6-v2 bằng PyTorch trước.
- Đo:
  - VRAM.
  - Batch size.
  - Latency.

Chỉ sau khi mọi thứ ổn định mới thử:

- ONNX
- OpenVINO
- TensorRT

====================================================
GIAI ĐOẠN 2: EMBEDDING & STORAGE (Tuần 2)
====================================================

Mục tiêu:

- Xây dựng kho dữ liệu nhẹ.
- Sinh embedding.

Nhiệm vụ 1: SQLite

Tạo database:

amazon_products.db

Metadata:

- parent_asin
- title
- category
- brand
- price
- popularity_score

Tạo index:

parent_asin

Nhiệm vụ 2: Embedding

Sinh embedding bằng BGE-Small-EN-V1.5.

Chỉ embed:

- title
- feature
- summary

Lưu embedding:

numpy.memmap

Không load toàn bộ embedding vào RAM.

====================================================
GIAI ĐOẠN 3: RETRIEVAL & EVALUATION (Tuần 3)
====================================================

Mục tiêu:

Hoàn thiện tầng Retrieval.

Nhiệm vụ 1: Baseline

Xây Brute Force Search.

Benchmark:

- Recall
- Latency

Đây là mốc chuẩn để so sánh.

Nhiệm vụ 2: HNSW

Tạo FAISS HNSW.

Benchmark:

- Recall@10
- Recall@20
- Recall@50
- Recall@100
- HitRate
- MRR
- NDCG
- Latency
- RAM

Nếu HNSW không đạt yêu cầu RAM hoặc tốc độ mới chuyển sang IVF-PQ.

Nhiệm vụ 3: Cold Start

Nếu user mới:

Lấy:

- Best Seller
- New Arrival
- Popular Products

Merge với candidate retrieval.

====================================================
GIAI ĐOẠN 4: RERANKING & SERVING (Tuần 4)
====================================================

Mục tiêu:

Tạo API hoàn chỉnh.

Nhiệm vụ 1: Reranker

Sử dụng:

cross-encoder/ms-marco-MiniLM-L-6-v2

Input:

Top-K Retrieval

Output:

Top-10 Recommendation

Áp dụng:

- RRF
- MMR

Benchmark:

- Latency
- Accuracy

Nếu cần mới tối ưu bằng:

- ONNX
- TensorRT

Nhiệm vụ 2: FastAPI

Endpoint:

GET /recommend

Thêm:

- cachetools LRU Cache
- Logging
- Error Handling
- Metrics

Chạy:

uvicorn main:app --workers 1

====================================================
GIAI ĐOẠN 5: OPTIMIZATION & LOAD TEST (Tuần 5)
====================================================

Mục tiêu:

Đánh giá toàn hệ thống.

Nhiệm vụ 1: Benchmark

Đo:

- RAM
- VRAM
- CPU
- GPU
- SSD I/O
- Latency P50
- Latency P95
- Latency P99
- Throughput (QPS)

Nhiệm vụ 2: Load Test

Sử dụng:

Locust

Benchmark:

- 1 QPS
- 5 QPS
- 10 QPS

Theo dõi:

- Không OOM.
- Không swap.
- Không thermal throttling.
- API ổn định.

====================================================
OPTIONAL: LLM EXPLANATION
====================================================

Chỉ thực hiện sau khi toàn bộ hệ thống Recommendation đã ổn định.

Sử dụng:

- Qwen2.5-3B GGUF
hoặc
- Gemma-3-4B GGUF

Chạy bằng:

llama.cpp

LLM chỉ dùng cho:

- Recommendation Explanation
- Natural Language Summary

LLM phải chạy bất đồng bộ (Background Task), không nằm trên luồng trả kết quả chính.

====================================================
NGUYÊN TẮC TRIỂN KHAI
====================================================

1. Làm đúng trước, tối ưu sau.
2. Mọi quyết định đều dựa trên benchmark thực tế.
3. Không tối ưu hóa sớm (Premature Optimization).
4. Chỉ chuyển sang ONNX, TensorRT hoặc IVF-PQ khi benchmark chứng minh HNSW/PyTorch không đáp ứng yêu cầu.
5. Mỗi giai đoạn đều phải có số liệu benchmark trước khi chuyển sang giai đoạn tiếp theo.
```

Mình đánh giá đây là lộ trình cân bằng hơn: có **baseline**, **đánh giá chất lượng (Recall/NDCG)**, **benchmark hiệu năng**, và chỉ tối ưu khi có số liệu thực tế thay vì giả định ngay từ đầu.
