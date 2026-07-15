import streamlit as st
import pandas as pd

def render_recommendation_explorer(result: dict):
    """Renders user-by-user recommendation lists, scores, and scenario details."""
    raw_records = result.get("raw_records", [])
    
    if not raw_records:
        st.info("No query logs or raw records found for this experiment.")
        return

    # Filter control
    st.markdown("#### Navigation & Inspection Filters")
    col1, col2 = st.columns(2)
    
    scenarios_list = list(set([r.get("scenario", "unknown") for r in raw_records]))
    with col1:
        selected_scenario = st.selectbox("Filter by Scenario", ["All"] + scenarios_list)
        
    filtered_records = raw_records
    if selected_scenario != "All":
        filtered_records = [r for r in raw_records if r.get("scenario") == selected_scenario]

    user_ids = [r.get("user_id") for r in filtered_records]
    with col2:
        selected_user = st.selectbox("Inspect Recommendations for User", user_ids)

    # Find selected record
    record = next((r for r in filtered_records if r.get("user_id") == selected_user), None)
    
    if record:
        st.markdown(f"**Scenario Context:** `{record.get('scenario')}` | **Context Item:** `{record.get('context_item_id') or 'None'}`")
        
        # Display recommendations
        recs = record.get("recommendations", [])
        if recs:
            # Check if list of dict or list of str
            if isinstance(recs[0], dict):
                df = pd.DataFrame(recs)
            else:
                # Mock scoring if it's a list of IDs only
                df = pd.DataFrame({
                    "Rank": range(1, len(recs) + 1),
                    "Item ID": recs,
                    "Mock Score": [round(1.0 / i, 4) for i in range(1, len(recs) + 1)]
                })
            
            st.markdown("##### Output Recommendation List:")
            st.dataframe(df, use_container_width=True)
        else:
            st.warning("Empty recommendation list returned.")
    else:
        st.warning("No logs match the current selection.")
