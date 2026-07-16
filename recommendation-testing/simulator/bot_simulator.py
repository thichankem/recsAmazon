import time
import uuid
import re
from typing import Dict, Any, List
from utils.logger import logger
from simulator.amazon_scraper import AmazonScraper

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

class BotSimulator:
    """Simulates automated shopper bots using Playwright, executing random clicks and saving clicked URLs."""

    def __init__(self, recommender_model: Any, base_url: str = "http://127.0.0.1:8000"):
        self.model = recommender_model
        self.base_url = base_url

    def _resolve_or_register(self, keyword: str) -> str:
        """Finds an item containing keyword in its title, or dynamically registers one if missing."""
        if not self.model:
            return f"item_{uuid.uuid4().hex[:8]}"

        keyword_clean = keyword.lower().strip()
        cb_model = getattr(self.model, "cb_model", self.model)
        item_features = getattr(cb_model, "item_features", {})
        
        for item_id, features in item_features.items():
            if keyword_clean in features.get("title", "").lower():
                return item_id
                
        dynamic_id = f"B0DYN{uuid.uuid4().hex[:5].upper()}"
        title = f"{keyword.title()} Premium Smartphone"
        categories = ["Cell Phones & Accessories", "Cell Phones"]
        
        # Smart Brand Resolution
        brand = "DynamicBrand"
        if "iphone" in keyword_clean or "apple" in keyword_clean:
            brand = "Apple"
        elif "galaxy" in keyword_clean or "samsung" in keyword_clean:
            brand = "Samsung"
        elif "pixel" in keyword_clean or "google" in keyword_clean:
            brand = "Google"
        elif "xiaomi" in keyword_clean or "redmi" in keyword_clean:
            brand = "Xiaomi"
        elif "oppo" in keyword_clean:
            brand = "Oppo"
        elif "vivo" in keyword_clean:
            brand = "Vivo"
        elif "realme" in keyword_clean:
            brand = "Realme"
            
        if hasattr(self.model, "register_item"):
            self.model.register_item(dynamic_id, title, categories, brand)
        elif hasattr(cb_model, "register_item"):
            cb_model.register_item(dynamic_id, title, categories, brand)
            
        logger.info(f"Registered dynamic product context: {title} (ID: {dynamic_id})")
        return dynamic_id

    def run_simulation(
        self, 
        amazon_url: str, 
        clicks: List[str] = None,
        steps: int = 3, 
        ab_bucket: str = "Both"
    ) -> Dict[str, Any]:
        """
        Runs a clickstream simulation where bots click randomly on recommendations
        and save all visited product URLs.
        """
        import random
        global PLAYWRIGHT_AVAILABLE

        # 1. Scrape initial Amazon product context
        scraped_context = AmazonScraper.scrape_url(amazon_url)
        initial_asin = scraped_context["item_id"]
        
        if not initial_asin:
            initial_asin = f"B0FAL{uuid.uuid4().hex[:5].upper()}"
            scraped_context["item_id"] = initial_asin
            scraped_context["title"] = "Fallback Amazon iPhone Product"
            scraped_context["categories"] = ["Cell Phones & Accessories", "Cell Phones"]
            scraped_context["brand"] = "Apple"

        # Register scraped item
        if hasattr(self.model, "register_item"):
            self.model.register_item(
                initial_asin, 
                scraped_context["title"], 
                scraped_context["categories"], 
                scraped_context["brand"]
            )

        # 2. Determine buckets to run
        buckets = ["A", "B"] if ab_bucket == "Both" else [ab_bucket]

        simulation_results = {
            "scraped_context": scraped_context,
            "variants": {}
        }

        # 3. Execute bot for each variant
        for bucket in buckets:
            bot_user_id = f"bot_{bucket}_{uuid.uuid4().hex[:6]}"
            logs = []
            click_path = []
            
            logs.append(f"[System] Initializing Bot for Variant {bucket}...")
            logs.append(f"[System] Bot User ID: {bot_user_id}")
            
            # Initial product page
            init_url = f"{self.base_url}/product/{initial_asin}?user_id={bot_user_id}&ab_bucket={bucket}"
            click_path.append({
                "title": scraped_context["title"],
                "url": init_url,
                "item_id": initial_asin
            })
            logs.append(f"[Navigation] Bot starts at: {scraped_context['title']} ({initial_asin}) -> URL: {init_url}")
            
            browser = None
            page = None
            playwright_session = None
            
            # Start Playwright if available
            is_playwright_active = PLAYWRIGHT_AVAILABLE
            if is_playwright_active:
                try:
                    playwright_session = sync_playwright().start()
                    browser = playwright_session.chromium.launch(headless=True)
                    context = browser.new_context()
                    page = context.new_page()
                    page.goto(init_url)
                    logs.append("[Playwright] Headless browser session active.")
                except Exception as e:
                    err_c = str(e).encode('ascii', errors='ignore').decode('ascii')
                    logs.append(f"[Playwright Error] Failed to launch browser: {err_c}. Operating in API-only mode.")
                    is_playwright_active = False
            
            current_asin = initial_asin
            boost_flag = (bucket == "B")
            
            # Determine click path keywords
            path_keywords = clicks if clicks else [None] * steps
            
            # Perform sequential visits based on keywords or random recommendations
            for i, kw in enumerate(path_keywords):
                step = i + 1
                
                next_asin = None
                next_title = None
                next_url = None
                
                if is_playwright_active and page:
                    try:
                        if kw:
                            # 1. Real keyword search simulation using page DOM
                            logs.append(f"[Playwright Search] Step {step}: Searching for '{kw}'...")
                            page.fill('input[name="q"]', kw)
                            page.click('button[type="submit"]')
                            page.wait_for_load_state("domcontentloaded")
                            
                            # Select first result on results page
                            page.wait_for_selector(".search-result-card", timeout=5000)
                            results = page.query_selector_all(".search-result-card")
                            if results:
                                first_card = results[0]
                                title_el = first_card.query_selector(".result-title")
                                meta_el = first_card.query_selector(".result-meta")
                                
                                next_title = title_el.inner_text().strip() if title_el else f"{kw.title()} Premium Smartphone"
                                meta_text = meta_el.inner_text() if meta_el else ""
                                asin_match = re.search(r'ASIN:\s*(\S+)', meta_text)
                                next_asin = asin_match.group(1) if asin_match else f"item_{uuid.uuid4().hex[:8]}"
                                
                                next_url = f"{self.base_url}/product/{next_asin}?user_id={bot_user_id}&ab_bucket={bucket}"
                                
                                logs.append(f"[Playwright Click] Step {step}: Clicking search result '{next_title}' ({next_asin}) -> URL: {next_url}")
                                first_card.click()
                                page.wait_for_load_state("domcontentloaded")
                            else:
                                logs.append(f"[Playwright Warning] Step {step}: No search results found for '{kw}'")
                                # Fallback programmatically
                                next_asin = self._resolve_or_register(kw)
                                cb_model = getattr(self.model, "cb_model", self.model)
                                features = cb_model.item_features.get(next_asin, {})
                                next_title = features.get("title", f"{kw.title()} Premium Smartphone")
                                next_url = f"{self.base_url}/product/{next_asin}?user_id={bot_user_id}&ab_bucket={bucket}"
                                page.goto(next_url)
                        else:
                            # 2. Real clickrandom recommendation click using page DOM
                            page.wait_for_selector(".rec-card", timeout=5000)
                            cards = page.query_selector_all(".rec-card")
                            if cards:
                                chosen_card = random.choice(cards)
                                title_el = chosen_card.query_selector(".rec-title")
                                meta_el = chosen_card.query_selector(".rec-meta")
                                
                                next_title = title_el.inner_text().strip() if title_el else "Unknown Product"
                                meta_text = meta_el.inner_text() if meta_el else ""
                                asin_match = re.search(r'ASIN:\s*(\S+)', meta_text)
                                next_asin = asin_match.group(1) if asin_match else f"item_{uuid.uuid4().hex[:8]}"
                                
                                next_url = f"{self.base_url}/product/{next_asin}?user_id={bot_user_id}&ab_bucket={bucket}"
                                
                                logs.append(f"[Playwright Click] Step {step}: Randomly clicking recommendation '{next_title}' ({next_asin}) -> URL: {next_url}")
                                chosen_card.click()
                                page.wait_for_load_state("domcontentloaded")
                            else:
                                logs.append(f"[Playwright Warning] Step {step}: No recommendation cards found to click.")
                                break
                    except Exception as e:
                        err_c = str(e).encode('ascii', errors='ignore').decode('ascii')
                        logs.append(f"[Playwright Error] Failed interaction at step {step}: {err_c}. Switching to API fallback.")
                        is_playwright_active = False
                
                # API Fallback mode (if Playwright is disabled or failed)
                if not is_playwright_active or not next_asin:
                    if kw:
                        next_asin = self._resolve_or_register(kw)
                        cb_model = getattr(self.model, "cb_model", self.model)
                        features = cb_model.item_features.get(next_asin, {})
                        next_title = features.get("title", f"{kw.title()} Premium Smartphone")
                        next_url = f"{self.base_url}/product/{next_asin}?user_id={bot_user_id}&ab_bucket={bucket}"
                        logs.append(f"[API Click] Bot searches/clicks term '{kw}': {next_title} ({next_asin}) -> URL: {next_url}")
                    else:
                        recs = self.model.recommend(
                            user_id=bot_user_id,
                            context_item_id=current_asin,
                            top_k=10,
                            accessory_boost=boost_flag,
                            ab_bucket=bucket
                        )
                        
                        if not recs:
                            logs.append(f"[API System] Step {step}: No recommendations found. Click stream ended.")
                            break
                            
                        chosen_rec = random.choice(recs)
                        next_asin = chosen_rec["item_id"]
                        next_title = chosen_rec.get("title", f"Product {next_asin}")
                        next_url = f"{self.base_url}/product/{next_asin}?user_id={bot_user_id}&ab_bucket={bucket}"
                        
                        logs.append(f"[API Click] Bot randomly selects item {step}: {next_title} ({next_asin}) -> URL: {next_url}")
                
                # Record click
                click_path.append({
                    "title": next_title,
                    "url": next_url,
                    "item_id": next_asin
                })
                current_asin = next_asin
                time.sleep(0.3)
                
            # Get final recommendations on the final product visited
            final_recs = self.model.recommend(
                user_id=bot_user_id,
                context_item_id=current_asin,
                top_k=10,
                accessory_boost=boost_flag,
                ab_bucket=bucket
            )
            
            logs.append(f"[System] Bot session completed. Visited {len(click_path)} products.")
            
            # Close browser
            if browser:
                try:
                    browser.close()
                    playwright_session.stop()
                except Exception:
                    pass

            # Calculate Relevance Score (Điểm Đánh Giá) out of 100
            relevance_score = 0.0
            cb_model = getattr(self.model, "cb_model", self.model)
            final_features = cb_model.item_features.get(current_asin, {})
            final_title = final_features.get("title", "")
            
            # Detect if final item is a phone
            is_final_phone = False
            final_version = None
            if final_title:
                title_lower = final_title.lower()
                phone_keywords = ["iphone", "galaxy", "pixel", "phone", "samsung s", "xiaomi", "redmi"]
                accessory_keywords = ["case", "cover", "protector", "glass", "charger", "cable", "sleeve", "holster", "stand", "loop", "strap", "ốp", "kính cường lực", "sạc", "cáp"]
                is_final_phone = any(kw in title_lower for kw in phone_keywords) and not any(kw in title_lower for kw in accessory_keywords)
                if is_final_phone:
                    version_match = re.search(r'\b(11|12|13|14|15|16|17|s22|s23|s24|s25)\b', title_lower)
                    if version_match:
                        final_version = version_match.group(1)
            
            acc_count = 0
            comp_count = 0
            cat_match_count = 0
            
            for rec in final_recs:
                rec_title_l = rec.get("title", "").lower()
                rec_cats = [c.lower() for c in rec.get("categories", [])]
                
                if is_final_phone:
                    is_acc = any(kw in rec_title_l for kw in ["case", "cover", "ốp", "protector", "screen", "glass", "charger", "cable", "sleeve", "holster", "power bank"])
                    if is_acc:
                        acc_count += 1
                        relevance_score += 5.0
                    
                    if final_version and final_version in rec_title_l:
                        comp_count += 1
                        relevance_score += 5.0
                else:
                    final_cats = set(c.lower() for c in final_features.get("categories", []))
                    if final_cats.intersection(rec_cats):
                        cat_match_count += 1
                        relevance_score += 10.0
            
            reasons = []
            if is_final_phone:
                reasons.append(f"{acc_count}/10 recommendations are phone accessories (+{acc_count * 5} pts).")
                if final_version:
                    reasons.append(f"{comp_count}/10 are specifically compatible with version {final_version} (+{comp_count * 5} pts).")
            else:
                reasons.append(f"{cat_match_count}/10 recommendations share categories with the viewed product (+{cat_match_count * 10} pts).")
            
            assessment = " ".join(reasons)
            
            simulation_results["variants"][bucket] = {
                "user_id": bot_user_id,
                "logs": logs,
                "click_path": click_path,
                "recommendations": final_recs,
                "relevance_score": relevance_score,
                "assessment": assessment
            }
            
        return simulation_results
