import json
import pickle
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("Đang đọc data/meta_Cell_Phones_and_Accessories.jsonl...")

metadata_cache = {}

try:
    with open('data/meta_Cell_Phones_and_Accessories.jsonl', 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            try:
                item = json.loads(line.strip())
                title = item.get('title', '')
                if title:
                    # Chuyển đổi giá trị price (từ dict nếu có hoặc giữ nguyên float)
                    price = item.get('price', 0)
                    if isinstance(price, dict):
                        price = price.get('value', 0)
                    
                    # Trích xuất hình ảnh
                    main_image = ""
                    images = item.get('images', [])
                    if images and len(images) > 0:
                        if isinstance(images[0], dict) and 'hi_res' in images[0]:
                            main_image = images[0].get('hi_res')
                        elif isinstance(images[0], dict) and 'large' in images[0]:
                            main_image = images[0].get('large')
                        else:
                            main_image = str(images[0])
                    
                    metadata_cache[title] = {
                        'parent_asin': item.get('parent_asin', f"asin_{i}"),
                        'title': title,
                        'main_image': main_image,
                        'average_rating': item.get('average_rating', 5.0),
                        'rating_number': item.get('rating_number', 0),
                        'price': price,
                        'features': item.get('features', []),
                        'description': item.get('description', []),
                        'details': item.get('details', {})
                    }
            except Exception as e:
                pass
            
            if i % 10000 == 0 and i > 0:
                print(f"Đã xử lý {i} dòng...")

    os.makedirs('model_output', exist_ok=True)
    with open('model_output/metadata_cache.pkl', 'wb') as f:
        pickle.dump(metadata_cache, f)

    print(f"XONG! Đã lưu {len(metadata_cache)} sản phẩm vào model_output/metadata_cache.pkl")
except Exception as e:
    print(f"Lỗi: {e}")
