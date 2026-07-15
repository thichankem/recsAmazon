import streamlit as st
import pandas as pd

def render_model_comparison(all_results: dict):
    """Renders tabular and graphical comparison between all model benchmark results."""
    if not all_results:
        st.info("No experiment results found for comparison.")
        return

    # Build comparison dataframe
    data = []
    for exp_name, res in all_results.items():
        scores = res.get("scores", {})
        latency = res.get("latency_stats", {})
        data.append({
            "Experiment": exp_name,
            "Precision": scores.get("precision", 0.0),
            "Recall": scores.get("recall", 0.0),
            "NDCG": scores.get("ndcg", 0.0),
            "Hit Rate": scores.get("hit_rate", 0.0),
            "Diversity": scores.get("diversity", 0.0),
            "Mean Latency (ms)": latency.get("mean_ms", 0.0),
            "p95 Latency (ms)": latency.get("p95_ms", 0.0),
            "Errors": latency.get("errors_count", 0),
            "Timeouts": latency.get("timeouts_count", 0)
        })

    df = pd.DataFrame(data)
    df_styled = df.set_index("Experiment")
    
    st.dataframe(
        df_styled.style.highlight_max(subset=["Precision", "Recall", "NDCG", "Hit Rate", "Diversity"], color="#1e3a8a")
                  .highlight_min(subset=["Mean Latency (ms)", "p95 Latency (ms)"], color="#1e3a8a"),
        use_container_width=True
    )
    
    st.markdown("#### Graphical Comparison")
    metric_cols = ["Precision", "Recall", "NDCG", "Diversity"]
    selected_metrics = st.multiselect("Select metrics to plot:", metric_cols, default=metric_cols)
    
    if selected_metrics:
        # Transpose/melt for plotting or use simple streamlit multi-line/bar chart
        chart_df = df[["Experiment"] + selected_metrics].set_index("Experiment")
        st.bar_chart(chart_df, height=350)
