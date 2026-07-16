import ast
import numpy as np
import pandas as pd
import pickle
from scipy import sparse
from sklearn.metrics.pairwise import cosine_similarity
import sys

sys.stdout.reconfigure(encoding='utf-8')

RATINGS_CSV = 'preprocessing/preprocessed_Cell_Phones_and_Accessories.csv'
META_CSV    = 'preprocessing/preprocessed_meta_preprocessedCell_Phones_and_Accessories.csv'
OUTPUT_PKL  = 'model/collaborative_model.pkl'

print("1. Đọc ratings theo chunk...")
chunks = []
for chunk in pd.read_csv(RATINGS_CSV,
                         usecols=['user_id', 'parent_asin', 'rating'],
                         dtype={'rating': 'int8'},
                         chunksize=500_000):
    chunks.append(chunk)
df = pd.concat(chunks, ignore_index=True)

print("2. Lọc 10-core...")
for i in range(3):
    user_cnt = df['user_id'].value_counts()
    item_cnt = df['parent_asin'].value_counts()
    df = df[
        df['user_id'].isin(user_cnt[user_cnt >= 10].index) &
        df['parent_asin'].isin(item_cnt[item_cnt >= 10].index)
    ]
df = df.drop_duplicates(subset=['user_id', 'parent_asin'], keep='last')

print("3. Tạo index và nạp metadata...")
all_users = df['user_id'].unique()
all_items = df['parent_asin'].unique()

user_to_idx = {u: i for i, u in enumerate(all_users)}
item_to_idx = {it: i for i, it in enumerate(all_items)}
idx_to_item = {i: it for it, i in item_to_idx.items()}

n_users = len(all_users)
n_items = len(all_items)

user_col = df['user_id'].map(user_to_idx).to_numpy(dtype=np.int32)
item_col = df['parent_asin'].map(item_to_idx).to_numpy(dtype=np.int32)
rate_col = df['rating'].to_numpy(dtype=np.float32)

df_meta = (pd.read_csv(META_CSV,
                       usecols=['parent_asin', 'title', 'categories'],
                       dtype=str)
           .drop_duplicates(subset=['parent_asin']))

title_map = dict(zip(df_meta['parent_asin'], df_meta['title'].fillna('')))
item_titles = [title_map.get(all_items[i], all_items[i]) for i in range(n_items)]

def parse_cats(s):
    try:
        v = ast.literal_eval(str(s))
        return [c.strip().lower() for c in v if c.strip()]
    except:
        return []

cat_map = {row['parent_asin']: parse_cats(row['categories'])
           for _, row in df_meta.iterrows()}

item_categories = [cat_map.get(all_items[i], []) for i in range(n_items)]
del df, df_meta

print("4. Chuẩn hóa rating và build sparse matrix...")
mu = np.zeros(n_users, dtype=np.float32)
for u in range(n_users):
    mask = (user_col == u)
    if mask.any():
        mu[u] = rate_col[mask].mean()

rate_norm = rate_col - mu[user_col]
Ybar = sparse.csr_matrix(
    (rate_norm, (item_col, user_col)),
    shape=(n_items, n_users),
    dtype=np.float32
)

print("5. Tính ma trận Similarity S...")
BATCH = 500
S = np.zeros((n_items, n_items), dtype=np.float32)
for start in range(0, n_items, BATCH):
    end = min(start + BATCH, n_items)
    S[start:end] = cosine_similarity(Ybar[start:end], Ybar).astype(np.float32)
    print(f'  {end} / {n_items}', end='\r')

print("\n6. Lưu pkl...")
model_data = {
    'user_to_idx':  user_to_idx,
    'item_to_idx':  item_to_idx,
    'idx_to_item':  idx_to_item,
    'item_ids':     all_items,
    'item_titles':  item_titles,
    'item_categories': item_categories,
    'cf_S':    S,
    'cf_mu':   mu,
    'cf_k':    10,
}

with open(OUTPUT_PKL, 'wb') as f:
    pickle.dump(model_data, f, protocol=4)

print("✅ Xong!")
