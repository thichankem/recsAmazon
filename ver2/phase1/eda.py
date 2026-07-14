import os
import json
import pandas as pd
import numpy as np

def run_eda(reviews_path, meta_path, output_dir):
    print("Starting EDA...")
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Load Reviews dataset
    print(f"Loading reviews from {reviews_path}...")
    # Read reviews with optimized types
    reviews_dtypes = {
        'rating': 'float32',
        'asin': 'category',
        'parent_asin': 'category',
        'user_id': 'category',
        'verified_purchase': 'bool',
        'helpful_vote': 'int32'
    }
    
    # Use chunksize or load directly, 222MB is safe to load directly if optimized
    reviews_df = pd.read_csv(reviews_path, dtype=reviews_dtypes, usecols=[
        'rating', 'title', 'text', 'asin', 'parent_asin', 'user_id', 'timestamp', 'helpful_vote', 'verified_purchase'
    ])
    
    print(f"Reviews shape: {reviews_df.shape}")
    
    # 2. Load Metadata dataset
    print(f"Loading metadata from {meta_path}...")
    meta_dtypes = {
        'parent_asin': 'category',
        'main_category': 'category',
        'average_rating': 'float32',
        'rating_number': 'int32',
        'price': 'float32',
        'store': 'category'
    }
    meta_df = pd.read_csv(meta_path, dtype=meta_dtypes, usecols=[
        'parent_asin', 'main_category', 'title', 'average_rating', 'rating_number', 'price', 'store', 'categories'
    ])
    print(f"Metadata shape: {meta_df.shape}")
    
    # 3. Basic statistics
    num_reviews = len(reviews_df)
    num_users = reviews_df['user_id'].nunique()
    num_parent_items_reviews = reviews_df['parent_asin'].nunique()
    num_asin_items_reviews = reviews_df['asin'].nunique()
    num_items_meta = meta_df['parent_asin'].nunique()
    
    print(f"Number of reviews: {num_reviews}")
    print(f"Number of unique users: {num_users}")
    print(f"Number of unique parent items in reviews: {num_parent_items_reviews}")
    print(f"Number of unique items in metadata: {num_items_meta}")
    
    # Sparsity
    sparsity = 1.0 - (num_reviews / (num_users * num_parent_items_reviews))
    
    # Rating distribution
    rating_counts = reviews_df['rating'].value_counts().sort_index().to_dict()
    rating_percentages = (reviews_df['rating'].value_counts(normalize=True).sort_index() * 100).to_dict()
    mean_rating = float(reviews_df['rating'].mean())
    median_rating = float(reviews_df['rating'].median())
    
    # Verified purchase distribution
    verified_counts = reviews_df['verified_purchase'].value_counts().to_dict()
    verified_pct = (reviews_df['verified_purchase'].value_counts(normalize=True) * 100).to_dict()
    
    # Missing values
    reviews_missing = reviews_df.isnull().sum().to_dict()
    meta_missing = meta_df.isnull().sum().to_dict()
    
    # Duplicates (user_id, parent_asin)
    user_item_dups = reviews_df.duplicated(subset=['user_id', 'parent_asin']).sum()
    
    # Category distribution from metadata
    category_counts = meta_df['main_category'].value_counts().head(20).to_dict()
    
    # 4. Cold-start & Long-tail analysis
    user_review_counts = reviews_df['user_id'].value_counts()
    item_review_counts = reviews_df['parent_asin'].value_counts()
    
    # Definitions:
    # Cold-start user: <= 2 reviews
    # Cold-start item: <= 2 reviews
    # We will compute threshold metrics
    cold_start_users_count = int((user_review_counts <= 2).sum())
    cold_start_users_pct = float(cold_start_users_count / num_users * 100)
    
    cold_start_items_count = int((item_review_counts <= 2).sum())
    cold_start_items_pct = float(cold_start_items_count / num_parent_items_reviews * 100)
    
    # Long-tail analysis (80/20 rule)
    # Sort items by review count descending and check cumulative distribution
    sorted_item_counts = item_review_counts.sort_values(ascending=False)
    cum_reviews = sorted_item_counts.cumsum()
    target_80_pct = num_reviews * 0.8
    num_items_for_80_pct = int((cum_reviews <= target_80_pct).sum()) + 1
    items_for_80_pct_pct = float(num_items_for_80_pct / num_parent_items_reviews * 100)
    
    # 5. Save results to JSON
    stats = {
        "num_reviews": int(num_reviews),
        "num_users": int(num_users),
        "num_parent_items_reviews": int(num_parent_items_reviews),
        "num_asin_items_reviews": int(num_asin_items_reviews),
        "num_items_meta": int(num_items_meta),
        "sparsity": float(sparsity),
        "mean_rating": mean_rating,
        "median_rating": median_rating,
        "rating_counts": {str(k): int(v) for k, v in rating_counts.items()},
        "rating_percentages": {str(k): float(v) for k, v in rating_percentages.items()},
        "verified_counts": {str(k): int(v) for k, v in verified_counts.items()},
        "verified_percentages": {str(k): float(v) for k, v in verified_pct.items()},
        "reviews_missing": {k: int(v) for k, v in reviews_missing.items()},
        "meta_missing": {k: int(v) for k, v in meta_missing.items()},
        "user_item_duplicates": int(user_item_dups),
        "category_counts": {str(k): int(v) for k, v in category_counts.items()},
        "cold_start_users": {
            "threshold": 2,
            "count": cold_start_users_count,
            "percentage": cold_start_users_pct
        },
        "cold_start_items": {
            "threshold": 2,
            "count": cold_start_items_count,
            "percentage": cold_start_items_pct
        },
        "long_tail": {
            "num_items_for_80_percent_reviews": num_items_for_80_pct,
            "percentage_items_for_80_percent_reviews": items_for_80_pct_pct
        }
    }
    
    with open(os.path.join(output_dir, "eda_stats.json"), "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=4, ensure_ascii=False)
        
    # 6. Generate Markdown Report
    report_path = os.path.join(output_dir, "eda_report.md")
    print(f"Writing EDA report to {report_path}...")
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# BÁO CÁO PHÂN TÍCH KHÁM PHÁ DỮ LIỆU (EDA) - ALL BEAUTY\n\n")
        f.write("## 1. Thông số cơ bản\n\n")
        f.write(f"- **Tổng số lượt đánh giá (Reviews):** {stats['num_reviews']:,}\n")
        f.write(f"- **Tổng số người dùng (Users):** {stats['num_users']:,}\n")
        f.write(f"- **Tổng số sản phẩm có đánh giá (Unique Parent ASINs):** {stats['num_parent_items_reviews']:,}\n")
        f.write(f"- **Tổng số sản phẩm trong metadata:** {stats['num_items_meta']:,}\n")
        f.write(f"- **Độ thưa của ma trận (Sparsity User-Item):** {stats['sparsity']*100:.6f}%\n")
        f.write(f"- **Điểm đánh giá trung bình (Mean Rating):** {stats['mean_rating']:.2f}\n")
        f.write(f"- **Trung vị đánh giá (Median Rating):** {stats['median_rating']:.1f}\n")
        f.write(f"- **Số lượt đánh giá trùng lặp (cùng User, cùng Item):** {stats['user_item_duplicates']:,}\n\n")
        
        f.write("## 2. Phân bố Điểm đánh giá (Ratings)\n\n")
        f.write("| Rating | Số lượng | Tỷ lệ (%) |\n")
        f.write("|--------|----------|-----------|\n")
        for rating in sorted(stats['rating_counts'].keys(), key=float):
            cnt = stats['rating_counts'][rating]
            pct = stats['rating_percentages'][rating]
            f.write(f"| {rating} | {cnt:,} | {pct:.2f}% |\n")
        f.write("\n")
        
        f.write("## 3. Xác minh mua hàng (Verified Purchases)\n\n")
        f.write("| Loại | Số lượng | Tỷ lệ (%) |\n")
        f.write("|------|----------|-----------|\n")
        for k, v in stats['verified_counts'].items():
            pct = stats['verified_percentages'][k]
            name = "Đã xác minh (Verified)" if k == "True" else "Chưa xác minh (Unverified)"
            f.write(f"| {name} | {v:,} | {pct:.2f}% |\n")
        f.write("\n")
        
        f.write("## 4. Dữ liệu bị khuyết (Missing Values)\n\n")
        f.write("### Tập Reviews\n")
        f.write("| Trường | Số lượng khuyết | Tỷ lệ (%) |\n")
        f.write("|--------|-----------------|-----------|\n")
        for k, v in stats['reviews_missing'].items():
            pct = (v / stats['num_reviews']) * 100
            f.write(f"| {k} | {v:,} | {pct:.2f}% |\n")
        f.write("\n")
        
        f.write("### Tập Metadata\n")
        f.write("| Trường | Số lượng khuyết | Tỷ lệ (%) |\n")
        f.write("|--------|-----------------|-----------|\n")
        for k, v in stats['meta_missing'].items():
            pct = (v / stats['num_items_meta']) * 100
            f.write(f"| {k} | {v:,} | {pct:.2f}% |\n")
        f.write("\n")
        
        f.write("## 5. Phân tích Cold-Start & Long-Tail\n\n")
        f.write("### Hiện tượng Cold-Start\n")
        f.write(f"- **Cold-start Users (có <= {stats['cold_start_users']['threshold']} đánh giá):** {stats['cold_start_users']['count']:,} người dùng ({stats['cold_start_users']['percentage']:.2f}% tổng số users)\n")
        f.write(f"- **Cold-start Items (có <= {stats['cold_start_items']['threshold']} đánh giá):** {stats['cold_start_items']['count']:,} sản phẩm ({stats['cold_start_items']['percentage']:.2f}% tổng số items)\n\n")
        
        f.write("### Phân bố đuôi dài (Long-Tail Distribution)\n")
        f.write(f"- Chỉ có **{stats['long_tail']['num_items_for_80_percent_reviews']:,} sản phẩm** ({stats['long_tail']['percentage_items_for_80_percent_reviews']:.2f}% tổng số items) chiếm tới **80%** lượng đánh giá trong hệ thống.\n")
        f.write("- Điều này chứng tỏ tính chất long-tail rất rõ rệt của tập dữ liệu All Beauty.\n\n")
        
        f.write("## 6. Phân bố Category phổ biến (Top 20)\n\n")
        f.write("| Category | Số lượng sản phẩm |\n")
        f.write("|----------|-------------------|\n")
        for k, v in stats['category_counts'].items():
            f.write(f"| {k} | {v:,} |\n")
        f.write("\n")
        
    print("EDA finished successfully.")

if __name__ == "__main__":
    import time
    start = time.time()
    run_eda(
        reviews_path="All_Beauty.csv",
        meta_path="meta_All_Beauty.csv",
        output_dir="src/phase1"
    )
    print(f"Total time elapsed: {time.time() - start:.2f} seconds")
