import re
import urllib.parse
from typing import Dict, Any, List
from utils.logger import logger

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

class AmazonScraper:
    """Extracts product or search context from Amazon URLs using Playwright or URL heuristics."""

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text).strip()

    @classmethod
    def extract_from_url_slug(cls, url: str) -> Dict[str, Any]:
        """Fallback parser that extracts ASIN and keywords directly from the URL string."""
        parsed = urllib.parse.urlparse(url)
        path = parsed.path.strip("/")
        parts = path.split("/")
        query_params = urllib.parse.parse_qs(parsed.query)

        result = {
            "item_id": None,
            "title": "Amazon Product",
            "brand": "Unknown",
            "categories": ["Cell Phones & Accessories"],
            "page_type": "unknown",
            "search_query": None,
            "scraped_successfully": False
        }

        # 1. Search page detection
        if path == "s" or path.startswith("s/") or "k" in query_params:
            result["page_type"] = "search_page"
            if "k" in query_params:
                result["search_query"] = query_params["k"][0]
            elif len(parts) > 1:
                result["search_query"] = urllib.parse.unquote(parts[1])
            else:
                result["search_query"] = "iphone"
            result["title"] = f"Search: {result['search_query']}"
            return result

        # 2. ASIN and Title extraction from URL
        asin_pattern = re.compile(r'^[A-Z0-9]{10}$', re.IGNORECASE)
        asin = None
        slug_title = ""

        # Find ASIN in parts
        for i, part in enumerate(parts):
            if asin_pattern.match(part):
                asin = part
                # The part before /dp/ is usually the slug title
                if i > 1 and parts[i-1] == "dp":
                    slug_title = parts[i-2]
                elif i > 0 and parts[i-1] != "product" and parts[i-1] != "gp":
                    slug_title = parts[i-1]
                break

        if not asin and "asin" in query_params:
            asin = query_params["asin"][0]

        # Check if no ASIN was found, but the URL is a non-Amazon product page
        if not asin:
            last_part = ""
            for part in reversed(parts):
                if part:
                    last_part = part
                    break
            
            if last_part:
                clean_part = urllib.parse.unquote(last_part)
                clean_lower = clean_part.lower()
                phone_keywords = ["iphone", "galaxy", "pixel", "phone", "samsung", "xiaomi", "redmi", "oppo", "vivo", "realme", "dien-thoai", "dien_thoai"]
                is_phone_url = any(kw in clean_lower for kw in phone_keywords)
                
                if is_phone_url:
                    import hashlib
                    h = hashlib.md5(clean_part.encode('utf-8')).hexdigest().upper()
                    asin = f"B0GEN{h[:5]}"
                    slug_title = clean_part

        if asin:
            result["item_id"] = asin
            result["page_type"] = "product_page"
            
            # Format slug title
            if slug_title:
                # Replace hyphens/underscores with spaces
                title_words = [w for w in re.split(r'[-_]', slug_title) if w]
                formatted_title = " ".join(title_words)
                # Capitalize
                formatted_title = formatted_title.title()
                result["title"] = formatted_title
                
                # Guess brand from first word
                if title_words:
                    guessed_brand = title_words[0].capitalize()
                    if guessed_brand.lower() == "iphone":
                        result["brand"] = "Apple"
                    elif guessed_brand.lower() == "dien" and len(title_words) > 1 and title_words[1].lower() == "thoai":
                        result["brand"] = title_words[2].capitalize() if len(title_words) > 2 else "Unknown"
                        if result["brand"].lower() == "iphone":
                            result["brand"] = "Apple"
                    else:
                        result["brand"] = guessed_brand
            else:
                result["title"] = f"Amazon Product {asin}"
            
            # Auto-detect categories based on title keywords
            title_lower = result["title"].lower()
            if "case" in title_lower or "cover" in title_lower or "ốp" in title_lower:
                result["categories"] = ["Cell Phones & Accessories", "Cases, Holsters & Sleeves", "Basic Cases"]
            elif "charger" in title_lower or "cable" in title_lower or "power bank" in title_lower:
                result["categories"] = ["Cell Phones & Accessories", "Chargers & Power Adapters"]
            elif "protector" in title_lower or "glass" in title_lower:
                result["categories"] = ["Cell Phones & Accessories", "Screen Protectors"]
            else:
                result["categories"] = ["Cell Phones & Accessories", "Cell Phones"]
                
        else:
            # Fallback to homepage
            result["page_type"] = "homepage"
            result["title"] = "Amazon Homepage"

        return result

    @classmethod
    def scrape_url(cls, url: str) -> Dict[str, Any]:
        """
        Attempts to scrape the Amazon page using Playwright.
        Falls back to URL parsing if scraping fails or is blocked.
        """
        # Run URL heuristics first to get a baseline
        context = cls.extract_from_url_slug(url)
        
        # If it's a search page or homepage, heuristics are sufficient
        if context["page_type"] != "product_page" or not PLAYWRIGHT_AVAILABLE:
            return context

        logger.info(f"Launching Playwright to scrape Amazon product URL: {url}")
        try:
            with sync_playwright() as p:
                # Use standard Chromium but with custom User Agent to minimize CAPTCHAs
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
                )
                
                # Set extra headers
                page.set_extra_http_headers({
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
                })
                
                page.goto(url, wait_until="domcontentloaded", timeout=15000)
                
                # Check for CAPTCHA
                page_title = page.title()
                if "captcha" in page_title.lower() or "robot" in page_title.lower():
                    logger.warning("Amazon CAPTCHA detected. Falling back to URL-slug parsing.")
                    browser.close()
                    return context
                
                # Check if non-Amazon URL
                is_amazon = "amazon." in url.lower()
                if not is_amazon:
                    h1_el = page.query_selector("h1")
                    h1_text = cls.clean_text(h1_el.inner_text()) if h1_el else ""
                    
                    page_title = page.title()
                    
                    # Check for 404/error page
                    error_keywords = ["404", "not found", "error", "lỗi", "không tìm thấy", "trang không tồn tại", "chưa tồn tại"]
                    is_error = any(ekw in page_title.lower() for ekw in error_keywords) or (h1_text and any(ekw in h1_text.lower() for ekw in error_keywords))
                    
                    if is_error:
                        logger.warning(f"Detected error or 404 page for non-Amazon URL. Falling back to URL-slug parsing.")
                        browser.close()
                        return context
                        
                    # Use H1 if available, otherwise fallback to page title
                    scraped_title = h1_text if h1_text else page_title.split("-")[0].strip()
                    
                    # Normalize brand
                    title_lower = scraped_title.lower()
                    brand = "Unknown"
                    if "iphone" in title_lower or "ipad" in title_lower or "apple" in title_lower:
                        brand = "Apple"
                    elif "samsung" in title_lower or "galaxy" in title_lower:
                        brand = "Samsung"
                    elif "pixel" in title_lower or "google" in title_lower:
                        brand = "Google"
                    elif "xiaomi" in title_lower or "redmi" in title_lower:
                        brand = "Xiaomi"
                    elif "oppo" in title_lower:
                        brand = "Oppo"
                    elif "vivo" in title_lower:
                        brand = "Vivo"
                    elif "realme" in title_lower:
                        brand = "Realme"
                    else:
                        words = [w for w in re.split(r'[^a-zA-Z0-9]', scraped_title) if w]
                        if words:
                            brand = words[0].capitalize()
                    
                    context["title"] = scraped_title
                    context["brand"] = brand
                    context["scraped_successfully"] = True
                    logger.info(f"Successfully scraped non-Amazon product: {scraped_title} ({brand})")
                    browser.close()
                    return context

                
                # Extract details
                title_el = page.query_selector("#productTitle")
                title = cls.clean_text(title_el.inner_text()) if title_el else ""
                
                brand_el = page.query_selector("#bylineInfo") or page.query_selector("#brand")
                brand = cls.clean_text(brand_el.inner_text()) if brand_el else ""
                if brand.lower().startswith("visit the"):
                    brand = brand[9:].strip()
                if brand.lower().endswith("store"):
                    brand = brand[:-5].strip()
                
                # Categories from breadcrumbs
                categories = []
                breadcrumbs = page.query_selector_all("#wayfinding-breadcrumbs_container ul li a")
                for bc in breadcrumbs:
                    text = cls.clean_text(bc.inner_text())
                    if text:
                        categories.append(text)
                
                browser.close()

                if title:
                    context["title"] = title
                    if brand:
                        context["brand"] = brand
                    if categories:
                        context["categories"] = categories
                    context["scraped_successfully"] = True
                    logger.info(f"Successfully scraped: {title} ({brand})")
                else:
                    logger.warning("Empty product title scraped. Using URL-slug fallback.")

        except Exception as e:
            err_clean = str(e).encode('ascii', errors='ignore').decode('ascii')
            logger.error(f"Playwright scraping failed: {err_clean}. Using URL-slug fallback.")
            
        return context
