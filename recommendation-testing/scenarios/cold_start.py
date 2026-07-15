from typing import List, Dict, Any
from adapters.base_adapter import BaseAdapter

class ColdStartScenario:
    """Kịch bản kiểm thử User mới / Cold Start (Cold-start testing scenario)"""

    def __init__(self):
        self.name = "cold_start_scenario"
        self.description = "Test cold-start recommendation for brand-new users (no history)"

    def execute(self, adapter: BaseAdapter, new_users: List[str]) -> List[Dict[str, Any]]:
        """
        Executes cold start queries.
        
        Args:
            adapter: Recommender adapter to call.
            new_users: List of user IDs that are new to the system.
            
        Returns:
            A list of query results.
        """
        results = []
        for user_id in new_users:
            res = adapter.get_recommendations(user_id=user_id, context_item_id=None)
            results.append({
                "scenario": self.name,
                "user_id": user_id,
                "context_item_id": None,
                "recommendations": res.get("items", []),
                "latency_ms": res.get("latency_ms", 0.0),
                "status_code": res.get("status_code", 200),
                "error": res.get("error")
            })
        return results
