import os
import requests
import time

def download_file(url, local_path):
    print(f"Downloading {url} to {local_path}...")
    temp_path = local_path + ".incomplete"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    
    # Get request stream
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    print(f"Total size: {total_size / (1024*1024):.2f} MB")
    
    downloaded_size = 0
    start_time = time.time()
    last_print_time = start_time
    last_downloaded_size = 0
    
    with open(temp_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=1024*1024): # 1MB chunk
            if chunk:
                f.write(chunk)
                downloaded_size += len(chunk)
                
                # Print progress every 5 seconds
                current_time = time.time()
                if current_time - last_print_time >= 5.0:
                    pct = (downloaded_size / total_size) * 100 if total_size > 0 else 0
                    speed = (downloaded_size - last_downloaded_size) / (current_time - last_print_time) / (1024*1024)
                    print(f"Downloaded: {downloaded_size / (1024*1024):.2f} MB ({pct:.1f}%) | Speed: {speed:.2f} MB/s")
                    last_print_time = current_time
                    last_downloaded_size = downloaded_size
                    
    # Rename once completed
    if os.path.exists(local_path):
        os.remove(local_path)
    os.rename(temp_path, local_path)
    
    total_elapsed = time.time() - start_time
    avg_speed = downloaded_size / total_elapsed / (1024*1024)
    print(f"Download completed in {total_elapsed:.2f}s | Average Speed: {avg_speed:.2f} MB/s")
    return True

if __name__ == "__main__":
    # Download pytorch_model.bin for BGE-M3
    # The URL redirects to AWS S3 / CloudFront, requests handles redirects automatically
    url = "https://huggingface.co/BAAI/bge-m3/resolve/main/pytorch_model.bin"
    
    # The cache path structure of huggingface_hub:
    # C:\Users\ADMIN\.cache\huggingface\hub\models--BAAI--bge-m3\blobs\<hash>
    # And there is a symlink in snapshots\<commit_id>\pytorch_model.bin pointing to ..\..\blobs\<hash>
    # The hash for BGE-M3 pytorch_model.bin is b5e0ce3470abf5ef3831aa1bd5553b486803e83251590ab7ff35a117cf6aad38
    blob_path = r"C:\Users\ADMIN\.cache\huggingface\hub\models--BAAI--bge-m3\blobs\b5e0ce3470abf5ef3831aa1bd5553b486803e83251590ab7ff35a117cf6aad38"
    
    try:
        download_file(url, blob_path)
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")
