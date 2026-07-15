import time
from typing import List, Dict, Any, Callable
from utils.logger import logger

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

class PlaywrightRunner:
    """Manages browser spawning and navigation using Playwright."""

    def __init__(self, headless: bool = True, slow_mo: int = 50):
        self.headless = headless
        self.slow_mo = slow_mo

    def run_sessions(self, urls: List[str], on_page_load: Callable[[str, Any], None] = None) -> List[Dict[str, Any]]:
        """
        Runs browser sessions navigating to the specified URLs.
        If Playwright is not installed, runs in mock simulation mode.
        """
        if not PLAYWRIGHT_AVAILABLE:
            logger.warning("Playwright is not installed. Running in mock simulation mode.")
            return self._run_mock_sessions(urls, on_page_load)

        results = []
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=self.headless, slow_mo=self.slow_mo)
                context = browser.new_context()
                page = context.new_page()

                for url in urls:
                    logger.info(f"Navigating to: {url}")
                    start_time = time.perf_counter()
                    try:
                        response = page.goto(url, timeout=30000)
                        status = response.status if response else 200
                        latency = (time.perf_counter() - start_time) * 1000.0
                        
                        logger.info(f"Page loaded: {url} (Status: {status}, Latency: {latency:.2f}ms)")
                        
                        # Execute callback to detect recommendations/context
                        if on_page_load:
                            on_page_load(url, page)
                            
                        results.append({
                            "url": url,
                            "status": status,
                            "latency_ms": latency,
                            "error": None
                        })
                    except Exception as e:
                        logger.error(f"Failed to load URL {url}: {e}")
                        results.append({
                            "url": url,
                            "status": 500,
                            "latency_ms": (time.perf_counter() - start_time) * 1000.0,
                            "error": str(e)
                        })
                
                browser.close()
        except Exception as ex:
            logger.error(f"Playwright execution error: {ex}. Falling back to mock session simulation.")
            return self._run_mock_sessions(urls, on_page_load)

        return results

    def _run_mock_sessions(self, urls: List[str], on_page_load: Callable[[str, Any], None] = None) -> List[Dict[str, Any]]:
        results = []
        for url in urls:
            logger.info(f"[Mock Browser] Navigating to: {url}")
            start_time = time.perf_counter()
            time.sleep(0.1)  # Mock network delay
            latency = (time.perf_counter() - start_time) * 1000.0
            
            if on_page_load:
                # Pass None as the page object in mock mode
                on_page_load(url, None)
                
            results.append({
                "url": url,
                "status": 200,
                "latency_ms": latency,
                "error": None
            })
        return results
