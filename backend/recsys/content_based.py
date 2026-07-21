import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from database import supabase

def get_content_based_recommendations(product_id: str, top_n: int = 5):
    response = supabase.table('products').select('*').execute()
    products = response.data
    if not products:
        return []

    df = pd.DataFrame(products)
    if product_id not in df['_id'].values:
        return []
    
    df['category'] = df['category'].fillna('')
    df['description'] = df['description'].fillna('')
    df['combined_features'] = df['category'] + " " + df['description']
    
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['combined_features'])
    
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    idx = df.index[df['_id'] == product_id].tolist()[0]
    
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:top_n+1]
    
    product_indices = [i[0] for i in sim_scores]
    recommended_products = df.iloc[product_indices].to_dict(orient='records')
    return recommended_products
