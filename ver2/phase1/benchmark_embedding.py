import time
import os
import json
import psutil
import torch

def get_memory_usage_mb():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)

def run_benchmark():
    print("=== EMBEDDING BENCHMARK ===")
    
    # Measure memory before loading model
    mem_before = get_memory_usage_mb()
    print(f"Memory before model load: {mem_before:.2f} MB")
    
    # Try importing sentence_transformers
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("sentence-transformers is not installed. Please run: pip install sentence-transformers")
        return
        
    start_load = time.time()
    print("Loading BAAI/bge-small-en-v1.5 on CPU...")
    # Load model on CPU
    model = SentenceTransformer("BAAI/bge-small-en-v1.5", device="cpu")
    load_time = time.time() - start_load
    
    mem_after_load = get_memory_usage_mb()
    model_mem = mem_after_load - mem_before
    print(f"Model loaded in {load_time:.2f}s")
    print(f"Memory after model load: {mem_after_load:.2f} MB (Model size in RAM: {model_mem:.2f} MB)")
    
    # Benchmarks
    test_sizes = [1, 100, 1000]
    results = {}
    
    # Sample queries
    base_query = "Best moisturizing lotion for sensitive skin with hyaluronic acid and natural ingredients"
    
    for size in test_sizes:
        print(f"\nBenchmarking encoding size: {size}...")
        queries = [f"{base_query} {i}" for i in range(size)]
        
        # Warmup (1 run)
        if size == 1:
            model.encode([base_query], show_progress_bar=False)
            
        start_time = time.time()
        start_cpu = time.process_time()
        
        # Run encode
        embeddings = model.encode(queries, batch_size=32, show_progress_bar=False)
        
        elapsed_wall = time.time() - start_time
        elapsed_cpu = time.process_time() - start_cpu
        
        mem_after_run = get_memory_usage_mb()
        
        avg_latency_ms = (elapsed_wall / size) * 1000
        print(f"Batch size {size} completed in {elapsed_wall:.4f}s (CPU time: {elapsed_cpu:.4f}s)")
        print(f"Average latency per query: {avg_latency_ms:.2f} ms")
        print(f"Memory after run: {mem_after_run:.2f} MB")
        
        results[str(size)] = {
            "total_queries": size,
            "total_time_seconds": elapsed_wall,
            "cpu_time_seconds": elapsed_cpu,
            "avg_latency_ms": avg_latency_ms,
            "memory_usage_mb": mem_after_run
        }
        
    final_stats = {
        "model_name": "BAAI/bge-small-en-v1.5",
        "device": "cpu",
        "load_time_seconds": load_time,
        "model_memory_mb": model_mem,
        "benchmark_runs": results
    }
    
    output_path = "src/phase1/benchmark_embedding_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_stats, f, indent=4)
    print(f"\nBenchmark results saved to {output_path}")

if __name__ == "__main__":
    run_benchmark()
