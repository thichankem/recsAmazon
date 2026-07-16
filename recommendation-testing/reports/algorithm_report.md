# Báo Cáo Thiết Kế Thuật Toán Hệ Gợi Ý (Algorithm Design Report)

Báo cáo này trình bày chi tiết về mặt toán học, cách tư duy lập trình và giải thuật chi tiết của ba mô hình gợi ý được triển khai trong dự án: Collaborative Filtering (Lọc cộng tác), Content-Based (Gợi ý theo nội dung), và mô hình kết hợp Hybrid.

---

## 1. Collaborative Filtering (Lọc cộng tác Item-to-Item)

### Tư duy thuật toán:
Lọc cộng tác dựa trên giả định rằng những người dùng có chung sở thích trong quá khứ sẽ tiếp tục thích những sản phẩm tương tự nhau trong tương lai. Ở đây, chúng ta sử dụng phương tiếp cận **Item-to-Item Collaborative Filtering** (lọc cộng tác dựa trên độ tương đồng giữa các sản phẩm). 
Thay vì so sánh độ tương đồng giữa các user (rất tốn dung lượng lưu trữ khi số lượng user tăng lên hàng triệu), chúng ta đo lường mức độ tương đồng giữa hai sản phẩm dựa trên việc chúng có hay được mua chung bởi cùng nhóm người dùng hay không.

### Công thức toán học (Jaccard Similarity Index):
Để tính độ tương đồng giữa sản phẩm $i$ và sản phẩm $j$, ta dùng chỉ số Jaccard:
$$J(i, j) = \frac{|U_i \cap U_j|}{|U_i \cup U_j|}$$

Trong đó:
- $U_i$: Tập hợp các User ID đã đánh giá/tương tác với sản phẩm $i$.
- $U_j$: Tập hợp các User ID đã đánh giá/tương tác với sản phẩm $j$.
- $|U_i \cap U_j|$: Số lượng người dùng tương tác với cả hai sản phẩm.
- $|U_i \cup U_j|$: Tổng số lượng người dùng duy nhất đã tương tác với ít nhất một trong hai sản phẩm.

### Quy trình tính gợi ý cho User $u$:
1. Truy xuất lịch sử các sản phẩm người dùng $u$ đã từng tương tác trong quá khứ ($I_u$).
2. Với mỗi sản phẩm đã mua $i \in I_u$:
   - Duyệt qua tất cả các sản phẩm khác $j$ trong hệ thống ($j \notin I_u$).
   - Tính toán độ tương đồng Jaccard $J(i, j)$.
   - Cộng dồn điểm tương đồng vào điểm số của sản phẩm $j$: $Score(j) = \sum_{i \in I_u} J(i, j)$.
3. Sắp xếp danh sách sản phẩm $j$ theo điểm số $Score(j)$ giảm dần và lấy ra top $K$ sản phẩm hàng đầu.
4. **Luồng xử lý ngoại lệ (Cold Start/Fallback)**: Nếu người dùng $u$ là người dùng mới hoàn toàn (không có trong lịch sử $I_u$), mô hình sẽ lấy danh sách các sản phẩm phổ biến nhất (có nhiều lượt tương tác nhất) trong tập huấn luyện làm kết quả gợi ý.

---

## 2. Content-Based Recommender (Gợi ý theo nội dung)

### Tư duy thuật toán:
Thuật toán dựa trên nội dung tập trung vào các đặc trưng nội tại của sản phẩm (chẳng hạn như danh mục ngành hàng `categories`, thương hiệu `brand`, mô tả). Thuật toán này rất mạnh trong việc giải quyết kịch bản **Product Page (Trang chi tiết sản phẩm)** khi ta biết rõ người dùng đang xem một sản phẩm cụ thể và muốn tìm các sản phẩm tương tự.

### Cơ chế tính toán độ tương đồng đặc trưng:
Chúng ta sử dụng độ tương đồng Jaccard trên tập hợp các tag danh mục (`categories`) của sản phẩm hiện tại ($C_{context}$) và các sản phẩm khác trong kho lưu trữ ($C_j$):
$$Score(j) = \frac{|C_{context} \cap C_j|}{|C_{context} \cup C_j|}$$

### Quy trình tính gợi ý:
1. Nhận vào thông tin sản phẩm đang xem (`context_item_id`).
2. Nếu `context_item_id` tồn tại trong cơ sở dữ liệu sản phẩm của mô hình, truy xuất danh sách danh mục của nó.
3. So sánh danh mục của sản phẩm này với danh mục của tất cả các sản phẩm khác trong hệ thống để tính điểm tương đồng.
4. Sắp xếp và trả về top $K$ sản phẩm tương đồng nhất.
5. **Luồng xử lý ngoại lệ**: Nếu không truyền vào sản phẩm ngữ cảnh (như ở trang chủ) hoặc không có sản phẩm nào có chung danh mục, mô hình sẽ trả về các sản phẩm phổ biến nhất để đảm bảo không trả về danh sách rỗng.

---

## 3. Hybrid Recommender (Mô hình lai kết hợp)

### Tư duy thuật toán:
Mỗi mô hình đơn lẻ đều có nhược điểm: Lọc cộng tác gặp khó khăn với sản phẩm mới (Cold Start sản phẩm), còn Content-Based lại dễ đưa ra gợi ý quá đơn điệu (chỉ xoay quanh một danh mục).
Mô hình **Hybrid Recommender** kết hợp ưu điểm của cả hai bằng cách kết hợp điểm số (Weighted Hybridization).

### Công thức kết hợp:
Với mỗi ứng viên sản phẩm $j$, điểm số lai ghép cuối cùng được tính như sau:
$$Score_{Hybrid}(j) = w_{CB} \cdot Score_{CB}(j) + w_{CF} \cdot Score_{CF}(j)$$

Trong đó:
- $Score_{CB}(j)$: Điểm gợi ý từ mô hình Content-Based.
- $Score_{CF}(j)$: Điểm gợi ý từ mô hình Collaborative Filtering.
- $w_{CB}$ và $w_{CF}$: Trọng số của từng mô hình (được định cấu hình trong `config.yaml`, mặc định là $0.5$ mỗi bên).

### Quy trình tính gợi ý:
1. Gọi mô hình Content-Based để lấy top $2K$ sản phẩm gợi ý kèm điểm số.
2. Gọi mô hình Collaborative Filtering để lấy top $2K$ sản phẩm gợi ý kèm điểm số.
3. Thực hiện gộp danh sách sản phẩm và tính toán điểm số lai ghép dựa trên công thức trọng số.
4. Sắp xếp danh sách gộp theo điểm lai giảm dần và trả về top $K$ kết quả cuối cùng.
