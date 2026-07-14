# Hệ Thống Gợi Ý Sản Phẩm Amazon 2026 - Personalized Recommendation Engine

Dự án này tập trung hiện thực hóa bài toán **Gợi ý Cá nhân hóa (Personalized Static Recommendation) - "Mua gì tiếp theo?"** dựa trên tập dữ liệu **Amazon Reviews 2023**. Hệ thống được thiết kế theo kiến trúc **Static Layered Serving** để đạt hiệu năng xử lý cực hạn trên Production (**CPU < 0.1%, RAM < 0.1% trên chip Ryzen 7 7840, Latency < 1ms**), đồng thời giải quyết triệt để bài toán **Cold Start** bằng chiến lược phòng thủ 3 lớp.



## 1. Cấu Trúc Thư Mục Dự Án (File Architecture)


amazon_recommender/
│
├── data/                              
│   ├── raw_reviews.json                # Dữ liệu tương tác và đánh giá từ user
│   └── raw_metadata.json               # Dữ liệu thông tin chi tiết sản phẩm
│
├── db/                                 # CƠ SỞ DỮ LIỆU CỐT LÕI
│   ├── schema.sql                      # Định nghĩa cơ sở dữ liệu tĩnh tối ưu
│   └── recommendations.db              # SQLite DB duy nhất (Chứa các bảng tĩnh precomputed)
│
├── src/                                # MÃ NGUỒN XỬ LÝ CHÍNH
│   ├── __init__.py
│   ├── pipeline_offline.py             # Luồng Batch ngoại tuyến: Xử lý chunk, train Jaccard similarity, xuất bảng tĩnh DB
│   └── service_online.py               # Luồng phục vụ trực tuyến: Tra cứu B+Tree tĩnh, xử lý Fallback & Padding
│
├── evaluation/                         # BỘ CÔNG CỤ ĐÁNH GIÁ CHẤT LƯỢNG (Offline)
│   ├── __init__.py
│   ├── metrics.py                      # Định nghĩa hàm toán học chỉ số chất lượng (Recall@K, NDCG@K)
│   └── benchmark.py                    # Script quét dữ liệu tương tác thực tế để chấm điểm mô hình tĩnh
│
├── tests/                              # KIỂM THỬ TỰ ĐỘNG (CI/CD Ready)
│   └── test_recommender.py             # Unit test kiểm tra tính đúng đắn luồng dữ liệu tĩnh và Latency (< 2ms)
│
├── run_service.py                      # API Endpoint trực tuyến (FastAPI Wrapper)
│   └── recommendations.db              # SQLite DB chứa dữ liệu đã huấn luyện
└── recommender_demo.ipynb              # Jupyter Notebook minh họa và đo hiệu năng


## 2. Dataset 


* User Reviews
rating (float): Rating of the product (from 1.0 to 5.0).
title (str): Title of the user review.
text (str): Text body of the user review.
images (list): Images that users post after they have received the product. Each image has different sizes (small, medium, large), represented by the small_image_url, medium_image_url, and large_image_url respectively.
asin (str): ID of the product.
parent_asin (str): Parent ID of the product. Note: Products with different colors, styles, sizes usually belong to the same parent ID. The “asin” in previous Amazon datasets is actually parent ID. Please use parent ID to find product meta.
user_id (str): ID of the reviewer.
timestamp (int): Time of the review (unix time).
verified_purchase (bool): User purchase verification.
helpful_vote (int): Helpful votes of the review.

* Item Metadata 
main_category (str): Main category (i.e., domain) of the product.
title (str): Name of the product.
average_rating (float): Rating of the product shown on the product page.
rating_number (int): Number of ratings in the product.
features (list): Bullet-point format features of the product.
description (list): Description of the product.
price (float): Price in US dollars (at time of crawling).
images (list): Images of the product. Each image has different sizes (thumb, large, hi_res). The “variant” field shows the position of image.
videos (list): Videos of the product including title and url.
store (str): Store name of the product.
categories (list): Hierarchical categories of the product.
details (dict): Product details, including materials, brand, sizes, etc.
parent_asin (str): Parent ID of the product.
bought_together (list): Recommended bundles from the websites.


## 3. Kiến Trúc Luồng Giải Quyết Bài Toán

### LUỒNG 1: BỘ NÃO NGOẠI TUYẾN (OFFLINE BATCH PIPELINE)

* **Về bước trích xuất dữ liệu**:
  File [pipeline_offline.py] thực hiện đọc dữ liệu thô từ thư mục `data/` theo dạng chunk-by-chunk để bảo vệ bộ nhớ RAM dưới 6GB của máy phát triển.
* **Về bước chuẩn hóa điểm tin cậy**:
  Hệ thống tính toán chỉ số điểm tương tác (Interaction Score) cho từng cặp quan hệ `(user_id, parent_asin)`. Công thức áp dụng các trọng số phạt và thưởng dựa trên hành vi thực tế bao gồm trạng thái xác thực mua hàng `verified_purchase`, độ hữu ích của bình luận `helpful_vote`, và hệ số suy giảm độ quan tâm theo thời gian `timestamp`.
* **Về bước huấn luyện Collaborative Filtering**:
  Hệ thống sử dụng thuật toán tính toán độ tương đồng **Jaccard Item-to-Item Similarity** giữa các sản phẩm dựa trên đồng xuất hiện (co-occurrence) trong lịch sử mua sắm của các người dùng. Phép tính này cực kỳ nhẹ, nhanh và giảm thiểu tác động của ma trận thưa so với SVD.
* **Về bước đóng gói cơ sở dữ liệu**:
  Hệ thống xuất trực tiếp toàn bộ kết quả đã tính toán sẵn vào các bảng tĩnh:
  - `user_history`: Lưu vết các sản phẩm từng tương tác của từng user.
  - `item_similarities`: Lưu danh sách các sản phẩm tương tự dựa trên Jaccard.
  - `item_metadata`: Lưu thông tin phân loại sản phẩm.
  - `category_top_rated`: Lưu danh sách sản phẩm nổi bật theo nhóm ngành hàng (xếp hạng dựa trên tần suất tương tác).
  - `global_top_rated`: Lưu danh sách sản phẩm nổi bật toàn sàn (xếp hạng dựa trên tần suất tương tác).
  Cấu trúc lưu trữ được tối ưu hóa bằng cơ chế Index B+Tree kết hợp thuộc tính định danh vật lý rút gọn `WITHOUT ROWID` trên SQLite.

---

### LUỒNG 2: PHỤC VỤ TRỰC TUYẾN & PHÂN TẦNG COLD START (ONLINE SERVING ENGINE)

Khi nhận được một yêu cầu lấy danh sách gợi ý cho một người dùng bất kỳ `user_id`, dịch vụ trực tuyến nằm trong file [service_online.py] thực thi quy trình tối ưu hóa tài nguyên thông qua chiến lược Phân tầng Khử Cold Start làm hạ tầng phòng thủ:

* **Tầng 1 (Áp dụng cho Người dùng cũ)**:
  Hệ thống tra cứu lịch sử mua sắm của user từ bảng `user_history`, sau đó truy vấn danh sách sản phẩm tương đồng từ bảng `item_similarities` để tổng hợp và chấm điểm. Nếu số lượng gợi ý thiếu, hệ thống tự động bổ sung thêm các sản phẩm nổi bật cùng danh mục mà user đã từng mua thông qua bảng `item_metadata` và `category_top_rated`. Toàn bộ quá trình truy vấn và tổng hợp chạy trực tiếp trên SQLite với độ trễ siêu nhỏ **< 0.5ms**.
* **Tầng 2 (Áp dụng cho Người dùng mới có ngữ cảnh danh mục)**:
  Nếu không tìm thấy lịch sử của `user_id` trong `user_history` (người dùng mới), hệ thống lập tức chuyển hướng sang quét danh mục sản phẩm họ đang xem tại phiên hiện tại thông qua bảng `category_top_rated`.
* **Tầng 3 (Áp dụng cho Người dùng mới tinh ở Trang chủ)**:
  Nếu không có bất kỳ thông tin hay ngữ cảnh nào, hệ thống thực hiện giải pháp phòng ngự cuối cùng là lấy danh sách các sản phẩm nổi bật có lượt tương tác cao nhất toàn sàn từ bảng `global_top_rated`.

---

### LUỒNG 3: THUẬT TOÁN BÙ ĐẮP GỢI Ý (PADDING LOGIC)

Để đảm bảo API luôn trả về chính xác **Top 10** sản phẩm độc nhất cho người dùng:
* **Kiểm tra độ dài**: Sau khi lấy kết quả từ quá trình phân tầng ở Luồng 2, nếu danh sách gợi ý có độ dài nhỏ hơn 10, hệ thống kích hoạt luồng bù đắp.
* **Bù đắp tự động**: Hệ thống truy vấn trực tiếp bảng `global_top_rated` để lấy danh sách sản phẩm phổ biến toàn sàn, lọc bỏ các sản phẩm đã trùng lặp trong danh sách hiện tại của user, sau đó điền vào các vị trí còn trống cho đến khi danh sách đạt chính xác 10 sản phẩm độc nhất.