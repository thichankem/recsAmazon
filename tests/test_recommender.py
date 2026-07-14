import os
import json
import sqlite3
import time
import pytest
from src.service_online import OnlineRecommenderService

# Test configuration
TEST_DB_PATH = "db/test_recommendations.db"
SCHEMA_PATH = "db/schema.sql"

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    """Initializes the test database with mock records before running tests."""
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    db_dir = os.path.dirname(TEST_DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
        
    # Load schema
    conn = sqlite3.connect(TEST_DB_PATH)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    
    # Populate mock data
    cursor = conn.cursor()
    
    # Mock user history (Layer 1 prep)
    cursor.execute(
        "INSERT INTO user_history (user_id, items) VALUES (?, ?)",
        ("user_old_1", json.dumps(["prod_hist_1"]))
    )
    
    # Mock item similarities
    cursor.execute(
        "INSERT INTO item_similarities (item_id, similar_items) VALUES (?, ?)",
        ("prod_hist_1", json.dumps([["prod_svd_1", 0.9], ["prod_svd_2", 0.8], ["prod_svd_3", 0.7]]))
    )
    
    # Mock item metadata category mapping
    cursor.execute(
        "INSERT INTO item_metadata (item_id, category) VALUES (?, ?)",
        ("prod_hist_1", "Electronics")
    )
    
    # Mock category top rated (Layer 2)
    cursor.execute(
        "INSERT INTO category_top_rated (category, top_items) VALUES (?, ?)",
        ("Electronics", json.dumps(["prod_elec_1", "prod_elec_2", "prod_elec_3", "prod_elec_4"]))
    )
    
    # Mock global top rated (Layer 3)
    cursor.execute(
        "INSERT INTO global_top_rated (id, top_items) VALUES (?, ?)",
        (1, json.dumps(["prod_global_1", "prod_global_2", "prod_global_3", "prod_global_4", "prod_global_5", "prod_global_6", "prod_global_7"]))
    )
    
    conn.commit()
    conn.close()
    
    yield
    
    # Clean up test database
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
            if os.path.exists(TEST_DB_PATH + "-wal"):
                os.remove(TEST_DB_PATH + "-wal")
            if os.path.exists(TEST_DB_PATH + "-shm"):
                os.remove(TEST_DB_PATH + "-shm")
        except Exception as e:
            print(f"Error removing test db files: {e}")

def test_layered_recommendations_cold_start():
    """Tests the 3-layer Cold-start defense strategy."""
    service = OnlineRecommenderService(db_path=TEST_DB_PATH)
    
    res_old = service.get_recommendations(user_id="user_old_1", limit=10)
    res_layer_1_items = res_old["recommendations"]
    assert res_layer_1_items
    assert len(res_layer_1_items) == 10
    # Checking SVD recommendations are present
    assert "prod_svd_1" in res_layer_1_items
    assert "prod_svd_2" in res_layer_1_items
    assert "prod_svd_3" in res_layer_1_items
    # Padding checked
    assert "prod_global_1" in res_layer_1_items
    assert res_old["layer_used"] == 1
    
    # Layer 2: New User with Category Context (Electronics)
    res_new_cat = service.get_recommendations(user_id="user_new_1", category_context="Electronics")
    assert res_new_cat["layer_used"] == 2
    assert "prod_elec_1" in res_new_cat["recommendations"]
    
    # Layer 3: New User, Homepage (No Context)
    res_new_none = service.get_recommendations(user_id="user_new_2")
    assert res_new_none["layer_used"] == 3
    assert "prod_global_1" in res_new_none["recommendations"]

def test_online_serving_latency():
    """Verifies that the recommendation endpoint latency is strictly under 2ms."""
    service = OnlineRecommenderService(db_path=TEST_DB_PATH)
    user = "user_old_1"
    
    # Warm-up call
    service.get_recommendations(user_id=user)
    
    # Run 100 queries and check average latency
    latencies = []
    for _ in range(100):
        t_start = time.perf_counter()
        service.get_recommendations(user_id=user)
        t_end = time.perf_counter()
        latencies.append((t_end - t_start) * 1000.0)
        
    avg_latency = sum(latencies) / len(latencies)
    print(f"\nAverage static test serving latency: {avg_latency:.4f} ms")
    
    # Assertion: Latency must be < 2ms (Static serving should be < 0.5ms)
    assert avg_latency < 2.0, f"Average latency is {avg_latency:.2f}ms, which exceeds the 2ms threshold!"
