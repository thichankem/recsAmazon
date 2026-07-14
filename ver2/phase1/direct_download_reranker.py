import os
import requests
import time
import socket

def download_file_with_retry(url, local_path, max_retries=10, timeout=20):
    print(f"Downloading {url} to {local_path}...")
    temp_path = local_path + ".incomplete"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    
    for attempt in range(1, max_retries + 1):
        print(f"Attempt {attempt}/{max_retries}...")
        downloaded_size = 0
        
        # Check if we can resume (standard HTTP Range header)
        headers = {}
        if os.path.exists(temp_path):
            downloaded_size = os.path.getsize(temp_path)
            if downloaded_size > 0:
                headers['Range'] = f"bytes={downloaded_size}-"
                print(f"Resuming download from byte {downloaded_size}...")
                
        try:
            # We open with stream=True
            # Use a get request with range header if resuming
            mode = 'ab' if downloaded_size > 0 else 'wb'
            
            response = requests.get(url, headers=headers, stream=True, timeout=timeout)
            
            # If server doesn't support range or we aren't resuming
            if response.status_code == 200:
                mode = 'wb'
                downloaded_size = 0
            elif response.status_code == 416: # Range not satisfiable, start over
                mode = 'wb'
                downloaded_size = 0
                response = requests.get(url, stream=True, timeout=timeout)
                
            total_size = int(response.headers.get('content-length', 0)) + downloaded_size
            print(f"Total size: {total_size / (1024*1024):.2f} MB")
            
            start_time = time.time()
            last_print_time = start_time
            last_downloaded_size = downloaded_size
            
            with open(temp_path, mode) as f:
                for chunk in response.iter_content(chunk_size=512*1024): # 512KB chunk
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)
                        
                        current_time = time.time()
                        if current_time - last_print_time >= 5.0:
                            pct = (downloaded_size / total_size) * 100 if total_size > 0 else 0
                            speed = (downloaded_size - last_downloaded_size) / (current_time - last_print_time) / (1024*1024)
                            print(f"Downloaded: {downloaded_size / (1024*1024):.2f} MB ({pct:.1f}%) | Speed: {speed:.2f} MB/s")
                            last_print_time = current_time
                            last_downloaded_size = downloaded_size
            
            # Verify download size
            if downloaded_size >= total_size:
                if os.path.exists(local_path):
                    os.remove(local_path)
                os.rename(temp_path, local_path)
                print(f"Download completed successfully in {time.time() - start_time:.2f}s!")
                return True
            else:
                print(f"Download ended prematurely: {downloaded_size}/{total_size} bytes downloaded.")
                
        except (requests.exceptions.RequestException, socket.timeout, Exception) as e:
            print(f"Error on attempt {attempt}: {e}")
            print("Waiting 5 seconds before retrying...")
            time.sleep(5)
            
    print(f"Failed to download after {max_retries} attempts.")
    return False

if __name__ == "__main__":
    url = "https://huggingface.co/cross-encoder/ms-marco-MiniLM-L-6-v2/resolve/main/model.safetensors"
    
    # Save directly to the snapshots path where transformers looks for it
    dest_path = r"C:\Users\ADMIN\.cache\huggingface\hub\models--cross-encoder--ms-marco-MiniLM-L-6-v2\snapshots\c5ee24cb16019beea0893ab7796b1df96625c6b8\model.safetensors"
    
    download_file_with_retry(url, dest_path)
