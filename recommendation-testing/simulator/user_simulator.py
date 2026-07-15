import uuid
from typing import Dict, Any, List

class UserSimulator:
    """Manages active user profiles, cookies, and session state simulations."""

    def __init__(self, user_id: str = None, segment: str = "general"):
        self.user_id = user_id or f"usr_{uuid.uuid4().hex[:8]}"
        self.segment = segment
        self.session_id = f"sess_{uuid.uuid4().hex[:12]}"
        self.cookies = {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "segment": self.segment
        }
        self.history: List[str] = []

    def visit_item(self, item_id: str):
        """Simulates viewing a product page."""
        self.history.append(item_id)

    def get_session_context(self) -> Dict[str, Any]:
        """Returns the current state dictionary of the simulator."""
        return {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "segment": self.segment,
            "cookies": self.cookies,
            "history": self.history
        }

    @staticmethod
    def generate_batch(count: int, segments: List[str] = None) -> List['UserSimulator']:
        """Generates a batch of simulated users."""
        if not segments:
            segments = ["general", "apple_fan", "samsung_fan", "cold_start"]
            
        users = []
        for i in range(count):
            seg = segments[i % len(segments)]
            users.append(UserSimulator(segment=seg))
        return users
