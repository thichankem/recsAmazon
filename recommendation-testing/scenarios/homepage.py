from typing import List, Dict, Any
from adapters.base_adapter import BaseAdapter

class HomepageScenario:
    """Kịch bản kiểm thử Trang chủ (Homepage testing scenario)"""

    def __init__(self):
        self.name = "homepage_scenario"
        self.description = "Test homepage recommendation for existing users (no product context)"

    def execute(self, adapter: BaseAdapter, users: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Executes homepage scenario queries.
        
        Args:
            adapter: Recommender adapter to call.
            users: List of user dicts containing 'user_id' and history metadata.
            
        Returns:
            A list of query results.
        """
        results = []
        for user in users:
            user_id = user.get("user_id")
            if not user_id:
                continue
                
            # Query recommendation without context item
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
