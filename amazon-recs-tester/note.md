hãy xây cho tôi hệ gợi ý sản phẩm cho trang chủ và cho trang chi tiết sản phẩm
hệ gợi ý của trang chủ sẽ theo hành vi của người dùng tức là click chuột vào các sản phẩm thì hệ thộng sẽ lưu lại các hành vi đó và gợi ý sản phẩm dựa trên các hành vi đó (sử dụng thuật toán collaborative filtering)
hệ gợi ý ở trang chi tiết sản phẩm sẽ dựa vào danh mục và description để gợi ý sản phẩm tương tự dùng thuật toán content-based filtering






# Chuyển vào thư mục chứa dự án
cd "C:\Users\ADMIN\OneDrive\Máy tính\recsAmazon\backend"

# Chạy server FastAPI
.\venv\Scripts\python.exe -m uvicorn main:app --reload



# Chuyển vào thư mục frontend
cd "C:\Users\ADMIN\OneDrive\Máy tính\recsAmazon\amazon-recs-tester"

# Chạy server giao diện web
npm run dev
