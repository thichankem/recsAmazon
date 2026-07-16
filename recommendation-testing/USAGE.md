# Hướng Dẫn Sử Dụng: Playwright Bot Click Simulation & Relevance Scoring A/B Testing

Tài liệu này hướng dẫn cách chạy và trình diễn (demo) hệ thống giả lập hành vi người dùng, kiểm thử A/B và đánh giá mức độ tương thích hệ gợi ý (Relevance & Compatibility Scorecard) dựa trên dữ liệu Amazon Cell Phones & Accessories.

---

## 1. Thành Phần Hệ Thống

Dự án bao gồm các thành phần chính:
* **Backend API Server (`server.py`)**: Dịch vụ FastAPI huấn luyện mô hình gợi ý Hybrid (Collaborative + Content-Based), cung cấp giao diện điện thoại mockup tương tác (`/product/{item_id}`), đăng ký động sản phẩm mới từ Amazon và kích hoạt bot Playwright.
* **Frontend Dashboard (`dashboard/app.py`)**: Giao diện Streamlit hiển thị các biểu đồ hiệu năng, đo lường độ trễ và cung cấp tab điều khiển giả lập **"Real URL & Bot Simulator"**.
* **Playwright Bot Simulator (`bot_simulator.py`)**: Điều khiển trình duyệt ẩn (headless browser) truy cập vào máy chủ cục bộ, thực hiện chuỗi click hành vi hoàn toàn ngẫu nhiên (hoặc tùy chọn theo từ khóa chỉ định) để sinh lịch sử duyệt web và đánh giá chất lượng gợi ý của hệ thống.

---

## 2. Cách Khởi Chạy Hệ Thống

Để khởi động toàn bộ môi trường demo, vui lòng chạy các lệnh sau trong terminal:

### Bước 1: Khởi chạy API Server Backend
Mở một terminal và chạy lệnh sau từ thư mục gốc của dự án:
```bash
python recommendation-testing/server.py
```
*Dịch vụ API Server và trang điều khiển hoạt động tại địa chỉ: [http://localhost:8000/](http://localhost:8000/)*

### Bước 2: Khởi chạy Streamlit Dashboard Frontend
Mở một terminal thứ hai và di chuyển vào thư mục `recommendation-testing`, sau đó chạy Streamlit:
```bash
cd recommendation-testing
streamlit run dashboard/app.py --server.port 8501
```
*Trang Dashboard phân tích và điều khiển giả lập sẽ mở tại địa chỉ: [http://localhost:8501/](http://localhost:8501/)*

---

## 3. Hướng Dẫn Demo Giao Diện (Tab "Real URL & Bot Simulator")

Sau khi mở [http://localhost:8501/](http://localhost:8501/), chọn mục **"Real URL & Bot Simulator"** ở thanh điều hướng bên trái và thực hiện các bước sau để trình chiếu cho khách hàng:

### Bước A: Nhập URL Sản phẩm (Amazon, FPTShop, v.v.)
1. Dán link sản phẩm bất kỳ từ trang Amazon thật hoặc bất kỳ trang thương mại điện tử nào khác (ví dụ: `https://fptshop.com.vn/dien-thoai/iphone-17e`).
2. Hệ thống sẽ tự động phân tích ASIN và trích xuất thông tin sản phẩm từ URL.
3. **Cơ chế Error Fallback**: Nếu URL là một trang không tồn tại hoặc bị lỗi 404 (ví dụ dòng điện thoại iPhone 17e chưa chính thức ra mắt), hệ thống sẽ bỏ qua tiêu đề lỗi của trang 404 và tự động phân tích URL slug để trích xuất tên sản phẩm dự kiến (`Iphone 17E`), hãng sản xuất (`Apple`), và danh mục một cách chính xác.

### Bước B: Thiết lập Kịch bản Click của Bot
1. Tại ô **"Bot Click Path Keywords"**, nhập danh sách từ khóa mô phỏng hành trình click của khách hàng, ngăn cách bằng dấu phẩy (ví dụ: `iphone 17, iphone 16, iphone 15`).
2. **Mô phỏng Playwright Tương tác thật**: 
   - Đối với các từ khóa tìm kiếm, bot Playwright sẽ điền từ khóa vào thanh công cụ tìm kiếm trên mockup page, bấm tìm kiếm, và click vào kết quả phù hợp đầu tiên trên trang kết quả.
   - Nếu để trống kịch bản click, bot Playwright sẽ tìm các thẻ gợi ý (`.rec-card`) hiện có trên trang và click ngẫu nhiên vào đó (clickrandom) để tiếp tục hành trình.

### Bước C: Xem kết quả so sánh A/B & Chấm điểm
Nhấn nút **"🚀 Execute Playwright Bot Simulation"** và theo dõi kết quả hiển thị trực tiếp:

1. **Extracted URL Context**: Hiển thị thẻ thông tin sản phẩm thu thập được từ URL (ASIN, Loại trang, Thương hiệu, Chế độ cào dữ liệu).
2. **Live Bot Playwright Terminal Logs**: Hiển thị nhật ký chi tiết quá trình bot khởi chạy trình duyệt Playwright thực hiện tìm kiếm và click tương tác.
   - **Ghi nhật ký URL (URL Check)**: Bên cạnh mỗi thao tác điều hướng hoặc click sản phẩm, hệ thống hiển thị chính xác địa chỉ URL mà bot đã click (ví dụ: `-> URL: http://127.0.0.1:8000/product/B0DYN...`) giúp bạn dễ dàng sao chép và kiểm tra bối cảnh sản phẩm.
3. **A/B Testing Recommendation Output (Top 10 Products)**:
   - **Variant A (Control - Standard CF/CB)**: Gợi ý các sản phẩm điện thoại hoặc phụ kiện chung chung theo thuật toán chuẩn của hệ gợi ý.
   - **Variant B (Treatment - Accessory-Boosted)**: Tự động kích hoạt bộ lọc tăng cường phụ kiện (**Accessory Booster**). Hệ gợi ý sẽ tự động đẩy lên các sản phẩm **ốp lưng, kính cường lực** tương thích chính xác với thiết bị cuối cùng bot đang click (ví dụ: tự động đổi tên/gợi ý ốp lưng tương thích với `iPhone 15`).
4. **Recommendation Relevance & Compatibility Scorecard (Chấm Điểm Hệ Gợi Ý)**:
   - Chấm điểm tự động trên thang điểm **100** dựa trên mức độ chính xác của các sản phẩm gợi ý:
     - Cộng tối đa **50 điểm** cho tính liên quan danh mục (phần trăm sản phẩm gợi ý là phụ kiện/ốp lưng).
     - Cộng tối đa **50 điểm** cho tính tương thích phiên bản thiết bị (các phụ kiện được gợi ý khớp chính xác với dòng máy cuối cùng bot đã xem).
   - Điểm số trực quan hiển thị qua thanh phần trăm màu sắc (Variant B đạt điểm tối đa **100/100** nhờ tính năng tự động tối ưu hóa phụ kiện so với Variant A).

