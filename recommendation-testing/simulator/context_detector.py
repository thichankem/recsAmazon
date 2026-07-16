import urllib.parse
import re
from typing import Dict, Any, Optional

class ContextDetector:
    """Parses URLs to identify page type and context IDs (such as item_id, category, or search query)."""

    @staticmethod
    def detect_context(url: str) -> Dict[str, Any]:
        """
        Deduces page context from URL structure.
        
        Examples:
        - https://www.amazon.com/s?k=iphone -> {"page_type": "search_page", "search_query": "iphone"}
        - https://www.amazon.com/dp/B08L6L3X1S -> {"page_type": "product_page", "item_id": "B08L6L3X1S"}
        - https://www.amazon.com/gp/product/B08L6L3X1S -> {"page_type": "product_page", "item_id": "B08L6L3X1S"}
        - https://www.amazon.com/b?node=2811119011 -> {"page_type": "category_page", "category_id": "2811119011"}
        """
        parsed = urllib.parse.urlparse(url)
        path = parsed.path.strip("/")
        parts = path.split("/")
        query_params = urllib.parse.parse_qs(parsed.query)

        result = {
            "page_type": "unknown",
            "item_id": None,
            "category_id": None,
            "search_query": None,
            "url": url
        }

        # 1. Check Search Page
        if path == "s" or path.startswith("s/") or "k" in query_params:
            result["page_type"] = "search_page"
            if "k" in query_params:
                result["search_query"] = query_params["k"][0]
            elif len(parts) > 1:
                result["search_query"] = urllib.parse.unquote(parts[1])
            return result

        # 2. Check Product Page (dp or gp/product or product/)
        # Look for ASIN patterns (10-character alphanumeric)
        asin_pattern = re.compile(r'^[A-Z0-9]{10}$', re.IGNORECASE)
        
        # Check /dp/ASIN
        if "dp" in parts:
            dp_idx = parts.index("dp")
            if len(parts) > dp_idx + 1:
                asin_candidate = parts[dp_idx + 1]
                if asin_pattern.match(asin_candidate):
                    result["page_type"] = "product_page"
                    result["item_id"] = asin_candidate
                    return result

        # Check /gp/product/ASIN
        if "gp" in parts and "product" in parts:
            gp_idx = parts.index("gp")
            prod_idx = parts.index("product")
            if prod_idx == gp_idx + 1 and len(parts) > prod_idx + 1:
                asin_candidate = parts[prod_idx + 1]
                if asin_pattern.match(asin_candidate):
                    result["page_type"] = "product_page"
                    result["item_id"] = asin_candidate
                    return result

        # Custom /product/item_id format
        if len(parts) > 1 and parts[0] == "product":
            result["page_type"] = "product_page"
            result["item_id"] = parts[1]
            return result

        if "asin" in query_params:
            result["page_type"] = "product_page"
            result["item_id"] = query_params["asin"][0]
            return result

        # 3. Check Category Page
        # Check /b/node or b?node=...
        if "b" in parts:
            b_idx = parts.index("b")
            if len(parts) > b_idx + 1:
                result["page_type"] = "category_page"
                result["category_id"] = parts[b_idx + 1]
                return result

        if "node" in query_params:
            result["page_type"] = "category_page"
            result["category_id"] = query_params["node"][0]
            return result

        if len(parts) > 1 and parts[0] == "category":
            result["page_type"] = "category_page"
            result["category_id"] = parts[1]
            return result

        if "category" in query_params:
            result["page_type"] = "category_page"
            result["category_id"] = query_params["category"][0]
            return result

        # 4. Check Homepage
        if not path or path == "" or path in ["index.html", "index.php"]:
            result["page_type"] = "homepage"
            return result

        # Fallback to homepage
        result["page_type"] = "homepage"
        return result
