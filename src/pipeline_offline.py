import os
import json
import sqlite3
import math
import time
from collections import defaultdict, Counter
import numpy as np
import pandas as pd
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import svds

def load_schema(db_path, schema_path):
    """Loads the database schema into the SQLite database."""
    print(f"Initializing database at: {db_path}")
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
        
    conn = sqlite3.connect(db_path)
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()
    print("Database schema loaded successfully.")

def parse_metadata(metadata_path):
    """Parses raw_metadata.json in chunks and returns a dictionary of item metadata."""
    print("Parsing product metadata...")
    item_metadata = {}
    start_time = time.time()
    
    with open(metadata_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                item = json.loads(line)
                asin = item.get("parent_asin")
                if asin:
                    main_cat = item.get("main_category")
                    title = item.get("title")
                    if not main_cat or main_cat == "null":
                        main_cat = "Other"
                    item_metadata[asin] = {
                        "category": main_cat,
                        "title": title or "Unknown Product"
                    }
            except Exception:
                continue
                
    print(f"Parsed metadata for {len(item_metadata)} items in {time.time() - start_time:.2f} seconds.")
    return item_metadata

def analyze_reviews_first_pass(reviews_path):
    """Finds the maximum timestamp in the reviews dataset."""
    print("Analyzing reviews (First Pass)...")
    max_timestamp = 0
    start_time = time.time()
    
    with open(reviews_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                data = json.loads(line)
                ts = data.get("timestamp")
                if ts and ts > max_timestamp:
                    max_timestamp = ts
            except Exception:
                continue
                
    print(f"Max timestamp found: {max_timestamp} ({time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(max_timestamp/1000.0))})")
    print(f"First pass completed in {time.time() - start_time:.2f} seconds.")
    return max_timestamp

def process_reviews_and_scores(reviews_path, max_timestamp, item_metadata):
    """Processes reviews to compute interaction scores and rating aggregations."""
    print("Processing reviews and computing interaction scores...")
    interactions = []
    item_ratings = {}
    decay_lambda = 4.456e-8
    start_time = time.time()
    
    with open(reviews_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                data = json.loads(line)
                user_id = data.get("user_id")
                asin = data.get("parent_asin")
                rating = data.get("rating")
                ts = data.get("timestamp")
                
                if not user_id or not asin or rating is None or ts is None:
                    continue
                
                if asin not in item_ratings:
                    item_ratings[asin] = []
                item_ratings[asin].append(rating)
                
                verified = 1.0 if data.get("verified_purchase") is True else 0.0
                helpful = float(data.get("helpful_vote", 0))
                
                delta_t_sec = max(0.0, (max_timestamp - ts) / 1000.0)
                decay = math.exp(-decay_lambda * delta_t_sec)
                
                score = rating * (1.0 + 0.2 * verified + 0.1 * math.log1p(helpful)) * decay
                interactions.append((user_id, asin, score))
            except Exception:
                continue
                
    print(f"Processed {len(interactions)} reviews in {time.time() - start_time:.2f} seconds.")
    
    print("Aggregating user-item interactions...")
    agg_start = time.time()
    df_inter = pd.DataFrame(interactions, columns=["user_id", "parent_asin", "score"])
    df_inter = df_inter.groupby(["user_id", "parent_asin"], as_index=False)["score"].max()
    
    aggregated_interactions = list(df_inter.itertuples(index=False, name=None))
    print(f"Aggregated interactions count: {len(aggregated_interactions)} (reduced from {len(interactions)}) in {time.time() - agg_start:.2f} seconds.")
    
    return aggregated_interactions, item_ratings

def compute_popular_items(item_ratings, item_metadata, db_path):
    """Computes Bayesian average ratings and outputs global and category top rated lists."""
    print("Computing Bayesian Average ratings for products...")
    all_ratings = []
    item_stats = {}
    for asin, ratings in item_ratings.items():
        all_ratings.extend(ratings)
        item_stats[asin] = {
            "mean": np.mean(ratings),
            "count": len(ratings)
        }
        
    global_mean = np.mean(all_ratings) if all_ratings else 4.0
    m = 5
    
    item_popularity = []
    for asin, stats in item_stats.items():
        item_popularity.append((asin, stats["count"], stats["mean"]))
        
    # Sort by interaction frequency descending, then by mean rating descending
    item_popularity.sort(key=lambda x: (x[1], x[2]), reverse=True)
    global_top_20 = [item[0] for item in item_popularity[:20]]
    
    category_items = {}
    for asin, count, mean in item_popularity:
        meta = item_metadata.get(asin, {"category": "Other", "title": "Unknown"})
        cat = meta["category"]
        if cat not in category_items:
            category_items[cat] = []
        category_items[cat].append((asin, count, mean))
        
    category_top_20 = {}
    for cat, items in category_items.items():
        items.sort(key=lambda x: (x[1], x[2]), reverse=True)
        category_top_20[cat] = [item[0] for item in items[:20]]
        
    print("Saving global and category top rated lists to DB...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("INSERT OR REPLACE INTO global_top_rated (id, top_items) VALUES (?, ?)", 
                   (1, json.dumps(global_top_20)))
    
    cursor.executemany("INSERT OR REPLACE INTO category_top_rated (category, top_items) VALUES (?, ?)",
                       [(cat, json.dumps(items)) for cat, items in category_top_20.items()])
    
    conn.commit()
    conn.close()
    print(f"Saved {len(category_top_20)} categories to database.")

def train_collaborative_filtering(interactions, item_metadata, db_path):
    """Computes Jaccard item similarities and user history, saving them to SQLite."""
    print("Preparing co-occurrence graph for Jaccard similarities...")
    start_time = time.time()
    
    user_train_items = defaultdict(set)
    item_users = defaultdict(set)
    
    for u, item, score in interactions:
        user_train_items[u].add(item)
        item_users[item].add(u)
        
    print(f"Total unique users: {len(user_train_items)}, unique items: {len(item_users)}")
    
    print("Computing Jaccard item similarities...")
    t0 = time.time()
    item_sims = defaultdict(dict)
    
    for item, users in item_users.items():
        if len(users) < 1:
            continue
        co_items = Counter()
        for u in users:
            for other in user_train_items[u]:
                if other != item:
                    co_items[other] += 1
        
        len_item_users = len(users)
        for other, intersection_sz in co_items.items():
            union_sz = len_item_users + len(item_users[other]) - intersection_sz
            if union_sz > 0:
                score = intersection_sz / union_sz
                if score > 0.0:
                    item_sims[item][other] = score
                    
    item_sims_cleaned = {}
    for item, sims in item_sims.items():
        sorted_sims = sorted(sims.items(), key=lambda x: x[1], reverse=True)[:20]
        if sorted_sims:
            item_sims_cleaned[item] = sorted_sims
            
    print(f"Computed Jaccard similarities for {len(item_sims_cleaned)} items in {time.time() - t0:.2f} seconds.")
    
    print("Saving user history, item similarities, and metadata to SQLite...")
    t0 = time.time()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM user_history")
    cursor.execute("DELETE FROM item_similarities")
    cursor.execute("DELETE FROM item_metadata")
    
    # Save user history
    user_hist_data = [(u, json.dumps(list(items))) for u, items in user_train_items.items()]
    cursor.executemany("INSERT OR REPLACE INTO user_history (user_id, items) VALUES (?, ?)", user_hist_data)
    
    # Save item similarities
    item_sim_data = [(item, json.dumps(sims)) for item, sims in item_sims_cleaned.items()]
    cursor.executemany("INSERT OR REPLACE INTO item_similarities (item_id, similar_items) VALUES (?, ?)", item_sim_data)
    
    # Save item metadata category mapping
    item_meta_data = [(item, meta.get("category", "Other")) for item, meta in item_metadata.items()]
    cursor.executemany("INSERT OR REPLACE INTO item_metadata (item_id, category) VALUES (?, ?)", item_meta_data)
    
    conn.commit()
    conn.close()
    print(f"Wrote to SQLite in {time.time() - t0:.2f} seconds.")
    print(f"Total offline pipeline training completed in {time.time() - start_time:.2f} seconds.")

def run_offline_pipeline(db_path, schema_path, reviews_path, metadata_path):
    """Runs the entire offline recommendation pipeline."""
    print("=================== STARTING OFFLINE PIPELINE ===================")
    pipeline_start = time.time()
    
    # 1. Initialize database schema
    load_schema(db_path, schema_path)
    
    # 2. Parse product metadata
    item_metadata = parse_metadata(metadata_path)
    
    # 3. Get maximum timestamp
    max_timestamp = analyze_reviews_first_pass(reviews_path)
    
    # 4. Compute interaction scores
    interactions, item_ratings = process_reviews_and_scores(reviews_path, max_timestamp, item_metadata)
    
    # 5. Compute global and category popular lists
    compute_popular_items(item_ratings, item_metadata, db_path)
    
    # 6. Train similarity and generate precomputed lists
    train_collaborative_filtering(interactions, item_metadata, db_path)
    
    print(f"=================== OFFLINE PIPELINE COMPLETE ({time.time() - pipeline_start:.2f}s) ===================")

if __name__ == "__main__":
    DB_PATH = "db/recommendations.db"
    SCHEMA_PATH = "db/schema.sql"
    REVIEWS_PATH = "data/raw_reviews.json"
    METADATA_PATH = "data/raw_metadata.json"
    
    if os.path.exists(REVIEWS_PATH) and os.path.exists(METADATA_PATH):
        run_offline_pipeline(DB_PATH, SCHEMA_PATH, REVIEWS_PATH, METADATA_PATH)
    else:
        print("Data files not found.")
