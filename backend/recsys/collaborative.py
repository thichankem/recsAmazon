import pandas as pd
from sklearn.decomposition import TruncatedSVD
import numpy as np
from database import products_collection, interactions_collection, users_collection

def get_collaborative_recommendations(user_id: str, top_n: int = 5):
    """
    Get recommended products for a user based on implicit feedback (clicks)
    using TruncatedSVD (Matrix Factorization).
    """
    # Fetch data
    interactions = list(interactions_collection.find({}))
    products = list(products_collection.find({}))
    
    if not interactions or not products:
        # Fallback to popular products or random if no data
        return list(products_collection.aggregate([{"$sample": {"size": top_n}}]))
        
    df_interactions = pd.DataFrame(interactions)
    df_products = pd.DataFrame(products)
    
    # We treat 'click' as a count of 1. If a user clicks multiple times, we sum it up.
    # Group by user and product
    if 'action' in df_interactions.columns:
        df_interactions['count'] = 1
        grouped_interactions = df_interactions.groupby(['user_id', 'product_id'])['count'].sum().reset_index()
    else:
        return []

    # Create User-Item Matrix
    user_item_matrix = grouped_interactions.pivot(index='user_id', columns='product_id', values='count').fillna(0)
    
    # If the user has no interactions, return popular/random products
    if user_id not in user_item_matrix.index:
        return list(products_collection.aggregate([{"$sample": {"size": top_n}}]))

    # Matrix Factorization using Truncated SVD
    n_components = min(20, min(user_item_matrix.shape) - 1)
    if n_components <= 0:
        return list(products_collection.aggregate([{"$sample": {"size": top_n}}]))
        
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    matrix_factorized = svd.fit_transform(user_item_matrix)
    
    # Reconstruct the matrix
    reconstructed_matrix = np.dot(matrix_factorized, svd.components_)
    
    # Create DataFrame from the reconstructed matrix
    preds_df = pd.DataFrame(reconstructed_matrix, columns=user_item_matrix.columns, index=user_item_matrix.index)
    
    # Get user predictions
    user_predictions = preds_df.loc[user_id]
    
    # Get products the user has already interacted with to exclude them
    user_interacted_products = grouped_interactions[grouped_interactions['user_id'] == user_id]['product_id'].tolist()
    
    # Do not filter out interacted products so the user can clearly see their preferences reflected at the top
    recommendations = user_predictions.sort_values(ascending=False)
    
    # Get top N product IDs
    top_product_ids = recommendations.head(top_n).index.tolist()
    
    # Fetch product details
    recommended_products = df_products[df_products['_id'].isin(top_product_ids)].to_dict(orient='records')
    
    # Ensure they are ordered by recommendation score
    recommended_products_dict = {p['_id']: p for p in recommended_products}
    ordered_recommendations = [recommended_products_dict[pid] for pid in top_product_ids if pid in recommended_products_dict]
    
    return ordered_recommendations
