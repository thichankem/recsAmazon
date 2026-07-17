import json
import random
import uuid
import datetime
import os

# Configuration
NUM_REVIEWS = 1_000_000
NUM_PRODUCTS = 100_000 # 10 reviews per product on average
NUM_USERS = 50_000 # 20 reviews per user on average

DATA_DIR = 'data'
os.makedirs(DATA_DIR, exist_ok=True)

REVIEWS_FILE = os.path.join(DATA_DIR, 'synthetic_reviews.jsonl')
META_FILE = os.path.join(DATA_DIR, 'synthetic_meta.jsonl')

CATEGORIES = [
    "Electronics", "Books", "Clothing", "Home & Kitchen",
    "Sports & Outdoors", "Toys & Games", "Beauty",
    "Automotive", "Health & Personal Care", "Grocery"
]

STORES = [f"Store_{i}" for i in range(1, 101)]

def generate_random_id(prefix=""):
    return prefix + "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=10))

print("Generating IDs...")
product_asins = [generate_random_id("B0") for _ in range(NUM_PRODUCTS)]
user_ids = [generate_random_id("U") for _ in range(NUM_USERS)]

print(f"Generating {NUM_PRODUCTS} metadata records to {META_FILE}...")
with open(META_FILE, 'w', encoding='utf-8') as meta_f:
    for i in range(NUM_PRODUCTS):
        asin = product_asins[i]
        main_cat = random.choice(CATEGORIES)
        meta_item = {
            "main_category": main_cat,
            "title": f"Synthetic Product {i} - {main_cat}",
            "average_rating": round(random.uniform(1.0, 5.0), 1),
            "rating_number": random.randint(1, 5000),
            "features": [f"Feature {j} of {asin}" for j in range(random.randint(0, 5))],
            "description": [f"This is a detailed description of {asin}."],
            "price": round(random.uniform(5.0, 500.0), 2),
            "images": [],
            "videos": [],
            "store": random.choice(STORES),
            "categories": [main_cat, f"{main_cat} Subcategory"],
            "details": {"Brand": f"Brand_{random.randint(1, 50)}"},
            "parent_asin": asin, # keeping it simple, parent_asin = asin
            "bought_together": random.sample(product_asins, k=min(3, len(product_asins)))
        }
        meta_f.write(json.dumps(meta_item) + "\n")
        if (i+1) % 10000 == 0:
            print(f"Generated {i+1} meta records.")

print(f"Generating {NUM_REVIEWS} review records to {REVIEWS_FILE}...")
start_date = datetime.datetime(2015, 1, 1)
end_date = datetime.datetime(2023, 1, 1)
delta = end_date - start_date

with open(REVIEWS_FILE, 'w', encoding='utf-8') as review_f:
    for i in range(NUM_REVIEWS):
        asin = random.choice(product_asins)
        user_id = random.choice(user_ids)
        random_days = random.randrange(delta.days)
        review_date = start_date + datetime.timedelta(days=random_days)
        
        review_item = {
            "rating": float(random.randint(1, 5)),
            "title": f"Review {i} title",
            "text": f"This is the text for review {i}. The product was okay.",
            "images": [],
            "asin": asin,
            "parent_asin": asin,
            "user_id": user_id,
            "timestamp": int(review_date.timestamp() * 1000),
            "verified_purchase": random.choice([True, False]),
            "helpful_vote": random.randint(0, 100)
        }
        review_f.write(json.dumps(review_item) + "\n")
        if (i+1) % 100000 == 0:
            print(f"Generated {i+1} review records.")

print("Data generation complete!")
