import random
import numpy as np

def set_seed(seed: int):
    """Sets the random seed for Python random and NumPy."""
    random.seed(seed)
    np.random.seed(seed)

def get_random_choice(items: list, seed: int = None):
    """Chooses a random element from a list, optionally with a temporary seed context."""
    if seed is not None:
        state = random.getstate()
        random.seed(seed)
        result = random.choice(items)
        random.setstate(state)
        return result
    return random.choice(items)

def generate_random_user_interactions(user_ids: list, item_ids: list, num_samples: int = 100) -> list:
    """Generates random mock interaction events (user_id, item_id)."""
    interactions = []
    for _ in range(num_samples):
        interactions.append({
            "user_id": random.choice(user_ids),
            "item_id": random.choice(item_ids),
            "rating": round(random.uniform(1.0, 5.0), 1)
        })
    return interactions
