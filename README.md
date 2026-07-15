# Framework Kiểm Thử Hệ Gợi Ý (Recommendation Testing Framework)

Dự án này là bộ khung kiểm thử và đánh giá hiệu năng (benchmarking) toàn diện cho các thuật toán gợi ý sản phẩm. Framework hỗ trợ giả lập hành vi người dùng, đánh giá các kịch bản trải nghiệm thực tế (Trang chủ, Chi tiết sản phẩm, Cold-Start), thu thập độ trễ (latency), và trực quan hóa kết quả thông qua dashboard tương tác Streamlit.

---

## 1. Cấu Trúc Thư Mục Dự Án (File Architecture)

```text
recommendation-testing/
│
├── configs/
│   ├── config.yaml                  # Cấu hình chung (model, top_k, dataset, thread...)
│   └── experiment.yaml              # Cấu hình từng lần benchmark (tên experiment, seed, runs...)
│
├── datasets/
│   ├── raw/                         # Dataset gốc (đầu vào cho quá trình huấn luyện)
│   ├── processed/                   # Dataset sau khi được xử lý/phân tích
│   └── ground_truth/                # Dữ liệu thực tế của user để evaluator so sánh chấm điểm
│
├── models/
│   ├── base_recommender.py          # Interface chung mà mọi thuật toán phải triển khai
│   ├── content_based.py             # Gợi ý dựa trên đặc trưng sản phẩm (Content-Based)
│   ├── collaborative_filtering.py   # Gợi ý dựa trên tương tác người dùng (Collaborative Filtering)
│   ├── hybrid.py                    # Thuật toán lai ghép (Hybrid) kết hợp cả hai phương pháp
│   └── model_factory.py             # Khởi tạo thuật toán dựa trên cấu hình config.yaml
│
├── adapters/
│   ├── base_adapter.py              # Interface Adapter
│   ├── local_adapter.py             # Adapter gọi trực tiếp class python trong bộ nhớ
│   └── production_adapter.py        # Adapter gọi HTTP API đến máy chủ Production thật
│
├── scenarios/
│   ├── homepage.py                  # Kịch bản gợi ý tại Trang chủ (không có context sản phẩm)
│   ├── product_page.py              # Kịch bản gợi ý tại Trang chi tiết (có context sản phẩm hiện tại)
│   └── cold_start.py                # Kịch bản gợi ý cho Người dùng mới (Cold-Start - không có lịch sử)
│
├── simulator/
│   ├── playwright_runner.py         # Trình quản lý Playwright điều khiển đa luồng trình duyệt
│   ├── user_simulator.py            # Trình giả lập phiên làm việc (Session, cookie, thông tin user)
│   ├── behavior_generator.py        # Trình sinh hành vi click/tương tác theo đối tượng (ví dụ: Apple fan, Gamer)
│   └── context_detector.py          # Trình phát hiện ngữ cảnh trang dựa trên URL
│
├── collector/
│   ├── recommendation_collector.py  # Thu thập danh sách gợi ý và điểm số gợi ý
│   └── latency_collector.py         # Thu thập độ trễ, số lần timeout, lỗi API
│
├── evaluator/
│   ├── metrics.py                   # Triển khai các chỉ số Precision@K, Recall@K, NDCG, Diversity, HitRate
│   ├── scorer.py                    # Tính điểm trung bình và các tổng hợp số liệu
│   ├── benchmark.py                 # Điều phối chạy toàn bộ kịch bản và thu thập kết quả
│   └── report_generator.py          # Xuất báo cáo dưới dạng JSON, CSV và HTML
│
├── dashboard/
│   ├── app.py                       # Giao diện Dashboard chính (Streamlit)
│   ├── charts.py                    # Vẽ biểu đồ phân bố độ trễ và chỉ số gợi ý
│   ├── comparison.py                # So sánh hiệu năng giữa các lần chạy (experiment)
│   └── explorer.py                  # Công cụ xem chi tiết danh sách gợi ý cho từng user cụ thể
│
├── experiments/                     # Lưu trữ kết quả của các lần chạy thực nghiệm
│
├── reports/                         # Báo cáo đầu ra (JSON, CSV, HTML)
│
├── utils/
│   ├── logger.py                    # Quản lý logs
│   ├── timer.py                     # Đo đạc thời gian và độ trễ chính xác
│   ├── random.py                    # Các hàm sinh số ngẫu nhiên đảm bảo tính nhất quán (Seeded)
│   └── helper.py                    # Các hàm bổ trợ đọc/ghi cấu hình YAML và JSON
│
├── run.py                           # File khởi chạy toàn bộ benchmark
│
└── requirements.txt                 # Danh sách thư viện Python cần thiết
```

---

## 2. Hướng Dẫn Cài Đặt (Installation)

1. Cài đặt các thư viện Python được liệt kê trong `requirements.txt`:
   ```bash
   pip install -r recommendation-testing/requirements.txt
   ```

2. (Tùy chọn) Cài đặt trình duyệt Playwright nếu bạn muốn sử dụng tính năng kiểm thử UI thật:
   ```bash
   playwright install
   ```
   *Lưu ý: Nếu không có Playwright hoặc các trình duyệt chưa được cài đặt, framework sẽ tự động kích hoạt chế độ Giả lập Trình duyệt (Mock Browser Simulation) để không làm gián đoạn luồng chạy.*

---

## 3. Cách Vận Hành (How to Run)

### Bước 1: Chạy Benchmark Đánh Giá
Để khởi động bộ công cụ kiểm thử trên toàn bộ các kịch bản đã khai báo, hãy chạy file `run.py`:
```bash
python recommendation-testing/run.py
```
*Hệ thống sẽ tự động kiểm tra và sinh dữ liệu giả lập (mock datasets) nếu thư mục trống, sau đó tiến hành benchmark và ghi file báo cáo vào thư mục `reports/` và `experiments/`.*

### Bước 2: Khởi Động Dashboard Trực Quan Hóa
Để xem kết quả phân tích số liệu gợi ý và so sánh mô hình trực quan:
```bash
cd recommendation-testing
streamlit run dashboard/app.py
```
Dashboard cung cấp 3 tab chức năng:
* **Overview Metrics**: Xem nhanh kết quả Precision, Recall, NDCG, Diversity và phân tích SLA Latency của Experiment hiện tại.
* **Model Comparison**: So sánh chéo các chỉ số chính xác và tốc độ phản hồi giữa các lần thực nghiệm.
* **Recommendation Explorer**: Xem chi tiết danh sách sản phẩm gợi ý kèm theo điểm số cho từng User ID trong từng kịch bản cụ thể.
