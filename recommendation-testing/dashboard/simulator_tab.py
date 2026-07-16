import streamlit as st
import requests
import pandas as pd

def render_simulator_tab():
    """Renders the Playwright Bot Simulation & A/B/Pentesting tab in Streamlit."""
    
    st.markdown("""
    <div style="background: rgba(30, 41, 59, 0.45); padding: 20px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 25px;">
        <h3 style="margin: 0; color: #38bdf8; font-weight: 800;">Real URL Context & Playwright Bot Simulator</h3>
        <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 0.95rem;">
            Test the recommendation pipeline by parsing real Amazon URLs, generating click sequences, and executing bot testing for A/B analysis and security robustness.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # 1. Inputs
    st.markdown("#### 1. Simulation Setup")
    col_left, col_right = st.columns(2)
    
    with col_left:
        amazon_url = st.text_input(
            "Product or Search URL (Amazon, FPTShop, etc.)",
            value="https://www.amazon.com/Apple-iPhone-15-Pro-128GB/dp/B0CHX35DNY",
            help="Paste any Amazon product or other search/product links."
        )
        
        click_seq_str = st.text_input(
            "Bot Click Path Keywords (Comma separated)",
            value="iphone 17, iphone 16, iphone 15",
            help="Simulates bot navigating pages matching these keywords sequentially."
        )
        clicks = [c.strip() for c in click_seq_str.split(",") if c.strip()]
        
    with col_right:
        ab_option = st.selectbox(
            "A/B Bucket Configuration",
            options=["Both (Compare Side-by-Side)", "A (Control - Standard Hybrid)", "B (Treatment - Accessory Boosted)"]
        )
        bucket_mapping = {
            "Both (Compare Side-by-Side)": "Both",
            "A (Control - Standard Hybrid)": "A",
            "B (Treatment - Accessory Boosted)": "B"
        }
        ab_bucket = bucket_mapping[ab_option]
        
        st.markdown("""
        <div style="background: rgba(56, 189, 248, 0.08); padding: 15px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.2); font-size: 0.9rem; color: #94a3b8; margin-top: 10px;">
            💡 <b>A/B Testing simulation:</b><br/>
            - <b>Variant A (Control):</b> Uses standard collaborative and content filtering.<br/>
            - <b>Variant B (Treatment):</b> Activates <b>Accessory Boost</b> to prioritize compatible accessories (cases, screen protectors) based on the user's click path.
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    
    # 2. Run simulation
    if st.button("🚀 Execute Playwright Bot Simulation", use_container_width=True):
        api_url = "http://127.0.0.1:8000/simulate_bot"
        
        with st.spinner("🤖 Launching Playwright browser sessions and parsing context..."):
            try:
                # Fire request to FastAPI
                payload = {
                    "url": amazon_url,
                    "clicks": clicks,
                    "ab_bucket": ab_bucket
                }
                response = requests.post(api_url, json=payload, timeout=45)
                
                if response.status_code == 200:
                    data = response.json()
                    st.success("Simulation finished successfully!")
                    
                    st.markdown("---")
                    st.markdown("#### 2. Extracted URL Context")
                    ctx = data.get("scraped_context", {})
                    
                    # Display context cards
                    c1, c2, c3, c4 = st.columns(4)
                    with c1:
                        st.markdown(f'<div class="metric-card"><div class="metric-val" style="font-size:1.1rem;word-break:break-all;">{ctx.get("item_id") or "N/A"}</div><div class="metric-lbl">Extracted ASIN</div></div>', unsafe_allow_html=True)
                    with c2:
                        st.markdown(f'<div class="metric-card"><div class="metric-val" style="font-size:1.1rem;">{ctx.get("page_type").upper()}</div><div class="metric-lbl">Page Type</div></div>', unsafe_allow_html=True)
                    with c3:
                        st.markdown(f'<div class="metric-card"><div class="metric-val" style="font-size:1.1rem;">{ctx.get("brand") or "Unknown"}</div><div class="metric-lbl">Brand</div></div>', unsafe_allow_html=True)
                    with c4:
                        status_msg = "SUCCESS (Scraped)" if ctx.get("scraped_successfully") else "FALLBACK (URL parsed)"
                        st.markdown(f'<div class="metric-card"><div class="metric-val" style="font-size:1.1rem;">{status_msg}</div><div class="metric-lbl">Extraction Mode</div></div>', unsafe_allow_html=True)
                    
                    st.markdown(f"**Extracted Title:** `{ctx.get('title')}`")
                    st.markdown(f"**Categories:** `{' > '.join(ctx.get('categories', []))}`")
                    
                    # Show logs
                    st.markdown("#### 3. Live Bot Playwright Terminal Logs")
                    variants = data.get("variants", {})
                    
                    # Log tabs for variants
                    log_tabs = st.tabs([f"Variant {k} Logs" for k in variants.keys()])
                    for idx, (bucket_name, details) in enumerate(variants.items()):
                        with log_tabs[idx]:
                            log_text = "\n".join(details.get("logs", []))
                            st.code(log_text, language="bash")
                            
                    # Show A/B Comparison
                    st.markdown("#### 4. A/B Testing Recommendation Output (Top 10 Products)")
                    
                    # Table side-by-side
                    comp_cols = st.columns(len(variants))
                    for idx, (bucket_name, details) in enumerate(variants.items()):
                        with comp_cols[idx]:
                            label = "Variant A (Control - Standard CF/CB)" if bucket_name == "A" else "Variant B (Treatment - Accessory-Boosted)"
                            st.markdown(f"##### **{label}**")
                            
                            recs = details.get("recommendations", [])
                            if recs:
                                df_recs = []
                                for idx_r, r in enumerate(recs):
                                    df_recs.append({
                                        "Rank": idx_r + 1,
                                        "Product Title": r.get("title", f"Product {r['item_id']}"),
                                        "ASIN": r['item_id'],
                                        "Brand": r.get("brand", "Unknown"),
                                        "Affinity Score": round(r["score"], 4)
                                    })
                                df = pd.DataFrame(df_recs)
                                st.dataframe(df, use_container_width=True, hide_index=True)
                            else:
                                st.warning("No recommendations returned.")
                                
                    # 5. Recommendation Relevance & Compatibility Scorecard
                    st.markdown("---")
                    st.markdown("#### 5. Recommendation Relevance & Compatibility Scorecard (Chấm Điểm Hệ Gợi Ý)")
                    score_cols = st.columns(len(variants))
                    for idx, (bucket_name, details) in enumerate(variants.items()):
                        with score_cols[idx]:
                            label = "Variant A (Control)" if bucket_name == "A" else "Variant B (Treatment)"
                            score = details.get("relevance_score", 0.0)
                            assessment = details.get("assessment", "No details available.")
                            
                            # Premium styling for score card
                            text_color = "#ef4444" if score < 40 else "#38bdf8" if score < 75 else "#22c55e"
                            st.markdown(f"""
                            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 15px;">
                                <h5 style="margin: 0 0 10px 0; color: #94a3b8; font-size: 0.95rem;">{label} Relevance Score</h5>
                                <div style="font-size: 2.8rem; font-weight: 800; color: {text_color}; line-height: 1;">{int(score)}/100</div>
                                <div style="margin-top: 15px; font-size: 0.9rem; color: #f3f4f6;">
                                    <b>Assessment:</b> {assessment}
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                            
                            st.progress(int(score) / 100.0)
                                
                else:
                    st.error(f"Server returned error code: {response.status_code}")
                    st.text(response.text)
                    
            except Exception as e:
                st.error("Could not connect to the recommendation API server.")
                st.info("Please make sure the backend server is running on port 8000 by running: `python recommendation-testing/server.py` in your terminal.")
                st.code(str(e))
