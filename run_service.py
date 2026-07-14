import os
from fastapi import FastAPI, HTTPException, Query
from src.service_online import OnlineRecommenderService

app = FastAPI(
    title="Amazon Product Recommendation API",
    description="Engine phục vụ trực tuyến (Online Serving Engine) hỗ trợ phân tầng 3 lớp chống Cold Start.",
    version="2.0.0"
)

# Khởi tạo service phục vụ gợi ý trực tuyến từ file DB SQLite
DB_PATH = os.getenv("RECOMMENDER_DB", "db/recommendations.db")
service = OnlineRecommenderService(db_path=DB_PATH)

@app.get("/")
def read_root():
    """
    Endpoint kiểm tra trạng thái hoạt động của hệ thống gợi ý.
    """
    return {
        "status": "online",
        "service": "Amazon Personalized Static Recommendation Engine",
        "database": DB_PATH,
        "db_exists": os.path.exists(DB_PATH)
    }

@app.get("/recommendations")
def get_recommendations(
    user_id: str = Query(..., description="ID định danh duy nhất của người dùng"),
    category: str = Query(None, description="Ngữ cảnh danh mục hiện tại người dùng đang xem (không bắt buộc)"),
    limit: int = Query(10, ge=1, le=50, description="Số lượng sản phẩm muốn gợi ý")
):
    """
    Endpoint truy vấn danh sách gợi ý cá nhân hóa cho người dùng.
    
    Quy trình phân tầng phòng thủ Cold-Start:
    - Layer 1: Gợi ý cá nhân hóa từ lịch sử và Jaccard similarity.
    - Layer 2: Gợi ý theo sản phẩm nổi bật của Category (nếu là user mới có category context).
    - Layer 3: Gợi ý theo sản phẩm nổi bật toàn sàn (nếu là user mới tinh không có ngữ cảnh).
    """
    # Kiểm tra xem database đã được khởi tạo qua offline pipeline chưa
    if not os.path.exists(DB_PATH):
        raise HTTPException(
            status_code=503, 
            detail="Cơ sở dữ liệu gợi ý chưa được khởi tạo. Vui lòng chạy offline pipeline trước."
        )
        
    try:
        # Gọi dịch vụ lấy danh sách gợi ý
        recs = service.get_recommendations(user_id=user_id, category_context=category, limit=limit)
        return recs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống phục vụ: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Khởi chạy server FastAPI cục bộ tại port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
