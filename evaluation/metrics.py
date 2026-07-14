import numpy as np

def recall_at_k(actual, predicted, k=10):
    """
    Tính toán chỉ số Recall@K.
    
    actual: Tập hợp (list hoặc set) các sản phẩm thực tế người dùng tương tác trong tập test.
    predicted: Danh sách sản phẩm được mô hình gợi ý theo thứ tự ưu tiên.
    k: Số lượng sản phẩm gợi ý được lấy ra để đánh giá (mặc định k=10).
    """
    if not actual:
        return 0.0
    actual_set = set(actual)
    predicted_k = predicted[:k]
    # Tính số lượng sản phẩm gợi ý trúng (hits) nằm trong thực tế tương tác
    hits = len(actual_set.intersection(predicted_k))
    # Recall = Số lượt gợi ý trúng / Tổng số tương tác thực tế
    return float(hits) / len(actual_set)

def ndcg_at_k(actual, predicted, k=10):
    """
    Tính toán chỉ số NDCG@K (Normalized Discounted Cumulative Gain).
    Đánh giá độ chính xác của gợi ý có tính tới thứ tự ưu tiên của sản phẩm đề xuất.
    
    actual: Tập hợp các sản phẩm thực tế tương tác trong tập test.
    predicted: Danh sách sản phẩm được mô hình gợi ý theo thứ tự ưu tiên.
    k: Số lượng sản phẩm lấy ra để chấm điểm.
    """
    if not actual:
        return 0.0
    actual_set = set(actual)
    predicted_k = predicted[:k]
    
    dcg = 0.0
    for i, p in enumerate(predicted_k):
        if p in actual_set:
            # i bắt đầu từ 0, nên chiết khấu vị trí được tính bằng log2(i + 2)
            dcg += 1.0 / np.log2(i + 2)
            
    # Tính toán Ideal DCG (IDCG - DCG lý tưởng khi gợi ý đúng toàn bộ và sắp xếp tối ưu)
    idcg = 0.0
    n_rel = min(k, len(actual_set))
    for i in range(n_rel):
        idcg += 1.0 / np.log2(i + 2)
        
    if idcg == 0.0:
        return 0.0
        
    # NDCG = DCG thực tế / DCG lý tưởng
    return dcg / idcg
