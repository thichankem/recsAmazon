# BÁO CÁO PHÂN TÍCH KHÁM PHÁ DỮ LIỆU (EDA) - ALL BEAUTY

## 1. Thông số cơ bản

- **Tổng số lượt đánh giá (Reviews):** 701,528
- **Tổng số người dùng (Users):** 631,986
- **Tổng số sản phẩm có đánh giá (Unique Parent ASINs):** 112,565
- **Tổng số sản phẩm trong metadata:** 112,590
- **Độ thưa của ma trận (Sparsity User-Item):** 99.999014%
- **Điểm đánh giá trung bình (Mean Rating):** 3.96
- **Trung vị đánh giá (Median Rating):** 5.0
- **Số lượt đánh giá trùng lặp (cùng User, cùng Item):** 7,599

## 2. Phân bố Điểm đánh giá (Ratings)

| Rating | Số lượng | Tỷ lệ (%) |
|--------|----------|-----------|
| 1.0 | 102,080 | 14.55% |
| 2.0 | 43,034 | 6.13% |
| 3.0 | 56,307 | 8.03% |
| 4.0 | 79,381 | 11.32% |
| 5.0 | 420,726 | 59.97% |

## 3. Xác minh mua hàng (Verified Purchases)

| Loại | Số lượng | Tỷ lệ (%) |
|------|----------|-----------|
| Đã xác minh (Verified) | 634,969 | 90.51% |
| Chưa xác minh (Unverified) | 66,559 | 9.49% |

## 4. Dữ liệu bị khuyết (Missing Values)

### Tập Reviews
| Trường | Số lượng khuyết | Tỷ lệ (%) |
|--------|-----------------|-----------|
| rating | 0 | 0.00% |
| title | 160 | 0.02% |
| text | 212 | 0.03% |
| asin | 0 | 0.00% |
| parent_asin | 0 | 0.00% |
| user_id | 0 | 0.00% |
| timestamp | 0 | 0.00% |
| helpful_vote | 0 | 0.00% |
| verified_purchase | 0 | 0.00% |

### Tập Metadata
| Trường | Số lượng khuyết | Tỷ lệ (%) |
|--------|-----------------|-----------|
| main_category | 0 | 0.00% |
| title | 12 | 0.01% |
| average_rating | 0 | 0.00% |
| rating_number | 0 | 0.00% |
| price | 94,886 | 84.28% |
| store | 11,344 | 10.08% |
| categories | 0 | 0.00% |
| parent_asin | 0 | 0.00% |

## 5. Phân tích Cold-Start & Long-Tail

### Hiện tượng Cold-Start
- **Cold-start Users (có <= 2 đánh giá):** 622,827 người dùng (98.55% tổng số users)
- **Cold-start Items (có <= 2 đánh giá):** 67,440 sản phẩm (59.91% tổng số items)

### Phân bố đuôi dài (Long-Tail Distribution)
- Chỉ có **29,162 sản phẩm** (25.91% tổng số items) chiếm tới **80%** lượng đánh giá trong hệ thống.
- Điều này chứng tỏ tính chất long-tail rất rõ rệt của tập dữ liệu All Beauty.

## 6. Phân bố Category phổ biến (Top 20)

| Category | Số lượng sản phẩm |
|----------|-------------------|
| All Beauty | 112,135 |
| Premium Beauty | 455 |

