import urllib.parse
from typing import Dict, Any, Optional

class ContextDetector:
    """Parses URLs to identify page type and context IDs (such as item_id or category)."""

    @staticmethod
    def detect_context(url: str) -> Dict[str, Any]:
        """
        Deduces page context from URL structure.
        
        Examples:
        - http://localhost:8000/ -> {"page_type": "homepage", "item_id": None}
        - http://localhost:8000/product/iphone_15 -> {"page_type": "product_page", "item_id": "iphone_15"}
        - http://localhost:8000/category/electronics -> {"page_type": "category_page", "category_id": "electronics"}
        """
        parsed = urllib.parse.urlparse(url)
        path = parsed.path.strip("/")
        parts = path.split("/")

        result = {
            "page_type": "unknown",
            "item_id": None,
            "category_id": None,
            "url": url
        }

        if not path or path == "":
            result["page_type"] = "homepage"
        elif parts[0] == "product" and len(parts) > 1:
            result["page_type"] = "product_page"
            result["item_id"] = parts[1]
        elif parts[0] == "category" and len(parts) > 1:
            result["page_type"] = "category_page"
            result["category_id"] = parts[1]
        else:
            # Fallback based on query params or subsegments
            query_params = urllib.parse.parse_qs(parsed.query)
            if "asin" in query_params:
                result["page_type"] = "product_page"
                result["item_id"] = query_params["asin"][0]
            elif "category" in query_params:
                result["page_type"] = "category_page"
                result["category_id"] = query_params["category"][0]
            else:
                # Default homepage fallback if unable to parse
                result["page_type"] = "homepage"

        return result
