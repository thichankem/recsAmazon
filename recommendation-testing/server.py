from fastapi import FastAPI, Query, Body
from fastapi.responses import HTMLResponse
from typing import Optional, Dict, Any, List
import json
import time
from pathlib import Path
import uvicorn

# Import framework dependencies
from utils.logger import logger
from utils.helper import load_yaml
from models.model_factory import ModelFactory
from simulator.bot_simulator import BotSimulator
from simulator.amazon_scraper import AmazonScraper

app = FastAPI(
    title="Recommendation Engine Service API",
    description="Real URL Testing service for Amazon Cell Phones and Accessories recommendations.",
    version="1.0.0"
)

# Global variables for model state
model = None
model_type = "unknown"
num_users = 0
num_items = 0
train_time_ms = 0.0

def load_and_train_model():
    global model, model_type, num_users, num_items, train_time_ms
    
    # Resolve config path
    config_path = Path("recommendation-testing/configs/config.yaml")
    if not config_path.exists():
        config_path = Path("configs/config.yaml")
        
    if not config_path.exists():
        logger.error(f"Config file not found in {config_path}")
        return

    try:
        config = load_yaml(str(config_path))
    except Exception as e:
        logger.error(f"Error loading configuration: {e}")
        return
        
    model_config = config.get("model", {})
    model_type = model_config.get("type", "hybrid")
    
    # Resolve processed dataset path
    dataset_config = config.get("dataset", {})
    processed_path = Path("recommendation-testing") / dataset_config.get("raw_path", "datasets/processed/train_data.json")
    if not processed_path.parent.exists() or not processed_path.exists():
        processed_path = Path(dataset_config.get("raw_path", "datasets/processed/train_data.json"))
        
    logger.info(f"Loading and training model '{model_type}' on dataset: {processed_path}")
    
    if not processed_path.exists():
        logger.error(f"Processed dataset not found at {processed_path}. Please run preprocess.py first.")
        return

    start_time = time.perf_counter()
    try:
        with open(processed_path, "r", encoding="utf-8") as f:
            train_data = json.load(f)
            
        # Stats
        interactions = train_data.get("interactions", [])
        items_meta = train_data.get("items", [])
        
        unique_users = set(inter.get("user_id") for inter in interactions)
        unique_items = set(inter.get("item_id") for inter in interactions).union(
            set(item.get("item_id") for item in items_meta)
        )
        
        num_users = len(unique_users)
        num_items = len(unique_items)
        
        # Instantiate and train model
        model = ModelFactory.create_model(model_config)
        model.train(train_data)
        
        train_time_ms = (time.perf_counter() - start_time) * 1000.0
        logger.info(f"Model trained successfully in {train_time_ms:.2f} ms. Users: {num_users}, Items: {num_items}")
    except Exception as e:
        logger.error(f"Failed to train model: {e}")

# Run training on startup
@app.on_event("startup")
def startup_event():
    load_and_train_model()

@app.post("/recommend")
def get_recommendations_post(payload: Dict[str, Any]):
    """
    POST recommendation endpoint matching ProductionAdapter requirements.
    
    Payload schema:
    {
        "user_id": str,
        "context_item_id": str (optional),
        "top_k": int (optional, default 10)
    }
    """
    user_id = payload.get("user_id")
    context_item_id = payload.get("context_item_id")
    top_k = payload.get("top_k", 10)
    
    if not user_id:
        return {"items": [], "error": "user_id is required", "status_code": 400}
        
    if model is None:
        return {"items": [], "error": "Model is not trained/loaded", "status_code": 503}
        
    start_time = time.perf_counter()
    try:
        recs = model.recommend(user_id=user_id, context_item_id=context_item_id, top_k=top_k)
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "items": recs,
            "user_id": user_id,
            "context_item_id": context_item_id,
            "latency_ms": latency_ms,
            "status_code": 200
        }
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        return {"items": [], "error": str(e), "status_code": 500}

@app.get("/recommend")
def get_recommendations_get(
    user_id: str = Query(..., description="The user ID to fetch recommendations for"),
    context_item_id: Optional[str] = Query(None, description="Optional product ID representing the item context being viewed"),
    top_k: int = Query(10, description="Number of products to recommend")
):
    """
    GET recommendation endpoint for easy URL testing directly in a browser.
    Example: http://localhost:8000/recommend?user_id=AFKZENTNBQ7A7V7UXW5JJI6UGRYQ&top_k=5
    """
    if model is None:
        return {"items": [], "error": "Model is not trained/loaded", "status_code": 503}
        
    start_time = time.perf_counter()
    try:
        recs = model.recommend(user_id=user_id, context_item_id=context_item_id, top_k=top_k)
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "user_id": user_id,
            "context_item_id": context_item_id,
            "items": recs,
            "latency_ms": latency_ms,
            "status_code": 200
        }
    except Exception as e:
        return {"items": [], "error": str(e), "status_code": 500}

@app.get("/", response_class=HTMLResponse)
def index_page():
    """Renders a beautiful premium status & testing interface."""
    html_content = f"""<!DOCTYPE html>
    <html>
    <head>
        <title>Recommendation API Control Center</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Outfit', sans-serif;
                background: linear-gradient(135deg, #0e1117 0%, #161a24 100%);
                color: #f3f4f6;
                margin: 0;
                padding: 40px;
                min-height: 100vh;
                box-sizing: border-box;
            }}
            .container {{
                max-width: 900px;
                margin: 0 auto;
            }}
            .header {{
                background: rgba(30, 41, 59, 0.45);
                border-radius: 16px;
                padding: 30px;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                margin-bottom: 30px;
                text-align: center;
            }}
            h1 {{
                font-size: 2.5rem;
                font-weight: 800;
                background: linear-gradient(90deg, #38bdf8 0%, #a855f7 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0 0 10px 0;
            }}
            .subtitle {{
                color: #94a3b8;
                font-size: 1.1rem;
                margin: 0;
            }}
            .grid {{
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }}
            .card {{
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                text-align: center;
                transition: transform 0.2s, box-shadow 0.2s;
            }}
            .card:hover {{
                transform: translateY(-2px);
                border-color: rgba(56, 189, 248, 0.4);
                box-shadow: 0 4px 20px rgba(56, 189, 248, 0.15);
            }}
            .card-value {{
                font-size: 1.8rem;
                font-weight: 700;
                color: #38bdf8;
            }}
            .card-label {{
                color: #94a3b8;
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-top: 5px;
            }}
            .panel {{
                background: rgba(30, 41, 59, 0.25);
                border-radius: 12px;
                padding: 24px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                margin-bottom: 25px;
            }}
            h2 {{
                color: #f3f4f6;
                margin-top: 0;
                font-size: 1.4rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                padding-bottom: 10px;
            }}
            pre {{
                background: #090d12;
                padding: 15px;
                border-radius: 8px;
                overflow-x: auto;
                font-size: 0.9rem;
                color: #c9d1d9;
                border: 1px solid rgba(255, 255, 255, 0.04);
            }}
            .btn {{
                display: inline-block;
                background: linear-gradient(90deg, #38bdf8 0%, #a855f7 100%);
                color: #ffffff;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
                transition: opacity 0.2s;
            }}
            .btn:hover {{
                opacity: 0.9;
            }}
            .url-link {{
                color: #38bdf8;
                text-decoration: none;
            }}
            .url-link:hover {{
                text-decoration: underline;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Recommendation API Service</h1>
                <p class="subtitle">Real-time inference server loaded with processed Amazon Cell Phones data</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <div class="card-value">{model_type.upper()}</div>
                    <div class="card-label">Active Model</div>
                </div>
                <div class="card">
                    <div class="card-value">{num_users}</div>
                    <div class="card-label">Trained Users</div>
                </div>
                <div class="card">
                    <div class="card-value">{num_items}</div>
                    <div class="card-label">Trained Items</div>
                </div>
            </div>

            <div class="panel">
                <h2>Interactive Real URL Test Cases</h2>
                <p>Click on the links below to test how the input flow results in output recommendations in your browser:</p>
                <ul>
                    <li>
                        <strong>Case 1: Existing User (Homepage Scenario - CF-based recommendation)</strong><br>
                        URL: <a class="url-link" href="/recommend?user_id=AFKZENTNBQ7A7V7UXW5JJI6UGRYQ&top_k=5" target="_blank">/recommend?user_id=AFKZENTNBQ7A7V7UXW5JJI6UGRYQ&top_k=5</a>
                    </li>
                    <li style="margin-top: 15px;">
                        <strong>Case 2: Existing User with Product Context (Product Page Scenario - Hybrid cb+cf)</strong><br>
                        URL: <a class="url-link" href="/recommend?user_id=AFKZENTNBQ7A7V7UXW5JJI6UGRYQ&context_item_id=B08L6L3X1S&top_k=5" target="_blank">/recommend?user_id=AFKZENTNBQ7A7V7UXW5JJI6UGRYQ&context_item_id=B08L6L3X1S&top_k=5</a>
                    </li>
                    <li style="margin-top: 15px;">
                        <strong>Case 3: New User (Cold Start Scenario - Popular items fallback)</strong><br>
                        URL: <a class="url-link" href="/recommend?user_id=new_testing_user_99&top_k=5" target="_blank">/recommend?user_id=new_testing_user_99&top_k=5</a>
                    </li>
                </ul>
            </div>

            <div class="panel">
                <h2>API Specifications</h2>
                <p><strong>POST Request Format (ProductionAdapter Target):</strong></p>
                <pre>POST http://localhost:8000/recommend
Content-Type: application/json

{{
  "user_id": "AFKZENTNBQ7A7V7UXW5JJI6UGRYQ",
  "context_item_id": "B08L6L3X1S",
  "top_k": 10
}}</pre>
                <p><strong>Response Format:</strong></p>
                <pre>{{
  "user_id": "AFKZENTNBQ7A7V7UXW5JJI6UGRYQ",
  "context_item_id": "B08L6L3X1S",
  "items": [
    {{ "item_id": "B08L6L3X1S", "score": 0.825 }},
    ...
  ],
  "latency_ms": 1.25,
  "status_code": 200
}}</pre>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content

@app.post("/register_item")
def register_item(payload: Dict[str, Any]):
    global model
    if not model:
        return {"status": "error", "message": "Model not loaded", "status_code": 503}
    item_id = payload.get("item_id")
    title = payload.get("title")
    categories = payload.get("categories", ["Cell Phones & Accessories"])
    brand = payload.get("brand", "Unknown")
    
    if not item_id or not title:
        return {"status": "error", "message": "item_id and title are required", "status_code": 400}
        
    if hasattr(model, "register_item"):
        model.register_item(item_id, title, categories, brand)
        return {"status": "success", "message": f"Registered item: {title}", "status_code": 200}
    else:
        return {"status": "error", "message": "Model does not support dynamic registration", "status_code": 500}

@app.post("/simulate_bot")
def simulate_bot(payload: Dict[str, Any]):
    global model
    if not model:
        return {"status": "error", "message": "Model not loaded", "status_code": 503}
        
    url = payload.get("url")
    clicks = payload.get("clicks", [])
    steps = payload.get("steps", 3)
    ab_bucket = payload.get("ab_bucket", "Both")
    
    if not url:
        return {"status": "error", "message": "url is required", "status_code": 400}
        
    simulator = BotSimulator(recommender_model=model, base_url="http://127.0.0.1:8000")
    result = simulator.run_simulation(
        amazon_url=url,
        clicks=clicks,
        steps=steps,
        ab_bucket=ab_bucket
    )
    return result

@app.get("/search", response_class=HTMLResponse)
def search_page(
    q: str = Query(..., description="Search query"),
    user_id: Optional[str] = "usr_demo",
    ab_bucket: Optional[str] = "B"
):
    import hashlib
    global model
    if not model:
        return HTMLResponse("<h1>Model not loaded</h1>", status_code=503)
        
    cb_model = getattr(model, "cb_model", model)
    search_query = q.lower().strip()
    search_words = [w for w in search_query.split() if w]
    
    results = []
    for item_id, features in cb_model.item_features.items():
        title = features.get("title", "")
        brand = features.get("brand", "")
        categories = features.get("categories", [])
        
        score = 0.0
        title_lower = title.lower()
        brand_lower = brand.lower()
        cats_lower = [c.lower() for c in categories]
        
        match_count = 0
        for w in search_words:
            if w in title_lower or w in brand_lower or any(w in cat for cat in cats_lower):
                match_count += 1
        if match_count > 0:
            score = match_count / len(search_words)
            results.append((item_id, title, brand, categories, score))
            
    results.sort(key=lambda x: x[4], reverse=True)
    
    if not results:
        # Register a dynamic product matching the query
        dynamic_id = f"B0DYN{hashlib.md5(search_query.encode('utf-8')).hexdigest()[:5].upper()}"
        brand = "Apple" if "iphone" in search_query else "Samsung" if "galaxy" in search_query else "Google" if "pixel" in search_query else "DynamicBrand"
        title = f"{q.title()} Premium Smartphone"
        categories = ["Cell Phones & Accessories", "Cell Phones"]
        
        cb_model.register_item(dynamic_id, title, categories, brand)
        if hasattr(model, "register_item"):
            model.register_item(dynamic_id, title, categories, brand)
            
        results.append((dynamic_id, title, brand, categories, 1.0))
        
    results_html = ""
    for r_id, r_title, r_brand, r_cats, r_score in results[:10]:
        short_title = r_title[:65] + "..." if len(r_title) > 65 else r_title
        results_html += f"""
        <div class="search-result-card" onclick="location.href='/product/{r_id}?user_id={user_id}&ab_bucket={ab_bucket}'">
            <div class="result-title">{short_title}</div>
            <div class="result-meta">Brand: {r_brand} | ASIN: {r_id}</div>
        </div>
        """
        
    html_content = f"""<!DOCTYPE html>
    <html>
    <head>
        <title>Search Results for '{q}'</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Outfit', sans-serif;
                background: linear-gradient(135deg, #0e1117 0%, #161a24 100%);
                color: #f3f4f6;
                margin: 0;
                padding: 30px;
                min-height: 100vh;
                box-sizing: border-box;
            }}
            .container {{
                max-width: 800px;
                margin: 0 auto;
            }}
            .back-btn {{
                display: inline-block;
                color: #38bdf8;
                text-decoration: none;
                margin-bottom: 20px;
                font-weight: 600;
            }}
            .back-btn:hover {{
                text-decoration: underline;
            }}
            h1 {{
                font-size: 1.8rem;
                margin-bottom: 20px;
                color: #38bdf8;
            }}
            .results-grid {{
                display: flex;
                flex-direction: column;
                gap: 15px;
            }}
            .search-result-card {{
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
            }}
            .search-result-card:hover {{
                transform: translateY(-2px);
                border-color: rgba(56, 189, 248, 0.4);
                box-shadow: 0 4px 15px rgba(56, 189, 248, 0.1);
            }}
            .result-title {{
                font-weight: 600;
                font-size: 1.1rem;
                color: #f3f4f6;
            }}
            .result-meta {{
                margin-top: 10px;
                font-size: 0.85rem;
                color: #94a3b8;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <a href="javascript:history.back()" class="back-btn">← Back</a>
            <h1>Search Results for '{q}'</h1>
            <div class="results-grid">
                {results_html}
            </div>
        </div>
    </body>
    </html>
    """
    return html_content

@app.get("/product/{item_id}", response_class=HTMLResponse)
def product_page(

    item_id: str,
    user_id: Optional[str] = "usr_demo",
    ab_bucket: Optional[str] = "B"
):
    global model
    if not model:
        return HTMLResponse("<h1>Model not loaded</h1>", status_code=503)
        
    # Get product features
    cb_model = getattr(model, "cb_model", model)
    features = cb_model.item_features.get(item_id, {
        "title": f"Amazon Product {item_id}",
        "brand": "Unknown",
        "categories": ["Cell Phones & Accessories"]
    })
    
    # Fetch recommendations
    boost_flag = (ab_bucket == "B")
    recs = model.recommend(
        user_id=user_id,
        context_item_id=item_id,
        top_k=10,
        accessory_boost=boost_flag,
        ab_bucket=ab_bucket
    )
    
    # Generate list HTML
    recs_html = ""
    for r in recs:
        r_id = r["item_id"]
        r_title = r.get("title", f"Product {r_id}")
        r_brand = r.get("brand", "Unknown")
        r_score = r.get("score", 0.0)
        short_title = r_title[:65] + "..." if len(r_title) > 65 else r_title
        
        recs_html += f"""
        <div class="rec-card" onclick="location.href='/product/{r_id}?user_id={user_id}&ab_bucket={ab_bucket}'">
            <div class="rec-badge">Score: {r_score:.2f}</div>
            <div class="rec-title">{short_title}</div>
            <div class="rec-meta">Brand: {r_brand} | ASIN: {r_id}</div>
        </div>
        """
        
    # Breadcrumbs session indicator
    is_bot = "bot" in user_id.lower()
    session_bar = ""
    if is_bot:
        session_bar = f"""
        <div class="session-indicator">
            <span class="pulse-dot"></span>
            <strong>Active Bot Session:</strong> <code>{user_id}</code> | <strong>A/B Bucket:</strong> Variant {ab_bucket}
        </div>
        """

    html_content = f"""<!DOCTYPE html>
    <html>
    <head>
        <title>{features['title']} - Product details</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Outfit', sans-serif;
                background: linear-gradient(135deg, #0e1117 0%, #161a24 100%);
                color: #f3f4f6;
                margin: 0;
                padding: 30px;
                min-height: 100vh;
                box-sizing: border-box;
            }}
            .container {{
                max-width: 1000px;
                margin: 0 auto;
            }}
            .back-btn {{
                display: inline-block;
                color: #38bdf8;
                text-decoration: none;
                margin-bottom: 20px;
                font-weight: 600;
            }}
            .back-btn:hover {{
                text-decoration: underline;
            }}
            .session-indicator {{
                background: rgba(168, 85, 247, 0.15);
                border: 1px solid rgba(168, 85, 247, 0.3);
                border-radius: 8px;
                padding: 10px 15px;
                margin-bottom: 20px;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 10px;
            }}
            .pulse-dot {{
                width: 8px;
                height: 8px;
                background-color: #a855f7;
                border-radius: 50%;
                box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7);
                animation: pulse 1.6s infinite;
            }}
            @keyframes pulse {{
                0% {{
                    transform: scale(0.95);
                    box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7);
                }}
                70% {{
                    transform: scale(1);
                    box-shadow: 0 0 0 8px rgba(168, 85, 247, 0);
                }}
                100% {{
                    transform: scale(0.95);
                    box-shadow: 0 0 0 0 rgba(168, 85, 247, 0);
                }}
            }}
            .product-layout {{
                display: grid;
                grid-template-columns: 350px 1fr;
                gap: 30px;
                background: rgba(30, 41, 59, 0.3);
                border-radius: 16px;
                padding: 30px;
                border: 1px solid rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(10px);
                margin-bottom: 40px;
            }}
            .phone-mockup {{
                width: 100%;
                height: 400px;
                background: #090d12;
                border-radius: 24px;
                border: 4px solid #475569;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
            }}
            .phone-screen {{
                width: 92%;
                height: 94%;
                background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
                border-radius: 18px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
                color: #94a3b8;
            }}
            .phone-camera {{
                position: absolute;
                top: 15px;
                width: 60px;
                height: 15px;
                background: #475569;
                border-radius: 10px;
            }}
            .details-section h1 {{
                font-size: 2.2rem;
                font-weight: 800;
                margin: 0 0 10px 0;
                color: #f3f4f6;
            }}
            .brand {{
                font-size: 1.1rem;
                color: #38bdf8;
                font-weight: 600;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }}
            .meta-item {{
                margin-bottom: 10px;
                font-size: 0.95rem;
                color: #94a3b8;
            }}
            .meta-item strong {{
                color: #f3f4f6;
            }}
            .category-tag {{
                display: inline-block;
                background: rgba(56, 189, 248, 0.1);
                color: #38bdf8;
                border: 1px solid rgba(56, 189, 248, 0.2);
                border-radius: 6px;
                padding: 4px 10px;
                font-size: 0.85rem;
                margin-top: 10px;
            }}
            .recs-section h2 {{
                font-size: 1.6rem;
                margin-bottom: 20px;
                background: linear-gradient(90deg, #38bdf8 0%, #a855f7 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }}
            .recs-grid {{
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }}
            .rec-card {{
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 15px;
                cursor: pointer;
                transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
                position: relative;
            }}
            .rec-card:hover {{
                transform: translateY(-2px);
                border-color: rgba(168, 85, 247, 0.4);
                box-shadow: 0 4px 15px rgba(168, 85, 247, 0.1);
            }}
            .rec-badge {{
                position: absolute;
                top: 15px;
                right: 15px;
                font-size: 0.75rem;
                background: rgba(168, 85, 247, 0.15);
                color: #a855f7;
                padding: 2px 6px;
                border-radius: 4px;
                border: 1px solid rgba(168, 85, 247, 0.2);
            }}
            .rec-title {{
                font-weight: 600;
                font-size: 0.95rem;
                margin-right: 70px;
                line-height: 1.4;
                color: #f3f4f6;
            }}
            .rec-meta {{
                margin-top: 10px;
                font-size: 0.8rem;
                color: #94a3b8;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <a href="/" class="back-btn">← Back to API Control Center</a>
            
            {session_bar}
            
            <form action="/search" method="get" class="search-form" style="margin-bottom: 25px; display: flex; gap: 10px;">
                <input type="hidden" name="user_id" value="{user_id}">
                <input type="hidden" name="ab_bucket" value="{ab_bucket}">
                <input type="text" name="q" placeholder="Search for another product..." required style="flex: 1; padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); color: white; font-family: inherit; font-size: 0.95rem;">
                <button type="submit" style="padding: 12px 24px; border-radius: 8px; border: none; background: linear-gradient(90deg, #38bdf8 0%, #a855f7 100%); color: white; cursor: pointer; font-weight: 600; font-family: inherit;">Search</button>
            </form>
            
            <div class="product-layout">
                <div class="phone-mockup">
                    <div class="phone-camera"></div>
                    <div class="phone-screen">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                            <line x1="12" y1="18" x2="12.01" y2="18"></line>
                        </svg>
                        <p style="margin-top:15px;font-size:0.9rem;">{features['brand'] or 'Amazon'}</p>
                    </div>
                </div>
                
                <div class="details-section">
                    <div class="brand">{features['brand']}</div>
                    <h1>{features['title']}</h1>
                    <div class="category-tag">{features['categories'][-1] if features['categories'] else 'Cell Phones'}</div>
                    
                    <div style="margin-top: 30px;">
                        <div class="meta-item"><strong>Product ASIN:</strong> <code>{item_id}</code></div>
                        <div class="meta-item"><strong>Target User:</strong> <code>{user_id}</code></div>
                        <div class="meta-item"><strong>A/B Config:</strong> Variant {ab_bucket} ({'Accessory Boost Enabled' if boost_flag else 'Standard Recommendations'})</div>
                    </div>
                </div>
            </div>
            
            <div class="recs-section">
                <h2>Recommended Products for You</h2>
                <div class="recs-grid">
                    {recs_html or '<p>No recommendations generated.</p>'}
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
