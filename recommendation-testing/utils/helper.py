import yaml
import json
from pathlib import Path
from typing import Any, Dict

def load_yaml(file_path: str) -> Dict[str, Any]:
    """Loads a YAML configuration file."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found: {file_path}")
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def save_json(file_path: str, data: Any):
    """Saves data into a JSON file."""
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def load_json(file_path: str) -> Any:
    """Loads data from a JSON file."""
    path = Path(file_path)
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
