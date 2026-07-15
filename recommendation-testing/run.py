import os
from pathlib import Path
from utils.logger import logger
from utils.helper import load_yaml, save_json
from utils.random import set_seed, generate_random_user_interactions
from models.model_factory import ModelFactory
from adapters.local_adapter import LocalAdapter
from adapters.production_adapter import ProductionAdapter
from scenarios.homepage import HomepageScenario
from scenarios.product_page import ProductPageScenario
from scenarios.cold_start import ColdStartScenario
from evaluator.benchmark import Benchmark
from evaluator.report_generator import ReportGenerator

def main():
    logger.info("Initializing Recommendation Testing Framework...")
    
    # 1. Load Configurations
    config_path = "recommendation-testing/configs/config.yaml"
    exp_path = "recommendation-testing/configs/experiment.yaml"
    
    if not Path(config_path).exists():
        config_path = "configs/config.yaml"
        exp_path = "configs/experiment.yaml"

    try:
        config = load_yaml(config_path)
        exp_config = load_yaml(exp_path)
    except Exception as e:
        logger.error(f"Failed to load configurations: {e}")
        return

    # Set random seed
    seed = exp_config.get("experiment", {}).get("seed", 42)
    set_seed(seed)

    # 2. Check and generate mock dataset if none exist (for out-of-the-box runnability)
    dataset_config = config.get("dataset", {})
    raw_path = Path("recommendation-testing") / dataset_config.get("raw_path", "datasets/raw/raw_reviews.json")
    if not raw_path.parent.exists():
        raw_path = Path(dataset_config.get("raw_path", "datasets/raw/raw_reviews.json"))
        
    gt_path = Path("recommendation-testing") / dataset_config.get("ground_truth_path", "datasets/ground_truth/ground_truth.json")
    if not gt_path.parent.exists():
        gt_path = Path(dataset_config.get("ground_truth_path", "datasets/ground_truth/ground_truth.json"))

    mock_users_list = ["usr_alpha", "usr_beta", "usr_gamma", "usr_delta", "usr_epsilon"]
    mock_items_list = [f"item_{i}" for i in range(1, 20)]

    # Generate mock interactions/ground truth if files don't exist
    if not raw_path.exists():
        logger.info(f"Dataset path {raw_path} not found. Generating mock raw reviews...")
        mock_raw = generate_random_user_interactions(mock_users_list, mock_items_list, 100)
        save_json(str(raw_path), mock_raw)
        
    if not gt_path.exists():
        logger.info(f"Ground truth path {gt_path} not found. Generating mock ground truth...")
        # Map user to 3 actual items they will 'buy'
        mock_gt = {
            "usr_alpha": ["item_1", "item_3", "item_5"],
            "usr_beta": ["item_2", "item_4", "item_6"],
            "usr_gamma": ["item_1", "item_2", "item_10"],
            "usr_delta": ["item_8", "item_12", "item_15"],
            "usr_epsilon": ["item_3", "item_7", "item_11"]
        }
        save_json(str(gt_path), mock_gt)
    else:
        try:
            import json
            with open(gt_path, "r", encoding="utf-8") as f:
                mock_gt = json.load(f)
        except Exception:
            mock_gt = {}

    # 3. Model setup
    logger.info("Initializing model...")
    model = ModelFactory.create_model(config.get("model", {}))
    
    # Train the model with raw interactions
    try:
        import json
        with open(raw_path, "r", encoding="utf-8") as f:
            interactions = json.load(f)
        model.train(interactions)
    except Exception as e:
        logger.warning(f"Failed to train model: {e}")

    # 4. Adapter Selection
    adapter_type = config.get("adapter", {}).get("type", "local")
    if adapter_type == "production":
        api_url = config.get("adapter", {}).get("api_url", "http://localhost:8000/recommend")
        timeout = config.get("simulator", {}).get("timeout_ms", 5000)
        logger.info(f"Using ProductionAdapter targeting: {api_url}")
        adapter = ProductionAdapter(api_url=api_url, timeout_ms=timeout)
    else:
        logger.info("Using LocalAdapter (in-memory execution)")
        adapter = LocalAdapter(recommender=model)

    # 5. Benchmark setup
    scenarios = [
        HomepageScenario(),
        ProductPageScenario(),
        ColdStartScenario()
    ]

    mock_users_metadata = [{"user_id": u} for u in mock_users_list]

    benchmark = Benchmark(adapter=adapter, config=config, experiment_config=exp_config)
    
    # 6. Execute benchmark
    results = benchmark.run(scenarios, mock_users_metadata, mock_gt)

    # 7. Write reports
    output_dir = exp_config.get("experiment", {}).get("output_dir", "experiments/exp_baseline_001")
    # Redirect outputs to reports/ if experiments directory structure is set
    reports_output_dir = Path("recommendation-testing/reports") / exp_config.get("experiment", {}).get("name", "exp_baseline_001")
    if not reports_output_dir.parent.exists():
        reports_output_dir = Path("reports") / exp_config.get("experiment", {}).get("name", "exp_baseline_001")
        
    logger.info(f"Writing evaluation reports to: {reports_output_dir}")
    ReportGenerator.generate_all(results, str(reports_output_dir))
    
    # Save a copy under experiments
    exp_output_dir = Path("recommendation-testing") / output_dir
    if not exp_output_dir.parent.exists():
        exp_output_dir = Path(output_dir)
    ReportGenerator.generate_all(results, str(exp_output_dir))

    logger.info("Recommendation Testing Framework execution completed successfully.")

if __name__ == "__main__":
    main()
