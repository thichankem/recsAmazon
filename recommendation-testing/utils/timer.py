import time
from typing import Optional

class Timer:
    """A context manager to measure code block execution duration."""
    
    def __init__(self, description: str = "Execution"):
        self.description = description
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.elapsed: Optional[float] = None

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.perf_counter()
        self.elapsed = self.end_time - self.start_time
        # Return False to let any exception propagate

    def get_duration_ms(self) -> float:
        if self.elapsed is not None:
            return self.elapsed * 1000.0
        if self.start_time is not None:
            return (time.perf_counter() - self.start_time) * 1000.0
        return 0.0
