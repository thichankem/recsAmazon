import streamlit as st
import pandas as pd

def render_latency_chart(result: dict):
    """Renders a bar chart showing the latency percentiles (p50, p95, p99)."""
    latency = result.get("latency_stats", {})
    
    # Format into DataFrame for charting
    df = pd.DataFrame({
        "Percentile": ["p50 (Median)", "p95", "p99", "Mean"],
        "Latency (ms)": [
            latency.get("p50_ms", 0.0),
            latency.get("p95_ms", 0.0),
            latency.get("p99_ms", 0.0),
            latency.get("mean_ms", 0.0)
        ]
    })
    
    df = df.set_index("Percentile")
    st.bar_chart(df, height=300)

def render_metric_comparison(result: dict):
    """Renders a radar-like or bar chart showing the quality metrics."""
    scores = result.get("scores", {})
    
    df = pd.DataFrame({
        "Metric": ["Precision", "Recall", "NDCG", "Hit Rate", "Diversity"],
        "Score": [
            scores.get("precision", 0.0),
            scores.get("recall", 0.0),
            scores.get("ndcg", 0.0),
            scores.get("hit_rate", 0.0),
            scores.get("diversity", 0.0)
        ]
    })
    
    df = df.set_index("Metric")
    st.bar_chart(df, color="#a855f7", height=300)
