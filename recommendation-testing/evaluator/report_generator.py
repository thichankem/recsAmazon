import json
import csv
from pathlib import Path
from typing import Dict, Any, List
from utils.logger import logger

class ReportGenerator:
    """Generates benchmark execution reports in HTML, CSV, and JSON formats."""

    @staticmethod
    def generate_all(results: Dict[str, Any], output_dir: str):
        """Generates all report formats into output directory."""
        dir_path = Path(output_dir)
        dir_path.mkdir(parents=True, exist_ok=True)

        ReportGenerator.generate_json(results, dir_path / "report.json")
        ReportGenerator.generate_csv(results, dir_path / "metrics.csv")
        ReportGenerator.generate_html(results, dir_path / "report.html")
        logger.info(f"Reports successfully generated in {output_dir}")

    @staticmethod
    def generate_json(results: Dict[str, Any], path: Path):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=4, ensure_ascii=False)

    @staticmethod
    def generate_csv(results: Dict[str, Any], path: Path):
        scores = results.get("scores", {})
        latency = results.get("latency_stats", {})
        
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Experiment Name", results.get("experiment_name")])
            writer.writerow(["Total Time (ms)", f"{results.get('total_execution_time_ms'):.2f}"])
            
            # Write scores
            for k, v in scores.items():
                writer.writerow([f"Score - {k}", f"{v:.4f}"])
                
            # Write latency statistics
            for k, v in latency.items():
                writer.writerow([f"Latency - {k}", f"{v}"])

    @staticmethod
    def generate_html(results: Dict[str, Any], path: Path):
        scores = results.get("scores", {})
        latency = results.get("latency_stats", {})
        
        scores_rows = "".join([f"<tr><td>{k}</td><td>{v:.4f}</td></tr>" for k, v in scores.items()])
        latency_rows = "".join([f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in latency.items()])
        
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>Benchmark Report - {results.get('experiment_name')}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; background-color: #f8f9fa; color: #333; }}
        h1 {{ color: #007bff; }}
        .section {{ background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
        th, td {{ border: 1px solid #dee2e6; padding: 12px; text-align: left; }}
        th {{ background-color: #f1f3f5; }}
        .header {{ font-weight: bold; color: #495057; }}
    </style>
</head>
<body>
    <h1>Benchmark Results</h1>
    <div class="section">
        <h2>Meta</h2>
        <p><span class="header">Experiment:</span> {results.get('experiment_name')}</p>
        <p><span class="header">Execution Time:</span> {results.get('total_execution_time_ms'):.2f} ms</p>
    </div>
    
    <div class="section">
        <h2>Model Metrics</h2>
        <table>
            <thead>
                <tr><th>Metric</th><th>Value</th></tr>
            </thead>
            <tbody>
                {scores_rows}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Latency Statistics & Failures</h2>
        <table>
            <thead>
                <tr><th>Metric</th><th>Value</th></tr>
            </thead>
            <tbody>
                {latency_rows}
            </tbody>
        </table>
    </div>
</body>
</html>
"""
        with open(path, "w", encoding="utf-8") as f:
            f.write(html_content)
