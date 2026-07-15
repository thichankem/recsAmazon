from typing import List, Dict, Any
from adapters.base_adapter import BaseAdapter

class ProductPageScenario:
    """Kịch bản kiểm thử Trang chi tiết sản phẩm (Product detail page testing scenario)"""

    def __init__(self):
        self.name = "product_page_scenario"
        self.description = "Test product page recommendation with user and product context"

    def execute(self, adapter: BaseAdapter, test_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Executes product page scenario queries.
        
        Args:
            adapter: Recommender adapter to call.
            test_cases: List of dicts containing 'user_id' and 'context_item_id'.
            
        Returns:
            A list of query results.
        """
        results = []
        for case in test_cases:
            user_id = case.get("user_id")
            context_item_id = case.get("context_item_id")
            if not user_id or not context_item_id:
                continue

            res = adapter.get_recommendations(user_id=user_id, context_item_id=context_item_id)
            results.append({
                "scenario": self.name,
                "user_id": user_id,
                "context_item_id": context_item_id,
                "recommendations": res.get("items", []),
                "latency_ms": res.get("latency_ms", 0.0),
                "status_code": res.get("status_code", 200),
                "error": res.get("error")
            })
        return results
