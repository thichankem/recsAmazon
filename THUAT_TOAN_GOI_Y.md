# Báo Cáo Triển Khai Thuật Toán Gợi Ý Sản Phẩm (Recommendation System)

Tài liệu này giải thích chi tiết hai thuật toán gợi ý được triển khai trong hệ thống:
1. **Collaborative Filtering (Lọc cộng tác lai + Chuẩn hóa thiên vị người dùng)** - Triển khai cho **Trang Chủ** kết hợp cả **Explicit Rating**, **Implicit Clicks/Cart**, và **Chuẩn hóa điểm trung bình (Mean-Centering)**.
2. **Content-Based Filtering (Lọc dựa trên nội dung)** - Triển khai cho **Trang Chi Tiết Sản Phẩm** dựa trên thuộc tính sản phẩm.

---

## 1. Collaborative Filtering (Trang Chủ)

### 🎯 Mục đích
Gợi ý danh sách sản phẩm cá nhân hóa cho từng người dùng dựa trên hành vi và điểm đánh giá, đồng thời **chuẩn hóa thiên vị người dùng (User Bias Normalization)** để loại bỏ sự khác biệt giữa **người dễ tính (thường cho 4-5 sao)** và **người khó tính (thường cho 1-2 sao)**.

### 📐 Phương pháp: Phân rã ma trận Lai + Chuẩn hóa Trung bình (User-Mean Centered SVD)

#### Quy trình xử lý dữ liệu:
1. **Tổng hợp phản hồi Lai (Hybrid Feedback Scoring):**
   - Đọc bảng `interactions` từ cơ sở dữ liệu Supabase.
   - Gán trọng số tương tác:
     - **Click xem chi tiết (Implicit Click):** Trọng số = `1.0`.
     - **Thêm vào giỏ hàng (Implicit Add to Cart):** Trọng số = `5.0`.
     - **Đánh giá trực tiếp (Explicit Rating):** Chuẩn hóa độ lệch so với trung bình người dùng $\text{Rating Weight} = S_{u,i} - \mu_u$.
       - Nếu $S_{u,i} > \mu_u$: Điểm DƯƠNG (+) đại diện cho sự hài lòng.
       - Nếu $S_{u,i} < \mu_u$: Điểm ÂM (-) đại diện cho sự thất vọng / trừ điểm sản phẩm.
   - Tính tổng tất cả điểm tương tác của từng người dùng đối với từng sản phẩm.

2. **Xây dựng Ma trận Người dùng - Sản phẩm (User-Item Matrix $R$):**
   - Hàng (Rows): `user_id`
   - Cột (Columns): `product_id`
   - Giá trị (Values): Tổng điểm tương tác $\sum \text{weight}$ của từng user đối với từng sản phẩm.

3. **Chuẩn hóa Trung bình Người dùng (User Mean-Centering - Triệt tiêu Bias):**
   - Tính điểm đánh giá trung bình $\mu_u$ của từng người dùng $u$ trên các sản phẩm họ đã tương tác:
   
   $$\mu_u = \frac{1}{|I_u|} \sum_{i \in I_u} R_{u,i}$$
   
   - Trừ đi điểm trung bình $\mu_u$ để chuyển điểm tương tác về ma trận chuẩn hóa $R^{\text{norm}}$:
   
   $$R^{\text{norm}}_{u,i} = R_{u,i} - \mu_u \quad (\text{với các item đã tương tác})$$
   
   > **Ý nghĩa:** Nhờ bước này, một đánh giá 4 sao của người khó tính (trung bình cho 2 sao) sẽ có độ ưu tiên cao hơn đánh giá 4 sao của người dễ tính (trung bình cho 4.5 sao)!

4. **Phân rã ma trận chuẩn hóa (TruncatedSVD):**
   - Sử dụng `TruncatedSVD` để trích xuất các thuộc tính ẩn (Latent Features) từ ma trận đã chuẩn hóa:
   
   $$R^{\text{norm}} \approx U \times \Sigma \times V^T$$

5. **Tái cấu trúc ma trận & Cộng lại điểm trung bình (Reconstruction & Bias Restoration):**
   - Tái cấu trúc ma trận dự đoán và cộng trả lại điểm trung bình $\mu_u$ của người dùng để trả về thang điểm thực tế:
   
   $$\hat{R}_{u,i} = \hat{R}^{\text{norm}}_{u,i} + \mu_u$$

6. **Xếp hạng & Gợi ý (Top-N Recommendation):**
   - Sắp xếp điểm dự báo từ cao xuống thấp và trả về danh sách **Top N** sản phẩm gợi ý phù hợp nhất.

---

## 2. Content-Based Filtering (Trang Chi Tiết Sản Phẩm)

### 🎯 Mục đích
Khi người dùng đang xem một sản phẩm cụ thể, hệ thống sẽ tự động tìm kiếm và gợi ý các sản phẩm tương tự dựa trên thông tin thuộc tính (danh mục và mô tả sản phẩm).

### 📐 Phương pháp: TF-IDF kết hợp Cosine Similarity

#### Quy trình xử lý dữ liệu:
1. **Hợp nhất đặc trưng văn bản (Feature Combination):**
   - Đọc bảng `products` từ Supabase.
   - Kết hợp danh mục (`category`) và mô tả (`description`) của từng sản phẩm thành một chuỗi văn bản tổng hợp `combined_features`:
   
   $$\text{combined\_features} = \text{category} + " " + \text{description}$$

2. **Vector hóa văn bản với TF-IDF (TfidfVectorizer):**
   - Biến đổi văn bản thành các vector số thực dựa trên trọng số **TF-IDF** (Term Frequency - Inverse Document Frequency).

3. **Tính độ tương đồng Cosine (Cosine Similarity):**
   - Tính góc giữa vector của sản phẩm đang xem ($A$) với tất cả các sản phẩm khác ($B$) trong không gian vector:
   
   $$\text{Cosine Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$

4. **Trích xuất & Sắp xếp (Sorting & Top-N):**
   - Sắp xếp danh sách sản phẩm theo điểm độ tương đồng giảm dần và lấy **Top N** sản phẩm tương đồng nhất.

---

## 🛠 Thư viện & Mã nguồn liên quan

- **Thư viện chính:** `scikit-learn`, `pandas`, `numpy`, `supabase-py`.
- **Mã nguồn:**
  - Lọc cộng tác lai + Chuẩn hóa Mean-Centering: [`backend/recsys/collaborative.py`](file:///c:/Users/ADMIN/OneDrive/M%C3%A1y%20t%C3%ADnh/recsAmazon/backend/recsys/collaborative.py)
  - Lọc nội dung: [`backend/recsys/content_based.py`](file:///c:/Users/ADMIN/OneDrive/M%C3%A1y%20t%C3%ADnh/recsAmazon/backend/recsys/content_based.py)
  - API Gateway: [`backend/main.py`](file:///c:/Users/ADMIN/OneDrive/M%C3%A1y%20t%C3%ADnh/recsAmazon/backend/main.py)
  - Giao diện đánh giá sao & gợi ý: [`amazon-recs-tester/src/components/ProductDetailModal.tsx`](file:///c:/Users/ADMIN/OneDrive/M%C3%A1y%20t%C3%ADnh/recsAmazon/amazon-recs-tester/src/components/ProductDetailModal.tsx)
