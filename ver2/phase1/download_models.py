import time
import socket
from huggingface_hub import hf_hub_download, list_repo_files

# Set a global socket timeout (30 seconds) to prevent infinite hangs
socket.setdefaulttimeout(30)

def download_repo_sequentially(repo_id, exclude_prefixes=None, max_retries=5):
    print(f"\n==================================================")
    print(f"Downloading repository: {repo_id} sequentially...")
    print(f"==================================================")
    
    try:
        files = list_repo_files(repo_id)
        print(f"Found {len(files)} files in repository.")
    except Exception as e:
        print(f"Error listing repo files for {repo_id}: {e}")
        return False
        
    # Filter files
    files_to_download = []
    for f in files:
        # Exclude images, assets, git folders, and OS metadata files
        if f.startswith("imgs/") or f.startswith("assets/") or f.endswith(".DS_Store") or f == ".gitattributes":
            continue
        # Exclude model weights for OTHER frameworks to save time/bandwidth
        if f.endswith(".h5") or f.endswith(".ot") or f.endswith(".msgpack") or f.endswith(".pb"):
            print(f"Excluding other framework file: {f}")
            continue
        # Exclude pytorch_model.bin since we already downloaded model.safetensors directly
        if repo_id == "cross-encoder/ms-marco-MiniLM-L-6-v2" and f == "pytorch_model.bin":
            print("Excluding redundant pytorch_model.bin (model.safetensors is used)")
            continue
        
        # Exclude specified prefixes
        should_exclude = False
        if exclude_prefixes:
            for prefix in exclude_prefixes:
                if f.startswith(prefix):
                    should_exclude = True
                    break
        if should_exclude:
            print(f"Excluding file by prefix: {f}")
            continue
            
        files_to_download.append(f)
    
    print(f"Filtering down to {len(files_to_download)} core files to download.")
    
    success_count = 0
    for idx, filename in enumerate(files_to_download):
        print(f"[{idx+1}/{len(files_to_download)}] Downloading {filename}...")
        
        # Retry loop for each file
        downloaded = False
        for attempt in range(1, max_retries + 1):
            start_time = time.time()
            try:
                local_path = hf_hub_download(repo_id=repo_id, filename=filename)
                elapsed = time.time() - start_time
                print(f"  -> Success on attempt {attempt}: Downloaded/verified to {local_path} in {elapsed:.2f}s")
                downloaded = True
                success_count += 1
                break
            except Exception as e:
                elapsed = time.time() - start_time
                print(f"  -> Attempt {attempt}/{max_retries} FAILED in {elapsed:.2f}s: {e}")
                if attempt < max_retries:
                    print("     Retrying in 5 seconds...")
                    time.sleep(5)
                else:
                    print(f"  -> ERROR: Failed to download {filename} after {max_retries} attempts.")
            
    print(f"Finished downloading {repo_id}. Successfully downloaded/verified {success_count}/{len(files_to_download)} files.")
    return success_count == len(files_to_download)

if __name__ == "__main__":
    import sys
    # Download small embedding model, skipping ONNX folder
    bge_small_ok = download_repo_sequentially("BAAI/bge-small-en-v1.5", exclude_prefixes=["onnx/"])
    
    # Download small reranker model, skipping ONNX and OpenVINO folders and pytorch_model.bin
    reranker_ok = download_repo_sequentially("cross-encoder/ms-marco-MiniLM-L-6-v2", exclude_prefixes=["onnx/", "openvino/"])
    
    if bge_small_ok and reranker_ok:
        print("\nAll models downloaded successfully!")
        sys.exit(0)
    else:
        print("\nSome files failed to download.")
        sys.exit(1)
