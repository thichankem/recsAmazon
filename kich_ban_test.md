# Kịch Bản Kiểm Thử & Đánh Giá Hệ Gợi Ý (Bot Testing Flow)

Tài liệu này mô tả chi tiết luồng hoạt động của các Bot tự động (sử dụng Playwright) nhằm mục đích kiểm thử, đánh giá và đối chiếu độ chính xác của các mô hình AI gợi ý sản phẩm tự xây dựng với **thuật toán thực tế của Amazon**.

Hệ thống cung cấp 3 kịch bản Bot tương ứng với 3 bài toán chính trong Recommendation System.

---

## 1. Kịch bản 1: Đánh giá Collaborative Filtering (Lọc Cộng Tác)
**Mục tiêu:** Kiểm tra xem mô hình Gợi ý dựa trên Lịch sử Xem (Item-Item CF / SVD) có dự đoán giống với những gì Amazon gợi ý hay không.
**File thực thi:** `test/amazon_collab_bot.spec.ts`

### 🔄 Luồng hoạt động (Workflow):
1. **Khởi tạo Hành vi (Simulated User):** Bot được gán một "nhân vật" (ví dụ: Tín đồ Apple, Gamer...).
2. **Thu thập Lịch sử (Browsing History):** Bot tự động truy cập vào trang Amazon.com và click xem liên tiếp một chuỗi các sản phẩm (Sản phẩm A → Sản phẩm B → Sản phẩm C → Sản phẩm D).
3. **Cào dữ liệu Ground Truth:** Tại mỗi trang sản phẩm, Bot sẽ cuộn xuống và cào tất cả các sản phẩm hiển thị trong mục *"Customers who bought this also bought..."* hoặc *"Customers who viewed this item also viewed"*. Đây được xem là kết quả chuẩn (Ground Truth) thực tế từ Amazon.
4. **Chạy Mô hình Local:** Sau khi xem xong chuỗi sản phẩm, Bot gom danh sách các tiêu đề đã xem `[Title A, Title B, Title C, Title D]` và gửi cho script Python cục bộ (`predict_collaboration.py`).
5. **Đối chiếu & Đánh giá:** Mô hình AI nội bộ trả về Top-10 sản phẩm gợi ý. Bot sẽ so sánh 10 sản phẩm này với tập Ground Truth của Amazon. Tỷ lệ trùng khớp (Overlap/Hit-rate) sẽ được tính toán và xuất ra file JSON (nằm trong thư mục `output/`).

---

## 2. Kịch bản 2: Đánh giá Content-Based Filtering (Lọc Theo Nội Dung)
**Mục tiêu:** Kiểm tra khả năng tìm kiếm sản phẩm tương đồng dựa vào đặc trưng văn bản (Tiêu đề, Mô tả sản phẩm).
**File thực thi:** `test/amazon_ai_bot.spec.ts`

### 🔄 Luồng hoạt động (Workflow):
1. **Tìm kiếm & Trích xuất:** Bot truy cập vào một sản phẩm cụ thể trên Amazon (do lập trình viên định cấu hình hoặc bot tự random).
2. **Thu thập Đặc trưng (Features):** Bot cào chính xác `Title` (Tiêu đề) và `Description/Features` (Mô tả, Tính năng) của sản phẩm đó.
3. **Thu thập Ground Truth:** Bot thu thập các sản phẩm mà Amazon gợi ý ở phần *"Products related to this item"* (Sản phẩm liên quan).
4. **Phân tích NLP Local:** Bot gửi Tiêu đề và Mô tả vừa cào được vào script Python (`predict.py`). Script này sẽ dùng thuật toán TF-IDF và Cosine Similarity để trích xuất từ khóa, sau đó quét trong kho data cục bộ (`meta_Cell_Phones_and_Accessories.jsonl`) để tìm ra các sản phẩm có nội dung tương đồng nhất.
5. **Đối chiếu:** Kiểm tra xem danh sách sản phẩm AI tự động tìm được có chung "ngữ nghĩa" hoặc có trùng với danh sách gợi ý liên quan của Amazon hay không. Kết quả được lưu log.

---

## 3. Kịch bản 3: Kịch bản Zero-Shot / Cold-Start từ URL bất kỳ
**Mục tiêu:** Kiểm tra sự nhạy bén của mô hình AI khi đưa vào một trang web hoàn toàn không thuộc Amazon (Ví dụ: Một trang tin tức công nghệ, trang web hãng Apple). Xem AI có hiểu người dùng đang đọc về cái gì và gợi ý đồ tương tự trên Amazon được không.
**File thực thi:** `test/amazon_url_bot.spec.ts`

### 🔄 Luồng hoạt động (Workflow):
1. **Truy cập URL Ngoại lai:** Bot mở một link URL do người dùng cung cấp (mặc định là `https://www.apple.com/iphone-15-pro/`).
2. **Quét toàn văn (Scraping):** Bot cào toàn bộ văn bản hiển thị trên giao diện của website đó (`document.body.innerText`), bất chấp định dạng.
3. **Phân tích Nội dung (AI NLP):** Đoạn văn bản khổng lồ được ném vào mô hình Content-Based cục bộ. AI tự động làm sạch (clean text), tính toán ma trận trọng số TF-IDF, lọc ra các từ khóa quan trọng (như "iPhone", "Pro", "Titanium", "Camera"...).
4. **Truy xuất Sản phẩm Amazon:** Dựa vào vector đặc trưng vừa tạo, AI bóc tách các món hàng trong kho dữ liệu Amazon khớp với bối cảnh của trang web.
5. **Kết quả:** Ta thu được một danh sách các món phụ kiện hoặc điện thoại phù hợp với nội dung bài báo/trang web mà không cần người dùng phải gõ bất cứ từ khóa tìm kiếm nào.

---

## 4. Kịch bản 4: Kịch bản Trải nghiệm Frontend (UI/UX Recommendation Flow)
**Mục tiêu:** Kiểm thử cách hệ thống phản hồi và hiển thị gợi ý theo thời gian thực dựa trên tương tác của người dùng trên giao diện Web (React).
**File thực thi:** Tương tác trực tiếp trên giao diện `http://localhost:5174/`

### 🔄 Luồng hoạt động (Workflow):
1. **Trạng thái Mới (Cold Start):**
   - Lần đầu tiên người dùng truy cập trang chủ, lịch sử xem (History) trống rỗng.
   - Giao diện hiển thị danh sách sản phẩm mặc định (ví dụ: Danh sách toàn bộ catalog hoặc các sản phẩm có rating cao nhất).
2. **Xem chi tiết sản phẩm (Kích hoạt Content-Based):**
   - Người dùng click vào một sản phẩm cụ thể (VD: "Ốp lưng iPhone 15").
   - Ứng dụng ngay lập tức trích xuất Tiêu đề & Mô tả của ốp lưng này và gọi ngầm API `/api/recommendations/content`.
   - Kết quả trả về được hiển thị ngay bên dưới thông tin sản phẩm dưới mục **"Sản phẩm gợi ý liên quan"**. Người dùng có thể lướt xem các ốp lưng hoặc phụ kiện có chung đặc tính.
3. **Cập nhật Trang chủ (Kích hoạt Collaborative Filtering):**
   - Người dùng đóng cửa sổ sản phẩm để quay lại trang chủ.
   - Sản phẩm vừa xem được lưu vào Lịch sử (Local Storage). Trạng thái ứng dụng thay đổi, tự động gửi danh sách lịch sử này qua API `/api/recommendations/collaborative`.
   - Giao diện trang chủ ngay lập tức biến đổi: Danh sách sản phẩm chung được thay thế/ưu tiên bằng mục **"Gợi ý dành riêng cho bạn"** (Personalized Recommendations) dựa trên hành vi vừa rồi.
4. **Học liên tục (Continuous Profiling):**
   - Người dùng tiếp tục click xem sản phẩm thứ 2, thứ 3...
   - Mảng lịch sử ngày càng dài ra. Thuật toán CF (hoặc SVD) nhận input đầu vào phong phú hơn, từ đó độ chính xác và tính cá nhân hóa trên trang chủ càng tăng lên sau mỗi thao tác click của người dùng.

---

> **Cách chạy kịch bản:**
> Giao diện Dashboard (`http://localhost:3000`) cung cấp sẵn các nút bấm để chạy các kịch bản này (như nút chạy "CF Bot", "CB Bot"). Khi click, API `/api/run-bot` sẽ được gọi và Playwright sẽ khởi chạy trình duyệt để thực thi các kịch bản tương ứng theo thời gian thực. Báo cáo đánh giá (Evaluation) sẽ được lưu lại để vẽ biểu đồ và phân tích trên Streamlit sau này.
