import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import random
from database import supabase

def calculate_user_means(df_interactions):
    ratings_df = df_interactions[
        (df_interactions['action'] == 'rating') | (df_interactions['rating_score'].notna())
    ].copy()
    if ratings_df.empty:
        return {}
    ratings_df['score'] = ratings_df.apply(
        lambda r: float(r['rating_score']) if pd.notna(r.get('rating_score')) else 5.0, axis=1
    )
    return ratings_df.groupby('user_id')['score'].mean().to_dict()

def calculate_interaction_weight(row, user_means):
    action = row.get('action', 'click')
    rating_score = row.get('rating_score', None)
    user_id = str(row.get('user_id', ''))
    
    if action == 'rating' or (rating_score is not None and not pd.isna(rating_score)):
        score = float(rating_score) if (rating_score is not None and not pd.isna(rating_score)) else 5.0
        u_mean = user_means.get(user_id, 3.0)
        # Chuẩn hóa đánh giá người dùng (Mean-Centering / Bias Normalization)
        # Người khó tính (u_mean thấp) cho 4 sao -> Điểm quy đổi cao hơn
        # Người dễ tính (u_mean cao) cho 4 sao -> Điểm quy đổi đúng thực tế
        return max(0.5, 3.0 + (score - u_mean))
    elif action == 'add_to_cart':
        return 5.0
    elif action == 'click':
        return 1.0
    else:
        return 1.0

import hashlib

def get_collaborative_recommendations(user_id: str, top_n: int = 50):
    res_int = supabase.table('interactions').select('*').execute()
    res_prod = supabase.table('products').select('*').execute()
    
    interactions = res_int.data
    products = res_prod.data
    
    if not products:
        return []
    if not interactions:
        return products[:top_n]
        
    df_interactions = pd.DataFrame(interactions)
    df_products = pd.DataFrame(products)
    
    df_interactions['user_id'] = df_interactions['user_id'].astype(str)
    df_interactions['product_id'] = df_interactions['product_id'].astype(str)
    df_products['_id'] = df_products['_id'].astype(str)
    
    user_means = calculate_user_means(df_interactions)
    df_interactions['weight'] = df_interactions.apply(lambda r: calculate_interaction_weight(r, user_means), axis=1)
    
    # 1. User-Item Interaction Matrix (Sum of weights)
    grouped_interactions = df_interactions.groupby(['user_id', 'product_id'])['weight'].sum().reset_index()
    user_item_matrix = grouped_interactions.pivot(index='user_id', columns='product_id', values='weight').fillna(0)
    
    user_id_str = str(user_id)
    
    # Target user's interactions in DataFrame
    user_history = df_interactions[df_interactions['user_id'] == user_id_str]
    
    # If user has no history, provide balanced popular/featured exploration
    if user_history.empty or user_id_str not in user_item_matrix.index:
        hash_val = int(hashlib.md5(user_id_str.encode()).hexdigest(), 16)
        categories = sorted(list(set(p.get('category', '') for p in products if p.get('category'))))
        if categories:
            fav_cat = categories[hash_val % len(categories)]
            fav_prods = [p for p in products if p.get('category') == fav_cat]
            other_prods = [p for p in products if p.get('category') != fav_cat]
            
            fav_prods_sorted = sorted(fav_prods, key=lambda p: int(hashlib.md5(f"{user_id_str}_{p['_id']}".encode()).hexdigest(), 16))
            other_prods_sorted = sorted(other_prods, key=lambda p: int(hashlib.md5(f"{user_id_str}_{p['_id']}".encode()).hexdigest(), 16))
            return (fav_prods_sorted + other_prods_sorted)[:top_n]
        return products[:top_n]

    # Target user's interacted products set
    target_user_vector = user_item_matrix.loc[user_id_str]
    target_interacted_pids = set(target_user_vector[target_user_vector > 0].index)

    # 2. User Category Affinity
    merged_history = user_history.merge(df_products, left_on='product_id', right_on='_id', how='inner')
    category_weights = {}
    if not merged_history.empty and 'category' in merged_history.columns:
        category_weights = merged_history.groupby('category')['weight'].sum().to_dict()

    total_cat_weight = sum(category_weights.values()) if category_weights else 1.0

    # 3. User-User Cosine Similarity
    user_sim_matrix = cosine_similarity(user_item_matrix)
    user_sim_df = pd.DataFrame(user_sim_matrix, index=user_item_matrix.index, columns=user_item_matrix.index)
    sim_scores = user_sim_df[user_id_str]

    # 4. Collaborative Prediction for candidate products
    collab_scores = {}
    for pid in user_item_matrix.columns:
        weighted_sum = 0.0
        sim_sum = 0.0
        for other_user in user_item_matrix.index:
            if other_user == user_id_str:
                continue
            s = sim_scores[other_user]
            val = user_item_matrix.loc[other_user, pid]
            if s > 0 and val > 0:
                weighted_sum += s * val
                sim_sum += s
        collab_scores[pid] = (weighted_sum / sim_sum) if sim_sum > 0 else 0.0

    # 5. Global Product Popularity fallback
    global_pop = df_interactions.groupby('product_id')['weight'].sum().to_dict()

    # 6. Final Score Calculation
    # Category Affinity gets top priority (200.0 weight), Collaborative scores add fine tuning (20.0 weight).
    final_scores = {}
    for p in products:
        pid = str(p['_id'])
        p_cat = p.get('category', '')
        
        c_score = collab_scores.get(pid, 0.0)
        cat_w = category_weights.get(p_cat, 0.0)
        cat_affinity = (cat_w / total_cat_weight) if total_cat_weight > 0 else 0.0
        pop_w = global_pop.get(pid, 0.0)
        
        is_new_unseen = pid not in target_interacted_pids
        user_tie_breaker = (int(hashlib.md5(f"{user_id_str}_{pid}".encode()).hexdigest(), 16) % 1000) / 10000.0
        
        if is_new_unseen:
            # Unseen products in user's preferred category score highest!
            score = (cat_affinity * 1000.0) + (c_score * 10.0) + (pop_w * 0.05) + user_tie_breaker
        else:
            # Interacted items placed lower than new recommendations to promote discovery
            score = (cat_affinity * 100.0) + (c_score * 2.0) + (pop_w * 0.01) + user_tie_breaker
            
        final_scores[pid] = score

    # Sort products by final score
    sorted_products = sorted(products, key=lambda p: final_scores[str(p['_id'])], reverse=True)
    return sorted_products[:top_n]

