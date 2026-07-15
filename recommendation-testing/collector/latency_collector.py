from typing import List, Dict, Any
import numpy as np

class LatencyCollector:
    """Monitors, tracks, and reports response latencies, timeouts, and API errors."""

    def __init__(self):
        self.latencies: List[float] = []
        self.errors: List[Dict[str, Any]] = []
        self.timeouts_count: int = 0

    def record_latency(self, duration_ms: float):
        """Records a successful response latency."""
        self.latencies.append(duration_ms)

    def record_error(self, user_id: str, error_msg: str, status_code: int = 500):
        """Records an API call error."""
        self.errors.append({
            "user_id": user_id,
            "error": error_msg,
            "status_code": status_code
        })

    def record_timeout(self):
        """Increments timeout counter."""
        self.timeouts_count += 1

    def get_stats(self) -> Dict[str, Any]:
        """Computes latency stats (min, max, average, p95, p99)."""
        if not self.latencies:
            return {
                "count": 0,
                "mean_ms": 0.0,
                "p50_ms": 0.0,
                "p95_ms": 0.0,
                "p99_ms": 0.0,
                "errors_count": len(self.errors),
                "timeouts_count": self.timeouts_count
            }

        arr = np.array(self.latencies)
        return {
            "count": len(self.latencies),
            "mean_ms": float(np.mean(arr)),
            "p50_ms": float(np.percentile(arr, 50)),
            "p95_ms": float(np.percentile(arr, 95)),
            "p99_ms": float(np.percentile(arr, 99)),
            "errors_count": len(self.errors),
            "timeouts_count": self.timeouts_count
        }

    def clear(self):
        self.latencies = []
        self.errors = []
        self.timeouts_count = 0
ClassSymbolLink = "[LatencyCollector](file:///c:/Users/ADMIN/OneDrive/M%C3%A1y%20t%C3%ADnh/recsAmazon/recommendation-testing/collector/latency_collector.py#L4)"
