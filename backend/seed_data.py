import random
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')
from database import supabase

CATEGORIES = ["Phụ kiện điện thoại", "Điện thoại", "Tablet", "Máy tính", "Quần", "Áo"]

PRODUCT_TEMPLATES = {
    "Phụ kiện điện thoại": [
        "Tai nghe Bluetooth Không dây Chống ồn", "Củ Sạc Nhanh GaN 65W Đa Năng", "Ốp lưng Silicone Chống sốc Cao cấp",
        "Sạc Dự Phòng 10000mAh Từ Tính", "Cáp Sạc Nhanh Type-C Dù Siêu Bền", "Kính Cường Lực Chống Nhìn Trộm",
        "Giá Đỡ Điện Thoại Để Bàn Kim Loại", "Thẻ Nhớ MicroSD 128GB Tốc Độ Cao", "Bộ Vệ Sinh Tai Nghe & Điện Thoại",
        "Đế Sạc Không Dây 3 Trong 1"
    ],
    "Điện thoại": [
        "Điện thoại Flagship Ultra 5G 256GB", "Điện thoại Phone 15 Pro Max Titan", "Điện thoại Tầm Trung X 5G Pin 6000mAh",
        "Smartphone Màn Hình Gập Flip 5G", "Điện thoại Chuyên Game ROG Phone", "Điện thoại Cổ Điển Bàn Phím Siêu Bền",
        "Smartphone Giá Rẻ Pin Trâu 5000mAh", "Điện thoại Chụp Ảnh 200MP Chuyên Nghiệp"
    ],
    "Tablet": [
        "Máy tính bảng Pad Pro 11-inch M2", "Tablet Tab S9 Ultra 14.6 inch 5G", "Máy tính bảng Đọc Sách E-Ink",
        "Tablet Học Tập Cho Trẻ Em 10 inch", "Máy tính bảng Đồ Họa Chuyên Nghiệp"
    ],
    "Máy tính": [
        "Laptop Gaming ROG Strix RTX 4060", "Máy tính xách tay M3 Air 13.6 inch", "PC Lắp ráp Đồ họa Intel Core i9",
        "Laptop Văn Phòng Mỏng Nhẹ 14 inch", "Máy tính All-in-One Màn Hình 27 inch", "PC Mini Siêu Nhỏ Gọn Cho Văn Phòng"
    ],
    "Quần": [
        "Quần Jean Nam Ống Suông Straight", "Quần Tây Nam Hàn Quốc Slimfit", "Quần Thể Thao Nam Nữ Vải Dù",
        "Quần Shorts Kaki Nam Co Giãn", "Quần Jogger Nữ Phong Cách Sporty", "Quần Kaki Công Sở Tôn Dáng"
    ],
    "Áo": [
        "Áo Thun Nam Nữ Cotton 100% Basic", "Áo Sơ Mi Nam Vải Đũi Cộc Tay", "Áo Khoác Gió Nam Nữ Chống Nắng UV",
        "Áo Hoodie Unisex Form Wide Oversize", "Áo Polo Nam Co Giãn Thoáng Mát", "Áo Len Cổ Lọ Thời Trang Mùa Đông"
    ]
}

DESCS = [
    "Sản phẩm cao cấp được thiết kế hiện đại, mang lại trải nghiệm tối ưu cho người dùng trong mọi hoàn cảnh.",
    "Chất liệu cao cấp chọn lọc kỹ lưỡng, độ bền vượt trội, phong cách tinh tế chuẩn xu hướng.",
    "Tích hợp công nghệ tiên tiến mới nhất, tiết kiệm năng lượng, thân thiện với người sử dụng.",
    "Lựa chọn hàng đầu cho nhu cầu hàng ngày, kiểu dáng sang trọng, dễ dàng kết hợp và sử dụng."
]

def generate_products(total_products=200):
    products = []
    pid = 1
    
    products_per_category = total_products // len(CATEGORIES)
    remainder = total_products % len(CATEGORIES)
    
    for c_idx, category in enumerate(CATEGORIES):
        templates = PRODUCT_TEMPLATES[category]
        target_count = products_per_category + (1 if c_idx < remainder else 0)
        
        for i in range(target_count):
            base_tmpl = templates[i % len(templates)]
            variant_num = (i // len(templates)) + 1
            var_suffix = f" (Phiên bản v{variant_num})" if variant_num > 1 else ""
            
            p_name = f"{base_tmpl}{var_suffix}"
            p_desc = f"{random.choice(DESCS)} Phù hợp danh mục {category}."
            
            if category in ["Điện thoại", "Tablet", "Máy tính"]:
                price = round(random.uniform(150.0, 2500.0), 2)
            elif category == "Phụ kiện điện thoại":
                price = round(random.uniform(5.0, 80.0), 2)
            else:
                price = round(random.uniform(10.0, 120.0), 2)
                
            products.append({
                "_id": str(pid),
                "name": p_name,
                "category": category,
                "description": p_desc,
                "price": price
            })
            pid += 1
            
    print(f"Đã tạo danh sách {len(products)} sản phẩm không thuộc tính ảnh.")
    return products

def generate_users(num_users=10):
    users = [
        {"_id": "1", "name": "Nguyễn Văn Laptop (Tech Enthusiast)"},
        {"_id": "2", "name": "Trần Thị Điện Thoại (Mobile Fan)"},
        {"_id": "3", "name": "Lê Văn Thời Trang (Fashion Lover)"},
        {"_id": "4", "name": "Phạm Gamer (Gaming & PC)"},
        {"_id": "5", "name": "Hoàng Tablet (Tablet & E-reader)"},
        {"_id": "6", "name": "Đỗ Văn Phụ Kiện (Mobile Accessories)"},
        {"_id": "7", "name": "Vũ Thời Trang Nữ (Apparel)"},
        {"_id": "8", "name": "Bùi Văn Phòng (Office Tech)"},
        {"_id": "9", "name": "Đặng Smartphone (Budget Phones)"},
        {"_id": "10", "name": "Người Dùng Thử Nghiệm (Dynamic Tester)"}
    ]
    return users[:num_users]

def generate_interactions(users, products, num_interactions=2000):
    interactions = []
    actions = ["click", "add_to_cart", "rating"]
    action_weights = [0.60, 0.25, 0.15]
    
    # Map user index to primary categories of interest
    user_persona_categories = {
        "1": ["Máy tính", "Phụ kiện điện thoại"],           # Tech / Laptop fan
        "2": ["Điện thoại", "Phụ kiện điện thoại", "Tablet"],# Mobile phone fan
        "3": ["Quần", "Áo"],                                # Fashion lover
        "4": ["Máy tính", "Điện thoại"],                    # Gaming PC / Gaming phone
        "5": ["Tablet", "Phụ kiện điện thoại"],             # Tablet fan
        "6": ["Phụ kiện điện thoại"],                       # Accessories fan
        "7": ["Áo", "Quần"],                                # Apparel
        "8": ["Máy tính", "Tablet"],                        # Office Tech
        "9": ["Điện thoại", "Phụ kiện điện thoại"],         # Budget Phones
        "10": ["Máy tính"]                                  # Tester with 1 initial Laptop interaction
    }
    
    for user in users:
        u_id = user["_id"]
        pref_cats = user_persona_categories.get(u_id, ["Máy tính", "Điện thoại"])
        
        # Available products in user's preferred categories
        fav_prods = [p for p in products if p["category"] in pref_cats]
        other_prods = [p for p in products if p["category"] not in pref_cats]
        
        # User 10 gets only 2 initial interactions to be clean for dynamic real-time web testing
        u_count = 3 if u_id == "10" else random.randint(80, 150)
        
        for _ in range(u_count):
            # 92% of the time, user interacts with preferred categories!
            if random.random() < 0.92 and fav_prods:
                prod = random.choice(fav_prods)
            else:
                prod = random.choice(other_prods)
                
            act = random.choices(actions, weights=action_weights, k=1)[0]
            
            interaction = {
                "user_id": u_id,
                "product_id": prod["_id"],
                "action": act,
                "timestamp": datetime.now().astimezone().isoformat()
            }
                
            interactions.append(interaction)
            
    return interactions

if __name__ == "__main__":
    print("Đang xóa dữ liệu cũ và khởi tạo dữ liệu tương tác theo kịch bản Persona thực tế...")
    
    try:
        supabase.table('interactions').delete().neq('id', 0).execute()
        print("✓ Đã xóa toàn bộ dữ liệu interactions cũ thành công!")
    except Exception as e:
        print("Lỗi khi xóa interactions:", e)
        
    try:
        supabase.table('products').delete().neq('_id', '0').execute()
        print("✓ Đã làm sạch dữ liệu products!")
    except Exception as e:
        print("Lỗi khi xóa products:", e)
        
    try:
        supabase.table('users').delete().neq('_id', '0').execute()
        print("✓ Đã làm sạch dữ liệu users!")
    except Exception as e:
        print("Lỗi khi xóa users:", e)

    prods = generate_products(200)
    usrs = generate_users(10)
    inters = generate_interactions(usrs, prods)

    for i in range(0, len(prods), 50):
        supabase.table('products').insert(prods[i:i+50]).execute()
        
    supabase.table('users').insert(usrs).execute()
    
    for i in range(0, len(inters), 500):
        supabase.table('interactions').insert(inters[i:i+500]).execute()
        
    print(f"✓ Hoàn tất nạp {len(prods)} sản phẩm, {len(usrs)} người dùng và {len(inters)} tương tác kịch bản thực tế vào Supabase!")

