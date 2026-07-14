import time
import os
import json
import psutil
import torch

def get_gpu_memory_info():
    if torch.cuda.is_available():
        # returns (allocated, cached) in MB
        return (
            torch.cuda.memory_allocated() / (1024 * 1024),
            torch.cuda.memory_reserved() / (1024 * 1024)
        )
    return (0.0, 0.0)

def get_system_memory_usage_mb():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)

def run_benchmark():
    print("=== RERANKER BENCHMARK ===")
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device selected: {device}")
    if device == "cuda":
        print(f"GPU Name: {torch.cuda.get_device_name(0)}")
        
    mem_before_sys = get_system_memory_usage_mb()
    gpu_alloc_before, gpu_cached_before = get_gpu_memory_info()
    
    print(f"System memory before model load: {mem_before_sys:.2f} MB")
    print(f"GPU memory before model load: Allocated {gpu_alloc_before:.2f} MB, Reserved {gpu_cached_before:.2f} MB")
    
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    
    model_name = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    print(f"Loading tokenizer & model {model_name}...")
    start_load = time.time()
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    
    # Cast to half/fp16 for RTX 4080 if using CUDA
    if device == "cuda":
        model = model.half()
        
    model = model.to(device)
    model.eval()
    
    load_time = time.time() - start_load
    print(f"Model loaded in {load_time:.2f}s")
    
    mem_after_sys = get_system_memory_usage_mb()
    gpu_alloc_after, gpu_cached_after = get_gpu_memory_info()
    
    sys_mem_diff = mem_after_sys - mem_before_sys
    gpu_mem_diff = gpu_alloc_after - gpu_alloc_before
    
    print(f"System memory after model load: {mem_after_sys:.2f} MB (diff: {sys_mem_diff:.2f} MB)")
    print(f"GPU memory after model load: Allocated {gpu_alloc_after:.2f} MB, Reserved {gpu_cached_after:.2f} MB (Alloc diff: {gpu_mem_diff:.2f} MB)")
    
    # Benchmarks
    # Standard candidate size: 30 items
    test_batch_sizes = [1, 10, 30, 50]
    results = {}
    
    # Query and items definition
    query = "gentle daily face wash for dry skin"
    passage = "Cetaphil Gentle Skin Cleanser is a clinically proven daily facial cleanser that hydrates and soothes dry, sensitive skin while removing dirt and makeup."
    
    for size in test_batch_sizes:
        print(f"\nBenchmarking rerank batch size: {size} pairs...")
        pairs = [[query, f"{passage} (Item variant {i})"] for i in range(size)]
        
        # Warmup
        if size == 1:
            with torch.no_grad():
                inputs = tokenizer([pairs[0]], padding=True, truncation=True, return_tensors='pt', max_length=512)
                inputs = {k: v.to(device) for k, v in inputs.items()}
                _ = model(**inputs)
                
        # Measure latency
        start_time = time.time()
        start_cpu = time.process_time()
        
        with torch.no_grad():
            inputs = tokenizer(pairs, padding=True, truncation=True, return_tensors='pt', max_length=512)
            inputs = {k: v.to(device) for k, v in inputs.items()}
            outputs = model(**inputs)
            scores = outputs.logits.view(-1).float().cpu().numpy()
            
        elapsed_wall = time.time() - start_time
        elapsed_cpu = time.process_time() - start_cpu
        
        gpu_alloc_run, gpu_cached_run = get_gpu_memory_info()
        mem_after_run = get_system_memory_usage_mb()
        
        print(f"Batch size {size} completed in {elapsed_wall * 1000:.2f} ms (CPU time: {elapsed_cpu * 1000:.2f} ms)")
        print(f"System Memory: {mem_after_run:.2f} MB, GPU Allocated: {gpu_alloc_run:.2f} MB")
        
        results[str(size)] = {
            "batch_size": size,
            "total_time_ms": elapsed_wall * 1000,
            "avg_time_per_pair_ms": (elapsed_wall / size) * 1000,
            "system_memory_mb": mem_after_run,
            "gpu_allocated_mb": gpu_alloc_run
        }
        
    final_stats = {
        "model_name": model_name,
        "device": device,
        "gpu_name": torch.cuda.get_device_name(0) if device == "cuda" else None,
        "load_time_seconds": load_time,
        "system_model_memory_mb": sys_mem_diff,
        "gpu_model_memory_allocated_mb": gpu_mem_diff,
        "benchmark_runs": results
    }
    
    output_path = "src/phase1/benchmark_reranker_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_stats, f, indent=4)
    print(f"\nBenchmark results saved to {output_path}")

if __name__ == "__main__":
    run_benchmark()
