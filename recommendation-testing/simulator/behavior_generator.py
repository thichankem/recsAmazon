from typing import List, Dict, Any
from simulator.user_simulator import UserSimulator
from utils.random import get_random_choice

class BehaviorGenerator:
    """Generates specific consumer behavior profiles and click paths."""

    def __init__(self):
        # Mappings of segments to typical product categories and item keywords
        self.segment_items = {
            "apple_fan": ["iphone_15", "ipad_pro", "macbook_air", "airpods_max", "apple_watch"],
            "samsung_fan": ["galaxy_s24", "galaxy_tab", "galaxy_book", "galaxy_buds", "galaxy_watch"],
            "gamer": ["rtx_4090", "playstation_5", "xbox_series_x", "gaming_keyboard", "steam_deck"],
            "general": ["coffee_maker", "running_shoes", "backpack", "desk_lamp", "water_bottle"]
        }

    def generate_clickstream(self, user: UserSimulator, steps: int = 3) -> List[Dict[str, Any]]:
        """
        Generates a sequence of simulated actions (clicks, views) for a user.
        
        Returns:
            A list of dictionary actions.
        """
        actions = []
        segment = user.segment if user.segment in self.segment_items else "general"
        available_items = self.segment_items[segment]

        for step in range(steps):
            # Select item based on preference
            item = get_random_choice(available_items)
            user.visit_item(item)
            
            # Action type
            action_type = "view" if step < steps - 1 else get_random_choice(["view", "click_recommendation", "add_to_cart"])
            
            actions.append({
                "step": step + 1,
                "user_id": user.user_id,
                "session_id": user.session_id,
                "item_id": item,
                "action": action_type,
                "url": f"http://localhost:8000/product/{item}"
            })
        return actions
