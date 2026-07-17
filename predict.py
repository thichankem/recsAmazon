import sys
import os
import json
import pickle
import numpy as np
import warnings
from sklearn.metrics.pairwise import cosine_similarity

warnings.filterwarnings('ignore')

# Đồng bộ luồng đọc/ghi dạng UTF-8 để không bị lỗi ký tự lạ trên Windows
sys.stdout.reconfigure(encoding='utf-8')
sys.stdin.reconfigure(encoding='utf-8')

def load_model_and_predict(full_content):
    try:
        # 1. Load bộ não AI từ file pkl của bạn
        with open('model/content_based_model.pkl', 'rb') as f:
            model_data = pickle.load(f)
            
        tfidf = model_data['tfidf']
        tfidf_matrix = model_data['tfidf_matrix']
        df_unique = model_data['df_unique']
        
        # 🔥 ĐẦU VÀO ĐÚNG 1 TRƯỜNG VĂN BẢN: Vector hóa toàn bộ chuỗi content gộp chung
        query_vector = tfidf.transform([full_content])
        
        # 2. Tính toán độ tương đồng Cosine giữa sản phẩm vừa cào và kho dữ liệu của bạn
        sim_scores = cosine_similarity(query_vector, tfidf_matrix).flatten()
        
        # 3. Trích xuất top 5 sản phẩm phù hợp nhất từ dataframe của bạn
        top_indices = np.argsort(sim_scores)[::-1][:5]
        predicted_titles = df_unique.iloc[top_indices]['title'].tolist()
        
        # Load metadata
        metadata_cache = {}
        if os.path.exists('model_output/metadata_cache.pkl'):
            with open('model_output/metadata_cache.pkl', 'rb') as f:
                metadata_cache = pickle.load(f)
                
        results = []
        for title in predicted_titles:
            if title in metadata_cache:
                results.append(metadata_cache[title])
            else:
                results.append({"title": title})
                
        return results[:5]
        
    except Exception as e:
        return [f"Lỗi chạy model .pkl: {str(e)}"]

if __name__ == "__main__":
    try:
        # Đọc dữ liệu dạng dòng JSON từ Playwright gửi sang
        line = sys.stdin.readline()
        if not line:
            predictions = ["Lỗi: Không nhận được dữ liệu từ Bot"]
        else:
            input_data = json.loads(line.strip())
            
            # Lấy title và description ra từ bot cào được
            title = input_data.get('title', '')
            description = input_data.get('description', '')
            
            # 🎯 GỘP CHÍNH XÁC THÀNH 1 TRƯỜNG: Nối tiêu đề và mô tả thành 1 chuỗi content duy nhất
            full_content = f"{title}\n{description}"
            
            # Bơm duy nhất 1 trường content này vào mô hình của bạn
            predictions = load_model_and_predict(full_content)
        
    except Exception as e:
        predictions = [f"Lỗi xử lý luồng dữ liệu: {str(e)}"]
        
    # Đóng gói kết quả gửi trả lại cho Playwright để xuất ra Dashboard
    print(json.dumps(predictions, ensure_ascii=False))