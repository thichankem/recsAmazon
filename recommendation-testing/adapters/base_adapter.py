from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseAdapter(ABC):
    """Base interface for recommendation service adapters."""

    @abstractmethod
    def get_recommendations(self, user_id: str, context_item_id: str = None, top_k: int = 10) -> Dict[str, Any]:
        """
        Retrieves recommendations for a scenario query.
        
        Returns:
            A dictionary containing:
            - "items": List[Dict[str, Any]] (recommendations)
            - "latency_ms": float (duration in ms)
            - "status_code": int (http status or local 200 code)
            - "error": str (error message if failed, else None)
        """
        pass
