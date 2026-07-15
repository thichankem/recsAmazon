import streamlit as st
import json
from pathlib import Path
from charts import render_latency_chart, render_metric_comparison
from comparison import render_model_comparison
from explorer import render_recommendation_explorer

# Apply custom premium styling via markdown
st.set_page_config(
    page_title="Recommendation Benchmarking Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom premium styling
st.markdown("""
<style>
    /* CSS System Styling */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Outfit', sans-serif;
    }
    
    .stApp {
        background: linear-gradient(135deg, #0e1117 0%, #161a24 100%);
        color: #f3f4f6;
    }
    
    /* Header card styled with gradient border */
    .header-card {
        background: rgba(30, 41, 59, 0.45);
        border-radius: 16px;
        padding: 24px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        margin-bottom: 25px;
    }
    
    .header-title {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(90deg, #38bdf8 0%, #a855f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0 0 10px 0;
    }
    
    .header-subtitle {
        color: #94a3b8;
        font-size: 1rem;
        margin: 0;
    }
    
    /* Metric boxes */
    .metric-card {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        text-align: center;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .metric-card:hover {
        transform: translateY(-2px);
        border-color: rgba(56, 189, 248, 0.4);
        box-shadow: 0 4px 20px rgba(56, 189, 248, 0.15);
    }
    
    .metric-val {
        font-size: 2.0rem;
        font-weight: 700;
        color: #38bdf8;
    }
    
    .metric-lbl {
        color: #94a3b8;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 5px;
    }
</style>
""", unsafe_allow_html=True)

# App header
st.markdown("""
<div class="header-card">
    <h1 class="header-title">Recommendation Performance Center</h1>
    <p class="header-subtitle">Evaluate, compare, and optimize Recommendation Engine pipelines (Cold-Start, Homepage, and Product views)</p>
</div>
""", unsafe_allow_html=True)

# Helper to load benchmark results from reports or fallback to mock
def load_latest_results():
    reports_dir = Path("recommendation-testing/reports")
    # If the testing directory path doesn't match, try local directory
    if not reports_dir.exists():
        reports_dir = Path("reports")
    
    json_reports = list(reports_dir.glob("**/report.json"))
    
    results = {}
    for r_path in json_reports:
        try:
            with open(r_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                results[data.get("experiment_name", r_path.parent.name)] = data
        except Exception:
            pass
            
    # Mock data if no reports are found
    if not results:
        results = {
            "exp_baseline_001": {
                "experiment_name": "exp_baseline_001",
                "total_execution_time_ms": 1420.5,
                "scores": {
                    "precision": 0.4250,
                    "recall": 0.3800,
                    "ndcg": 0.4120,
                    "hit_rate": 0.7500,
                    "diversity": 0.8200
                },
                "latency_stats": {
                    "count": 12,
                    "mean_ms": 12.4,
                    "p50_ms": 10.2,
                    "p95_ms": 24.5,
                    "p99_ms": 32.1,
                    "errors_count": 0,
                    "timeouts_count": 0
                },
                "raw_records": [
                    {"user_id": "usr_alpha", "scenario": "homepage_scenario", "item_ids": ["item_1", "item_3", "item_5"]},
                    {"user_id": "usr_beta", "scenario": "product_page_scenario", "item_ids": ["item_2", "item_4", "item_6"]}
                ]
            },
            "exp_collaborative_002": {
                "experiment_name": "exp_collaborative_002",
                "total_execution_time_ms": 1850.2,
                "scores": {
                    "precision": 0.4850,
                    "recall": 0.4400,
                    "ndcg": 0.4680,
                    "hit_rate": 0.8200,
                    "diversity": 0.6500
                },
                "latency_stats": {
                    "count": 12,
                    "mean_ms": 18.2,
                    "p50_ms": 15.1,
                    "p95_ms": 35.2,
                    "p99_ms": 48.0,
                    "errors_count": 0,
                    "timeouts_count": 0
                },
                "raw_records": [
                    {"user_id": "usr_alpha", "scenario": "homepage_scenario", "item_ids": ["item_1", "item_2", "item_9"]},
                    {"user_id": "usr_beta", "scenario": "product_page_scenario", "item_ids": ["item_2", "item_3", "item_7"]}
                ]
            }
        }
    return results

all_results = load_latest_results()

# Sidebar Setup
st.sidebar.markdown("<h2 style='color:#38bdf8; font-weight:800;'>Benchmarking Control</h2>", unsafe_allow_html=True)
selected_tab = st.sidebar.radio("Navigation", ["Overview Metrics", "Model Comparison", "Recommendation Explorer"])

if selected_tab == "Overview Metrics":
    st.markdown("### Active Experiment Summary")
    exp_names = list(all_results.keys())
    active_exp = st.sidebar.selectbox("Select Active Experiment", exp_names)
    
    res = all_results[active_exp]
    scores = res.get("scores", {})
    latency = res.get("latency_stats", {})
    
    # Render layout metrics card
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.markdown(f'<div class="metric-card"><div class="metric-val">{scores.get("precision", 0.0):.4f}</div><div class="metric-lbl">Precision@10</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="metric-card"><div class="metric-val">{scores.get("recall", 0.0):.4f}</div><div class="metric-lbl">Recall@10</div></div>', unsafe_allow_html=True)
    with col3:
        st.markdown(f'<div class="metric-card"><div class="metric-val">{scores.get("ndcg", 0.0):.4f}</div><div class="metric-lbl">NDCG@10</div></div>', unsafe_allow_html=True)
    with col4:
        st.markdown(f'<div class="metric-card"><div class="metric-val">{scores.get("diversity", 0.0):.4f}</div><div class="metric-lbl">Diversity</div></div>', unsafe_allow_html=True)
    with col5:
        st.markdown(f'<div class="metric-card"><div class="metric-val">{latency.get("mean_ms", 0.0):.1f}ms</div><div class="metric-lbl">Avg Latency</div></div>', unsafe_allow_html=True)
        
    st.markdown("<br>", unsafe_allow_html=True)
    
    c_left, c_right = st.columns(2)
    with c_left:
        st.markdown("#### Quality Metrics Distribution")
        render_metric_comparison(res)
    with c_right:
        st.markdown("#### Latency SLA Statistics")
        render_latency_chart(res)

elif selected_tab == "Model Comparison":
    st.markdown("### Side-by-Side Model Comparison")
    render_model_comparison(all_results)

elif selected_tab == "Recommendation Explorer":
    st.markdown("### User-Level Recommendation Explorer")
    exp_names = list(all_results.keys())
    selected_exp = st.sidebar.selectbox("Experiment Explorer", exp_names)
    
    render_recommendation_explorer(all_results[selected_exp])
