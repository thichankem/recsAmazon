import json
from collections import defaultdict
from pathlib import Path
import time

def preprocess_dataset(
    reviews_path: Path,
    meta_path: Path,
    processed_dir: Path,
    gt_dir: Path,
    min_reviews_per_user: int = 5,
    max_users: int = 2000
):
    print("Starting preprocessing of Amazon Cell Phones and Accessories dataset...")
    start_time = time.time()

    # Step 1: Pass 1 over reviews to count user reviews and store user-to-item interactions
    print("Pass 1: Counting user review frequencies...")
    user_counts = defaultdict(int)
    
    # We can also keep track of total lines to show progress
    line_count = 0
    with open(reviews_path, "r", encoding="utf-8") as f:
        for line in f:
            line_count += 1
            if line_count % 2000000 == 0:
                print(f"  Processed {line_count} lines...")
            try:
                # To make it super fast, we can use simple string slicing if possible, 
                # but json.loads is robust. Let's do json.loads.
                obj = json.loads(line)
                user_id = obj.get("user_id")
                if user_id:
                    user_counts[user_id] += 1
            except Exception:
                continue

    print(f"Total reviews read: {line_count}")
    print(f"Total unique users found: {len(user_counts)}")

    # Filter active users
    active_users = {user_id: count for user_id, count in user_counts.items() if count >= min_reviews_per_user}
    print(f"Users with >= {min_reviews_per_user} reviews: {len(active_users)}")

    # Sort by activity and limit to max_users to keep dataset dense and fast
    sorted_active_users = sorted(active_users.items(), key=lambda x: x[1], reverse=True)[:max_users]
    target_users = set([u[0] for u in sorted_active_users])
    print(f"Selected top {len(target_users)} most active users for dense dataset.")

    # Step 2: Pass 2 to collect reviews for selected users
    print("Pass 2: Collecting reviews for selected users...")
    user_interactions = defaultdict(list)
    line_count = 0
    with open(reviews_path, "r", encoding="utf-8") as f:
        for line in f:
            line_count += 1
            try:
                obj = json.loads(line)
                user_id = obj.get("user_id")
                if user_id in target_users:
                    item_id = obj.get("parent_asin") or obj.get("asin")
                    rating = obj.get("rating")
                    timestamp = obj.get("timestamp", 0)
                    if user_id and item_id:
                        user_interactions[user_id].append({
                            "user_id": user_id,
                            "item_id": item_id,
                            "rating": rating,
                            "timestamp": timestamp
                        })
            except Exception:
                continue

    # Step 3: Split each user's interactions chronologically (80% train, 20% test)
    print("Splitting interactions into train and test/ground_truth sets...")
    train_interactions = []
    ground_truth = {}
    target_items = set()

    for user_id, interactions in user_interactions.items():
        # Sort by timestamp
        interactions.sort(key=lambda x: x["timestamp"])
        
        split_idx = int(len(interactions) * 0.8)
        # Ensure at least 1 item in test if they have multiple reviews
        if split_idx == len(interactions) and len(interactions) > 1:
            split_idx -= 1
        if split_idx == 0:
            split_idx = 1
            
        train_list = interactions[:split_idx]
        test_list = interactions[split_idx:]
        
        train_interactions.extend(train_list)
        ground_truth[user_id] = [item["item_id"] for item in test_list]
        
        # Keep track of items we need metadata for
        for item in train_list + test_list:
            target_items.add(item["item_id"])

    print(f"Train interactions: {len(train_interactions)}")
    print(f"Test users in ground truth: {len(ground_truth)}")
    print(f"Unique items in dataset: {len(target_items)}")

    # Step 4: Pass 3 to collect metadata for target items
    print("Pass 3: Collecting metadata from item metadata file...")
    item_metadata = []
    meta_line_count = 0
    meta_found_count = 0
    
    with open(meta_path, "r", encoding="utf-8") as f:
        for line in f:
            meta_line_count += 1
            if meta_line_count % 1000000 == 0:
                print(f"  Processed {meta_line_count} meta lines...")
            try:
                obj = json.loads(line)
                parent_asin = obj.get("parent_asin")
                if parent_asin in target_items:
                    title = obj.get("title", "")
                    categories = obj.get("categories", [])
                    brand = obj.get("brand", "")
                    item_metadata.append({
                        "item_id": parent_asin,
                        "title": title,
                        "categories": categories,
                        "brand": brand
                    })
                    meta_found_count += 1
            except Exception:
                continue

    print(f"Metadata read: {meta_line_count} lines. Found metadata for {meta_found_count} / {len(target_items)} items.")

    # Save outputs
    processed_dir.mkdir(parents=True, exist_ok=True)
    gt_dir.mkdir(parents=True, exist_ok=True)

    train_data = {
        "interactions": train_interactions,
        "items": item_metadata
    }

    train_data_path = processed_dir / "train_data.json"
    print(f"Saving train data to {train_data_path}...")
    with open(train_data_path, "w", encoding="utf-8") as f:
        json.dump(train_data, f, ensure_ascii=False, indent=2)

    gt_path = gt_dir / "ground_truth.json"
    print(f"Saving ground truth to {gt_path}...")
    with open(gt_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, ensure_ascii=False, indent=2)

    duration = time.time() - start_time
    print(f"Preprocessing completed successfully in {duration:.2f} seconds!")

if __name__ == "__main__":
    project_root = Path(__file__).resolve().parent
    reviews_file = project_root / "datasets/raw/Cell_Phones_and_Accessories.jsonl"
    meta_file = project_root / "datasets/raw/meta_Cell_Phones_and_Accessories.jsonl"
    proc_dir = project_root / "datasets/processed"
    g_truth_dir = project_root / "datasets/ground_truth"

    preprocess_dataset(
        reviews_path=reviews_file,
        meta_path=meta_file,
        processed_dir=proc_dir,
        gt_dir=g_truth_dir,
        min_reviews_per_user=5,
        max_users=2000
    )
