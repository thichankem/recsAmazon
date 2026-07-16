"""
predict_collaboration.py
═══════════════════════════════════════════════════════════════════════════════
Input  (stdin JSON):
    {
        "viewed_titles": ["Product A title", "Product B title", ...],
        "top_k": 10,
        "method": "item_cf"   # hoặc "svd" (mặc định: "item_cf")
    }

Output (stdout JSON):
    ["Recommended title 1", "Recommended title 2", ...]

Logic Item-Item CF:
    1. Map mỗi viewed title → item_idx gần nhất (TF-IDF fuzzy match)
    2. Tổng hợp hàng similarity S[item_idx] của tất cả items đã xem
    3. Loại trừ items đã xem → Lấy top-K có score cao nhất

Logic SVD:
    1. Tính "pseudo user vector" = trung bình item_features[viewed_items]
    2. Dot product với tất cả item_features → rank → top-K
═══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
import json
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

sys.stdout.reconfigure(encoding='utf-8')
sys.stdin.reconfigure(encoding='utf-8')

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          'model', 'collaborative_model.pkl')

# ─── Cache model (tránh load lại mỗi lần gọi) ───────────────────────────
_model_cache: dict = {}

def load_model() -> dict:
    if _model_cache:
        return _model_cache
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Chưa có file: {MODEL_PATH}\n"
                                f"Hãy chạy: python train_collaboration_model.py")
    print(f"[INFO] Loading model từ {MODEL_PATH}...", file=sys.stderr)
    with open(MODEL_PATH, 'rb') as f:
        data = pickle.load(f)
    _model_cache.update(data)
    print("[INFO] Model loaded!", file=sys.stderr)
    return _model_cache

# ─── Fuzzy match: tìm item_idx gần nhất với query title ─────────────────
def match_title_to_idx(query: str, item_titles: list[str]) -> int:
    """
    Tìm item_idx có title gần nhất với query.
    Ưu tiên: exact/substring match → TF-IDF char-ngram cosine.
    """
    q = query.lower().strip()
    titles_lower = [t.lower() for t in item_titles]

    # 1. Exact match
    if q in titles_lower:
        return titles_lower.index(q)

    # 2. Substring match (query ⊂ title hoặc title ⊂ query)
    for i, t in enumerate(titles_lower):
        if q in t or t in q:
            return i

    # 3. Word overlap
    q_words = set(q.split())
    best_idx, best_score = 0, -1.0
    for i, t in enumerate(titles_lower):
        t_words = set(t.split())
        if not q_words or not t_words:
            continue
        jaccard = len(q_words & t_words) / len(q_words | t_words)
        if jaccard > best_score:
            best_score = jaccard
            best_idx = i
    if best_score > 0.15:
        return best_idx

    # 4. TF-IDF char-ngram fallback
    try:
        sample = titles_lower[:5000] + [q]   # giới hạn 5k để nhanh
        vect = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 4), min_df=1)
        mat = vect.fit_transform(sample)
        sims = cosine_similarity(mat[-1], mat[:-1]).flatten()
        return int(np.argmax(sims))
    except Exception:
        return 0


# ═══════════════════════════════════════════════════════════════════════════
# Item-Item CF Recommendation
# ═══════════════════════════════════════════════════════════════════════════
def recommend_item_cf(viewed_titles: list[str],
                      model: dict,
                      top_k: int = 10) -> list[str]:
    item_titles: list[str] = model['item_titles']
    item_categories: list[list[str]] = model.get('item_categories', [])
    S: np.ndarray           = model['cf_S']   # (n_items, n_items)
    k                       = model['cf_k']

    # Map titles → indices
    viewed_indices = []
    viewed_cats = set()
    for title in viewed_titles:
        idx = match_title_to_idx(title, item_titles)
        viewed_indices.append(idx)
        print(f"[MAP-CF] '{title[:50]}' → #{idx} '{item_titles[idx][:50]}'",
              file=sys.stderr)
        if item_categories:
            for c in item_categories[idx]:
                viewed_cats.add(c)

    # Tổng hợp similarity score
    agg = np.zeros(S.shape[0], dtype=np.float32)
    for i in viewed_indices:
        row = S[i].copy()
        # Giữ top-k neighbors của item đã xem
        top_k_idx = np.argpartition(row, -k)[-k:]
        mask = np.zeros_like(row)
        mask[top_k_idx] = row[top_k_idx]
        agg += mask

    # Áp dụng Category Boost (1.5x)
    if viewed_cats and item_categories:
        for i in range(len(agg)):
            if agg[i] > 0:
                if any(c in viewed_cats for c in item_categories[i]):
                    agg[i] *= 1.5

    # Loại trừ items đã xem
    for i in viewed_indices:
        agg[i] = -np.inf

    ranked = np.argsort(agg)[::-1]
    results = []
    for idx in ranked:
        if agg[idx] == -np.inf:
            continue
        results.append(item_titles[idx])
        if len(results) >= top_k:
            break

    return results


# ═══════════════════════════════════════════════════════════════════════════
# SVD Matrix Factorization Recommendation
# ═══════════════════════════════════════════════════════════════════════════
def recommend_svd(viewed_titles: list[str],
                  model: dict,
                  top_k: int = 10) -> list[str]:
    item_titles: list[str]  = model['item_titles']
    item_features: np.ndarray = model['item_features']  # (n_items, factors)

    viewed_indices = []
    for title in viewed_titles:
        idx = match_title_to_idx(title, item_titles)
        viewed_indices.append(idx)
        print(f"[MAP-SVD] '{title[:50]}' → #{idx} '{item_titles[idx][:50]}'",
              file=sys.stderr)

    # Pseudo user vector = mean của item features đã xem
    user_vec = item_features[viewed_indices].mean(axis=0)  # (factors,)

    # Score = dot product với mọi item
    scores = item_features @ user_vec  # (n_items,)

    # Loại trừ items đã xem
    for i in viewed_indices:
        scores[i] = -np.inf

    ranked = np.argsort(scores)[::-1]
    results = []
    for idx in ranked:
        if scores[idx] == -np.inf:
            continue
        results.append(item_titles[idx])
        if len(results) >= top_k:
            break

    return results


# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    try:
        line = sys.stdin.readline()
        data = json.loads(line.strip())

        viewed_titles: list[str] = data.get('viewed_titles', [])
        top_k: int               = int(data.get('top_k', 10))
        method: str              = data.get('method', 'item_cf')   # 'item_cf' | 'svd'

        if not viewed_titles:
            recs = ['Lỗi: viewed_titles rỗng']
        else:
            model = load_model()
            if method == 'svd':
                recs = recommend_svd(viewed_titles, model, top_k)
            else:
                recs = recommend_item_cf(viewed_titles, model, top_k)

    except FileNotFoundError as e:
        recs = [f'Lỗi: {str(e)}']
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        recs = [f'Lỗi: {str(e)[:100]}']

    print(json.dumps(recs, ensure_ascii=False))
