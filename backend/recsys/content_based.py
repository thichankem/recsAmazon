import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from database import supabase

def get_content_based_recommendations(product_id: str, top_n: int = 5):
    """
    Get similar products based on category and description.
    """
    # Fetch all products
    response = supabase.table('products').select('*').execute()
    products = response.data
    if not products:
        return []

    # Convert to DataFrame
    df = pd.DataFrame(products)
    
    # Check if target product exists
    if product_id not in df['_id'].values:
        return []
    
    # Combine features for content-based filtering
    df['category'] = df['category'].fillna('')
    df['description'] = df['description'].fillna('')
    df['combined_features'] = df['category'] + " " + df['description']
    
    # TF-IDF Vectorization
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['combined_features'])
    
    # Calculate cosine similarity
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    
    # Get index of the target product
    idx = df.index[df['_id'] == product_id].tolist()[0]
    
    # Get pairwise similarity scores for all products with that product
    sim_scores = list(enumerate(cosine_sim[idx]))
    
    # Sort the products based on similarity scores
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    
    # Get the scores of the top-n most similar products (ignore the first one which is itself)
    sim_scores = sim_scores[1:top_n+1]
    
    # Get the product indices
    product_indices = [i[0] for i in sim_scores]
    
    # Return top N products
    recommended_products = df.iloc[product_indices].to_dict(orient='records')
    return recommended_products
