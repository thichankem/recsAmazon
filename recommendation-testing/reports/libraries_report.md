# Báo Cáo Thư Viện Sử Dụng (Third-party & Standard Libraries Report)

Báo cáo này giải thích lý do lựa chọn và cách thức sử dụng của từng thư viện chuẩn (Standard Library) cũng như thư viện bên thứ ba (Third-party Library) trong Framework Kiểm Thử.

---

## 1. Thư viện chuẩn của Python (Standard Libraries)

Các thư viện này có sẵn trong Python, giúp hệ thống hoạt động ổn định và tối ưu hiệu năng mà không cần cài đặt thêm tài nguyên bên ngoài:

- **`pathlib (Path)`**: Dùng để xử lý đường dẫn tệp tin một cách hướng đối tượng. Nó giúp code chạy tương thích trên cả Windows và Linux mà không gặp lỗi dấu phân cách (`/` vs `\`).
- **`json`**: Được dùng để ghi/đọc dữ liệu cấu hình, lưu trữ tệp huấn luyện (`train_data.json`), và xuất báo cáo kết quả (`report.json`). Đặc biệt quan trọng khi phải stream và parse dữ liệu lớn dạng JSON Lines (.jsonl).
- **`collections (defaultdict)`**: Dùng trong quá trình huấn luyện mô hình để lưu trữ danh sách lịch sử của user và các user mua sản phẩm. Nhờ `defaultdict(list)` hoặc `defaultdict(set)`, code tránh được các bước kiểm tra khóa tồn tại dài dòng, giúp tăng tốc độ huấn luyện.
- **`urllib.request` & `urllib.error`**: Lớp `ProductionAdapter` sử dụng thư viện này để thực hiện cuộc gọi HTTP POST gửi Payload JSON tới server API bên ngoài. Việc sử dụng `urllib` mặc định thay vì thư viện `requests` giúp giảm bớt sự phụ thuộc bên thứ ba trong Adapter.
- **`time` & `time.perf_counter`**: Được gói trong class `Timer` để đo lường chính xác thời gian thực thi (độ trễ latency) của từng truy vấn gợi ý với độ chính xác ở mức mili-giây (ms).
- **`abc` (Abstract Base Classes)**: Định nghĩa lớp cơ sở trừu tượng (`BaseRecommender`, `BaseAdapter`) nhằm thiết lập một bộ khung giao tiếp (interface) thống nhất, đảm bảo tính đa hình (polymorphism) trong OOP.

---

## 2. Thư viện bên thứ ba (Third-party Libraries)

Các thư viện này được khai báo trong `requirements.txt` và đóng vai trò then chốt trong tính năng nâng cao của framework:

- **`fastapi` & `uvicorn`**: 
  - *Lý do lựa chọn*: FastAPI là web framework hiện đại, có tốc độ phản hồi cực nhanh nhờ sử dụng chuẩn ASGI, hỗ trợ khai báo kiểu dữ liệu và tự sinh tài liệu API (Swagger).
  - *Ứng dụng*: Dùng để viết file `server.py` giúp khởi chạy một máy chủ gợi ý thực tế trên URL `http://localhost:8000`.
- **`numpy`**:
  - *Lý do lựa chọn*: Hỗ trợ tính toán số học hiệu năng cao trên các mảng dữ liệu lớn.
  - *Ứng dụng*: Lớp `LatencyCollector` dùng `numpy` để tính toán các giá trị thống kê độ trễ SLA như: Giá trị trung bình (`mean`), Trung vị (`p50`), Phân vị thứ 95 (`p95`), và Phân vị thứ 99 (`p99`).
- **`pandas`**:
  - *Lý do lựa chọn*: Thư viện chuẩn mực để phân tích và thao tác trên dữ liệu bảng (DataFrames).
  - *Ứng dụng*: Dùng trong Dashboard Streamlit để đọc các tệp CSV kết quả benchmark và hiển thị bảng biểu gợi ý trực quan cho người sử dụng.
- **`streamlit`**:
  - *Lý do lựa chọn*: Cho phép xây dựng ứng dụng web tương tác nhanh chóng trực tiếp từ code Python mà không cần viết HTML/CSS/JS phức tạp.
  - *Ứng dụng*: Dùng để xây dựng bộ giao diện giám sát hiệu năng (Benchmarking Dashboard) hiển thị biểu đồ so sánh mô hình và thanh công cụ tìm kiếm gợi ý của từng user.
- **`playwright`**:
  - *Lý do lựa chọn*: Công cụ tự động hóa trình duyệt web (headless browser) hiện đại, nhẹ và nhanh hơn Selenium.
  - *Ứng dụng*: Dùng trong module giả lập để mở trình duyệt thật, tương tác trên giao diện trang chủ/trang sản phẩm nhằm đánh giá hiệu năng tải trang thực tế và trải nghiệm khách hàng (SLA đo từ client).
- **`PyYAML (yaml)`**:
  - *Lý do lựa chọn*: Đọc ghi các định dạng cấu hình YAML - vốn dễ đọc và viết hơn so với JSON đối với người dùng cuối.
  - *Ứng dụng*: Dùng để nạp file cấu hình hệ thống `config.yaml` và thông số chạy thực nghiệm `experiment.yaml`.
