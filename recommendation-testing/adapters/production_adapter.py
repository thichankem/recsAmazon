import urllib.request
import urllib.error
import json
from typing import Dict, Any
from .base_adapter import BaseAdapter
from utils.timer import Timer

class ProductionAdapter(BaseAdapter):
    """Adapter that communicates with a live recommendation production API over HTTP."""

    def __init__(self, api_url: str, timeout_ms: int = 5000):
        self.api_url = api_url
        self.timeout_seconds = timeout_ms / 1000.0

    def get_recommendations(self, user_id: str, context_item_id: str = None, top_k: int = 10) -> Dict[str, Any]:
        result = {
            "items": [],
            "latency_ms": 0.0,
            "status_code": 0,
            "error": None
        }

        # Build payload
        payload = {
            "user_id": user_id,
            "top_k": top_k
        }
        if context_item_id:
            payload["context_item_id"] = context_item_id

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.api_url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        timer = Timer()
        try:
            with timer:
                with urllib.request.urlopen(req, timeout=self.timeout_seconds) as response:
                    res_body = response.read().decode("utf-8")
                    result["status_code"] = response.status
                    
                    # Assuming response has a list of items under "recommendations" or "items"
                    parsed = json.loads(res_body)
                    result["items"] = parsed.get("items", parsed.get("recommendations", []))
            
            result["latency_ms"] = timer.get_duration_ms()
        except urllib.error.HTTPError as e:
            result["status_code"] = e.code
            result["error"] = f"HTTP Error: {e.reason}"
            result["latency_ms"] = timer.get_duration_ms()
        except urllib.error.URLError as e:
            result["status_code"] = 503
            result["error"] = f"Connection Error: {e.reason}"
            result["latency_ms"] = timer.get_duration_ms()
        except Exception as e:
            result["status_code"] = 500
            result["error"] = f"Unexpected Error: {str(e)}"
            result["latency_ms"] = timer.get_duration_ms()

        return result
