# E-Commerce Recommendation System

Hệ thống gợi ý sản phẩm cho e-commerce (Home & Product Detail recommendations).

## Cấu trúc dự án

- `amazon-recs-tester/`: Giao diện Web Frontend (React + Vite + Tailwind CSS)
- `backend/`: FastAPI Server (Collaborative & Content-Based Filtering) + Supabase Connection

## Hướng dẫn chạy ứng dụng

### 1. Frontend
```bash
cd amazon-recs-tester
npm install
npm run dev
```

### 2. Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
