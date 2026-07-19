import os
import sys
import pickle
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD

sys.stdout.reconfigure(encoding='utf-8')

# Constants
MAX_ITEMS = 1_000_000
RATINGS_CSV = 'preprocessing/preprocessed_Cell_Phones_and_Accessories.csv'
META_CSV = 'preprocessing/preprocessed_data.csv'
STOP_WORDS = 'data/stop_words_english.json'

print(f"=== TRAINING ON TOP {MAX_ITEMS} ITEMS ===")

# 1. Content-Based Model
print("\n--- 1. Training Content-Based Model ---")
print("Reading metadata to fit TF-IDF...")

# Load custom stop words
try:
    stop_words_df = pd.read_json(STOP_WORDS, typ='series')
    custom_stop_words = stop_words_df.tolist()
except Exception:
    custom_stop_words = 'english'

tfidf = TfidfVectorizer(stop_words=custom_stop_words, max_features=10000)

def text_generator(file_path, chunk_size=100000):
    processed = 0
    for chunk in pd.read_csv(file_path, usecols=['parent_asin', 'content'], chunksize=chunk_size):
        chunk = chunk.drop_duplicates(subset=['parent_asin'])
        for val in chunk['content'].fillna(''):
            yield str(val)
            processed += 1
            if processed >= MAX_ITEMS:
                return

tfidf.fit(text_generator(META_CSV))
print(f"TF-IDF vocabulary size: {len(tfidf.vocabulary_)}")

print("Generating TF-IDF matrix...")
df_unique = pd.read_csv(META_CSV, usecols=['parent_asin', 'title', 'main_category', 'content']).drop_duplicates(subset=['parent_asin']).head(MAX_ITEMS)
df_unique['content'] = df_unique['content'].fillna('')

tfidf_matrix = tfidf.transform(df_unique['content'])

content_model_data = {
    'tfidf': tfidf,
    'tfidf_matrix': tfidf_matrix,
    'df_unique': df_unique
}
with open('model/content_based_model.pkl', 'wb') as f:
    pickle.dump(content_model_data, f, protocol=4)
print("Saved content_based_model.pkl!")

valid_items = set(df_unique['parent_asin'].tolist())

# 2. Collaborative Model
print("\n--- 2. Training Collaborative Model (SVD) ---")
print("Reading ratings...")
chunks = []
processed = 0
for chunk in pd.read_csv(RATINGS_CSV, usecols=['user_id', 'parent_asin', 'rating'], dtype={'rating': 'float32'}, chunksize=500_000):
    # Filter to only keep items that are in our MAX_ITEMS limit
    chunk = chunk[chunk['parent_asin'].isin(valid_items)]
    chunks.append(chunk)

df_ratings = pd.concat(chunks, ignore_index=True)
print(f"Total interactions after filtering: {len(df_ratings)}")

# Filter 2-core to reduce noise and size
user_cnt = df_ratings['user_id'].value_counts()
df_ratings = df_ratings[df_ratings['user_id'].isin(user_cnt[user_cnt >= 2].index)]
print(f"Interactions after 2-core user filter: {len(df_ratings)}")

all_users = df_ratings['user_id'].unique()
all_items = df_unique['parent_asin'].unique() # Maintain exact order from content model

user_to_idx = {u: i for i, u in enumerate(all_users)}
item_to_idx = {it: i for i, it in enumerate(all_items)}

n_users = len(all_users)
n_items = len(all_items)

user_col = df_ratings['user_id'].map(user_to_idx).to_numpy(dtype=np.int32)
item_col = df_ratings['parent_asin'].map(item_to_idx).to_numpy(dtype=np.int32)
rate_col = df_ratings['rating'].to_numpy(dtype=np.float32)

print(f"Building sparse matrix: {n_items} items x {n_users} users")
Y = csr_matrix((rate_col, (item_col, user_col)), shape=(n_items, n_users), dtype=np.float32)

print("Running TruncatedSVD (Latent Factor Model)...")
svd = TruncatedSVD(n_components=50, random_state=42)
item_features = svd.fit_transform(Y)

print("Saving collaborative_model.pkl...")
collab_model_data = {
    'user_to_idx': user_to_idx,
    'item_to_idx': item_to_idx,
    'item_titles': df_unique['title'].tolist(),
    'item_features': item_features.astype(np.float32),
    'cf_k': 10 # dummy value since we use SVD now
}
with open('model/collaborative_model.pkl', 'wb') as f:
    pickle.dump(collab_model_data, f, protocol=4)

print("\n✅ All models trained and saved successfully on 1M items!")
