"""
predict_collaboration.py
──────────────────────────────────────────────────────────────────────────
Input  (stdin JSON):  { "viewed_titles": ["Product A", "Product B", ...] }
Output (stdout JSON): ["Rec 1", "Rec 2", ..., "Rec 10"]

Logic:
  1. Load collaborative_model.pkl (Item-Item CF, đã lưu bởi collaboration_model.ipynb)
  2. Tìm item_idx gần nhất với mỗi title người dùng đã xem (fuzzy match qua TF-IDF trên item_titles)
  3. Tổng hợp hàng similarity S[item_idx] → rank → top-N loại trừ item đã xem
  Fallback: nếu pkl chưa có, dùng content-based model với title gộp lại
"""

import sys, json, pickle, os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

sys.stdout.reconfigure(encoding='utf-8')
sys.stdin.reconfigure(encoding='utf-8')

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'collaborative_model.pkl')
CB_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'content_based_model.pkl')


def match_title_to_idx(query: str, all_titles: list[str]) -> int:
    """Tìm index item trong model gần nhất với query title."""
    all_lower = [t.lower() for t in all_titles]
    query_lower = query.lower()
    
    # Exact / substring match trước
    for i, t in enumerate(all_lower):
        if query_lower in t or t in query_lower:
            return i
    
    # TF-IDF cosine fallback
    try:
        vect = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 4), min_df=1)
        mat = vect.fit_transform(all_lower + [query_lower])
        sims = cosine_similarity(mat[-1], mat[:-1]).flatten()
        return int(np.argmax(sims))
    except Exception:
        return 0


def recommend_collaboration(viewed_titles: list[str], top_k: int = 10) -> list[str]:
    """Item-Item CF: tổng hợp similarity rows của các item đã xem."""
    
    if not os.path.exists(MODEL_PATH):
        # ── Fallback: dùng content-based model ──────────────────
        print("[WARN] collaborative_model.pkl chưa có, fallback sang content-based.", file=sys.stderr)
        if not os.path.exists(CB_MODEL_PATH):
            return ["Lỗi: Chưa có file model pkl nào"]
        
        with open(CB_MODEL_PATH, 'rb') as f:
            cb_data = pickle.load(f)
        tfidf = cb_data['tfidf']
        tfidf_matrix = cb_data['tfidf_matrix']
        df_unique = cb_data['df_unique']
        
        # Gộp tất cả title đã xem thành 1 query
        combined = ' '.join(viewed_titles)
        qvec = tfidf.transform([combined])
        sims = cosine_similarity(qvec, tfidf_matrix).flatten()
        
        # Loại trừ items có tên trùng với input
        viewed_lower = {t.lower() for t in viewed_titles}
        all_titles_cb = df_unique['title'].tolist()
        
        ranked = np.argsort(sims)[::-1]
        results = []
        for idx in ranked:
            title = all_titles_cb[idx]
            if not any(v in title.lower() or title.lower() in v for v in viewed_lower):
                results.append(title)
            if len(results) >= top_k:
                break
        return results
    
    # ── Load collaborative model ─────────────────────────────────
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    
    item_titles: list[str] = model['item_titles']
    item_ids: list[str]    = model['item_ids']
    S: np.ndarray          = model['cf_S']          # shape: (n_items, n_items)
    
    # Map viewed titles → item indices
    viewed_indices: list[int] = []
    for title in viewed_titles:
        idx = match_title_to_idx(title, item_titles)
        viewed_indices.append(idx)
        print(f"[MAP] '{title[:50]}' → idx={idx} ({item_titles[idx][:50]})", file=sys.stderr)
    
    # Tổng hợp similarity: cộng các hàng S[i] của item đã xem
    agg_sim = np.zeros(S.shape[0])
    for i in viewed_indices:
        agg_sim += S[i]
    
    # Loại trừ các item đã xem
    for i in viewed_indices:
        agg_sim[i] = -1.0
    
    # Rank và lấy top-K
    ranked = np.argsort(agg_sim)[::-1]
    results = [item_titles[i] for i in ranked[:top_k] if agg_sim[i] > -1.0]
    return results[:top_k]


if __name__ == '__main__':
    try:
        line = sys.stdin.readline()
        data = json.loads(line.strip())
        viewed = data.get('viewed_titles', [])
        top_k  = data.get('top_k', 10)
        
        if not viewed:
            recs = ['Lỗi: viewed_titles rỗng']
        else:
            recs = recommend_collaboration(viewed, top_k)
    except Exception as e:
        recs = [f'Lỗi: {str(e)}']
    
    print(json.dumps(recs, ensure_ascii=False))
