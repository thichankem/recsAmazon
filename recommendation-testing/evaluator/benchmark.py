import time
from typing import Dict, Any, List
from adapters.base_adapter import BaseAdapter
from collector.recommendation_collector import RecommendationCollector
from collector.latency_collector import LatencyCollector
from evaluator.scorer import Scorer
from utils.logger import logger

class Benchmark:
    """Manages the full benchmark suite execution on selected scenarios."""

    def __init__(self, adapter: BaseAdapter, config: Dict[str, Any], experiment_config: Dict[str, Any]):
        self.adapter = adapter
        self.config = config
        self.experiment_config = experiment_config
        self.recs_collector = RecommendationCollector()
        self.latency_collector = LatencyCollector()
        
        top_k = config.get("model", {}).get("top_k", 10)
        self.scorer = Scorer(k=top_k)

    def run(self, scenarios: List[Any], mock_users: List[Dict[str, Any]], ground_truth: Dict[str, List[str]]) -> Dict[str, Any]:
        """Runs scenarios and scores the adapter."""
        logger.info(f"Starting benchmark run for experiment: {self.experiment_config.get('experiment', {}).get('name')}")
        self.recs_collector.clear()
        self.latency_collector.clear()

        start_time = time.perf_counter()
        
        # Execute each scenario
        for sc in scenarios:
            logger.info(f"Running scenario: {sc.name}")
            
            # Formulate test data depending on the scenario
            if sc.name == "homepage_scenario":
                results = sc.execute(self.adapter, mock_users)
            elif sc.name == "product_page_scenario":
                # Create mock product context cases
                cases = [{"user_id": u["user_id"], "context_item_id": "item_123"} for u in mock_users]
                results = sc.execute(self.adapter, cases)
            elif sc.name == "cold_start_scenario":
                # Create a list of new users
                new_users = ["new_usr_1", "new_usr_2", "new_usr_3"]
                results = sc.execute(self.adapter, new_users)
            else:
                results = []

            # Collect details
            for res in results:
                recs = res.get("recommendations", [])
                user_id = res.get("user_id")
                context_item = res.get("context_item_id")
                latency = res.get("latency_ms", 0.0)
                status = res.get("status_code", 200)
                error = res.get("error")

                self.recs_collector.collect(
                    user_id=user_id,
                    context_item_id=context_item,
                    recommendations=recs,
                    extra_meta={"scenario": sc.name, "experiment_name": self.experiment_config.get("experiment", {}).get("name")}
                )

                if error:
                    self.latency_collector.record_error(user_id, error, status)
                else:
                    self.latency_collector.record_latency(latency)
                    
        total_time_ms = (time.perf_counter() - start_time) * 1000.0
        
        # Compute final scores
        records = self.recs_collector.get_all_records()
        scores = self.scorer.compute_scores(records, ground_truth)
        latency_stats = self.latency_collector.get_stats()

        logger.info("Benchmark execution completed.")
        return {
            "experiment_name": self.experiment_config.get("experiment", {}).get("name"),
            "total_execution_time_ms": total_time_ms,
            "scores": scores,
            "latency_stats": latency_stats,
            "raw_records": records
        }
