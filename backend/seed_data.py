import random
import sys

sys.stdout.reconfigure(encoding='utf-8')
from database import supabase
from datetime import datetime

# Các danh mục theo yêu cầu
CATEGORIES = ["Phụ kiện điện thoại", "Điện thoại", "Tablet", "Máy tính", "Quần", "Áo"]

# Template dữ liệu chi tiết cho từng danh mục
PRODUCT_TEMPLATES = {
    "Phụ kiện điện thoại": [
        {"name": "Tai nghe Bluetooth Không dây Chống ồn Chủ động Pro", "desc": "Trải nghiệm âm thanh đỉnh cao với tai nghe Bluetooth thế hệ mới. Được trang bị công nghệ chống ồn chủ động (ANC) giúp loại bỏ tạp âm môi trường, mang lại không gian âm nhạc tĩnh lặng. Thời lượng pin lên đến 30 giờ sử dụng liên tục, hỗ trợ sạc nhanh 15 phút cho 3 giờ nghe. Thiết kế in-ear ôm sát, thoải mái đeo suốt cả ngày dài."},
        {"name": "Củ Sạc Nhanh GaN 65W Đa Năng 3 Cổng USB-C", "desc": "Sạc nhanh mọi thiết bị từ điện thoại đến laptop với củ sạc công nghệ GaN tiên tiến. Thiết kế siêu nhỏ gọn, tản nhiệt tốt, an toàn tuyệt đối với chip thông minh chống quá dòng, quá nhiệt. Bao gồm 2 cổng Type-C và 1 cổng USB-A, cho phép sạc cùng lúc 3 thiết bị với tốc độ tối đa."},
        {"name": "Ốp lưng Silicone Chống sốc Cao cấp Trong suốt", "desc": "Bảo vệ toàn diện cho điện thoại của bạn với ốp lưng silicone dẻo dai. Thiết kế đệm khí 4 góc giúp hấp thụ lực va đập tối đa khi rơi rớt. Mặt lưng trong suốt tinh khiết chống ố vàng theo thời gian, giữ nguyên vẻ đẹp nguyên bản của thiết bị. Viền camera được thiết kế nhô cao chống trầy xước ống kính."},
        {"name": "Sạc Dự Phòng 10000mAh Tích hợp Sạc Không Dây Từ Tính", "desc": "Pin sạc dự phòng dung lượng thực 10000mAh, nhỏ gọn nằm gọn trong lòng bàn tay. Tích hợp vòng nam châm hít từ tính siêu chắc chắn, hỗ trợ sạc không dây 15W tiện lợi không cần dây cáp. Cổng Type-C hỗ trợ sạc nhanh hai chiều PD 20W. Màn hình LED nhỏ hiển thị phần trăm pin chính xác."}
    ],
    "Điện thoại": [
        {"name": "Điện thoại Thông minh Ultra 5G Bản 256GB", "desc": "Siêu phẩm smartphone sở hữu màn hình Dynamic AMOLED 2X tần số quét 120Hz siêu mượt mà. Hệ thống camera độ phân giải cao 108MP chụp đêm xuất sắc, zoom quang học 10x. Vi xử lý Snapdragon 8 Gen 2 mạnh mẽ nhất, cân mọi tựa game đồ họa nặng. Khung viền kim loại Titan sang trọng, kính cường lực Victus siêu bền bỉ."},
        {"name": "Điện thoại Phone 15 Pro Max 1TB Titan Tự nhiên", "desc": "Chiếc điện thoại cao cấp với khung viền Titanium chuẩn hàng không vũ trụ, bền và nhẹ hơn bao giờ hết. Trang bị chip A17 Pro với GPU 6 lõi mang lại hiệu năng chơi game đột phá. Hệ thống camera Pro mới hỗ trợ quay video không gian, zoom quang học 5x. Nút Action Button tùy chỉnh phím tắt nhanh chóng."},
        {"name": "Điện thoại Tầm Trung X 5G Pin Trâu 6000mAh", "desc": "Lựa chọn hoàn hảo cho người dùng cần thời lượng pin dài. Máy trang bị viên pin khủng 6000mAh cho thời gian sử dụng lên đến 2 ngày, hỗ trợ sạc nhanh 33W. Màn hình IPS LCD 6.7 inch rộng rãi, chip xử lý tầm trung mượt mà cho các tác vụ hàng ngày và chơi game nhẹ nhàng. Hệ thống 3 camera 50MP sắc nét."}
    ],
    "Tablet": [
        {"name": "Máy tính bảng Pad Pro 11-inch M2 128GB WiFi", "desc": "Chiếc máy tính bảng mạnh mẽ nhất với sức mạnh từ con chip M2. Màn hình Liquid Retina hiển thị màu sắc sống động, độ nhạy cực cao với công nghệ ProMotion 120Hz. Hỗ trợ bút cảm ứng thế hệ 2 cho khả năng vẽ, ghi chú độ trễ gần như bằng không. Phù hợp cho dân thiết kế đồ họa, sáng tạo nội dung và giải trí đỉnh cao."},
        {"name": "Tablet Tab S9 Ultra 14.6 inch 5G", "desc": "Trải nghiệm không gian làm việc và giải trí rộng lớn với màn hình khổng lồ 14.6 inch Dynamic AMOLED 2X tuyệt đẹp. Máy siêu mỏng nhẹ, có khả năng kháng nước kháng bụi chuẩn IP68. Đi kèm bút S-Pen mượt mà, hỗ trợ tính năng chia màn hình làm việc đa nhiệm như một chiếc laptop thực thụ khi kết hợp bao da bàn phím."}
    ],
    "Máy tính": [
        {"name": "Laptop Gaming ROG Strix 15.6 inch RTX 4060", "desc": "Cỗ máy chiến game thực thụ với vi xử lý Intel Core i7 thế hệ 13 và card đồ họa NVIDIA RTX 4060 8GB mạnh mẽ. Màn hình 15.6 inch FHD tần số quét 165Hz cho hình ảnh cực kỳ mượt mà, chống xé hình. Hệ thống tản nhiệt chất lỏng kim loại tiên tiến, đảm bảo máy luôn mát mẻ trong những trận chiến kéo dài. Bàn phím LED RGB từng phím cực chất."},
        {"name": "Máy tính xách tay M3 Air 13.6 inch 256GB", "desc": "Chiếc laptop siêu mỏng nhẹ, sang trọng, thời lượng pin lên đến 18 giờ. Trang bị con chip M3 thế hệ mới mang lại hiệu suất làm việc văn phòng, chỉnh sửa ảnh/video vượt trội mà hoàn toàn không cần quạt tản nhiệt. Màn hình Liquid Retina viền mỏng tuyệt đẹp, webcam 1080p sắc nét cho các cuộc gọi video chất lượng cao."},
        {"name": "PC Lắp ráp Đồ họa & Render Intel Core i9, 32GB RAM", "desc": "Hệ thống máy tính để bàn (PC Custom) cấu hình siêu khủng dành riêng cho dân thiết kế 3D, dựng phim và render. Trang bị vi xử lý Intel Core i9, RAM 32GB DDR5 tốc độ cao, và ổ cứng SSD NVMe 1TB tốc độ đọc ghi lên tới 7000MB/s. Vỏ case kính cường lực kèm hệ thống quạt tản nhiệt nước AIO LED RGB bắt mắt."}
    ],
    "Quần": [
        {"name": "Quần Jean Nam Ống Suông Form Straight Thoải Mái", "desc": "Quần jean nam kiểu dáng ống suông (straight) cổ điển, mang lại cảm giác thoải mái tối đa khi vận động. Chất liệu vải denim cao cấp, độ dày vừa phải, co giãn nhẹ, giữ form dáng tốt sau nhiều lần giặt. Màu xanh vintage dễ dàng phối cùng áo thun, sơ mi hay áo khoác, phù hợp cho mọi hoàn cảnh từ đi chơi đến đi làm."},
        {"name": "Quần Tây Nam Hàn Quốc Ống Slimfit Thanh Lịch", "desc": "Chiếc quần tây chuẩn phong cách lịch lãm, form slimfit tôn dáng, ôm vừa phải không gây gò bó. Chất liệu vải tuyết mưa nhập khẩu mềm mịn, chống nhăn, ít bám bụi, đường may tỉ mỉ, phom quần giữ nếp cực tốt. Thích hợp mặc cùng sơ mi trơn và giày âu tạo phong cách công sở chuyên nghiệp."},
        {"name": "Quần Thể Thao Nam Nữ Vải Dù Chống Nước Nhẹ", "desc": "Quần thể thao năng động làm từ chất liệu vải dù gió (polyester) siêu nhẹ, thoáng khí và có khả năng trượt nước nhẹ. Lưng chun co giãn có dây rút linh hoạt. Thiết kế túi hai bên rộng rãi, có khóa kéo an toàn. Form dáng jogger bo gấu mang lại vẻ khỏe khoắn, phù hợp để tập gym, chạy bộ hoặc mặc nhà."}
    ],
    "Áo": [
        {"name": "Áo Thun Nam Nữ Cotton 100% Cổ Tròn Basic", "desc": "Áo thun cơ bản (basic tee) không thể thiếu trong tủ đồ. Sử dụng chất liệu 100% cotton chải kỹ 2 chiều, độ dày định lượng 250gsm dặn dặn nhưng cực kỳ thoáng mát, thấm hút mồ hôi tốt. Form áo oversize rộng rãi, đường may cổ áo chạy dây viền chống giãn. Đa dạng màu sắc trung tính dễ dàng phối với nhiều trang phục khác nhau."},
        {"name": "Áo Sơ Mi Nam Vải Đũi Cổ Tàu Cộc Tay Mùa Hè", "desc": "Chiếc sơ mi mùa hè hoàn hảo với thiết kế cổ tàu hiện đại, trẻ trung. Chất liệu vải đũi (linen) thiên nhiên siêu mềm, thấm hút mồ hôi, mang lại cảm giác mát mẻ trong những ngày nóng bức. Form áo regular fit thoải mái. Từng đường kim mũi chỉ được chăm chút tỉ mỉ, phù hợp đi dạo phố, du lịch biển."},
        {"name": "Áo Khoác Gió Nam Nữ Chống Nắng Tia UV Trượt Nước", "desc": "Áo khoác gió đa năng tiện dụng với lớp phủ công nghệ cao giúp chống nắng, chặn tia UV lên đến 98%, đồng thời có khả năng chống thấm nước nhẹ khi gặp mưa phùn. Thiết kế mỏng nhẹ, có thể gấp gọn nhét vừa túi quần hoặc balo. Mũ áo trùm đầu sâu, tay áo có bo thun cản gió. Rất thích hợp cho những chuyến phượt, đi xe máy đường dài."}
    ]
}

def generate_products():
    products = []
    pid = 1
    
    # We will generate about 40-50 products by iterating and duplicating slightly with different colors/variants if needed,
    # or just create a rich list based on templates.
    for category in CATEGORIES:
        templates = PRODUCT_TEMPLATES[category]
        for t in templates:
            # Create a base product
            product = {
                "_id": str(pid),
                "name": t["name"],
                "category": category,
                "description": t["desc"],
                "price": round(random.uniform(20.0, 1500.0), 2) if category in ["Điện thoại", "Tablet", "Máy tính"] else round(random.uniform(5.0, 50.0), 2),
                "image_url": f"https://picsum.photos/seed/{pid + 1000}/400/400"
            }
            products.append(product)
            pid += 1
            
            # Create 1-2 variations of the same product for more data volume
            for var_idx in range(random.randint(1, 2)):
                variant_tags = ["Màu Đen", "Màu Trắng", "Màu Xanh", "Bản Tiêu Chuẩn", "Bản Nâng Cấp"]
                var_name = f"{t['name']} - {random.choice(variant_tags)}"
                var_product = {
                    "_id": str(pid),
                    "name": var_name,
                    "category": category,
                    "description": t["desc"] + f" Đây là phiên bản cấu hình hoặc màu sắc đặc biệt mang lại trải nghiệm độc đáo.",
                    "price": product["price"] * random.uniform(0.9, 1.2),
                    "image_url": f"https://picsum.photos/seed/{pid + 1000}/400/400"
                }
                products.append(var_product)
                pid += 1

    try:
        supabase.table('products').delete().neq('_id', '0').execute()
    except:
        pass
    supabase.table('products').insert(products).execute()
    print(f"Đã xoá dữ liệu cũ và tạo mới {len(products)} sản phẩm.")
    return products

def generate_users(num_users=20):
    users = []
    for i in range(num_users):
        user = {
            "_id": str(i + 1),
            "name": f"Khách hàng {i + 1}"
        }
        users.append(user)
        
    try:
        supabase.table('users').delete().neq('_id', '0').execute()
    except:
        pass
    supabase.table('users').insert(users).execute()
    print(f"Đã xoá dữ liệu cũ và tạo mới {num_users} người dùng.")
    return users

def generate_interactions(users, products, num_interactions=400):
    interactions = []
    for _ in range(num_interactions):
        user = random.choice(users)
        
        # Simulate some users liking specific categories to make CF work better
        preferred_category = random.choice(CATEGORIES)
        if random.random() > 0.4: # 60% chance to pick from preferred category
            available_products = [p for p in products if p["category"] == preferred_category]
            if not available_products:
                available_products = products
            product = random.choice(available_products)
        else:
            product = random.choice(products)
            
        interaction = {
            "user_id": user["_id"],
            "product_id": product["_id"],
            "action": "click",
            "timestamp": datetime.utcnow().isoformat()
        }
        interactions.append(interaction)
        
    try:
        supabase.table('interactions').delete().neq('user_id', '0').execute()
    except:
        pass
    if interactions:
        # Supabase insert limit is usually 1000, we have 400 or 500 so it's fine.
        supabase.table('interactions').insert(interactions).execute()
    print(f"Đã xoá dữ liệu cũ và tạo mới {num_interactions} lịch sử click chuột.")

if __name__ == "__main__":
    print("Đang khởi tạo cơ sở dữ liệu mới với dữ liệu Tiếng Việt chi tiết...")
    products = generate_products()
    users = generate_users(10) # 10 users to match frontend
    generate_interactions(users, products, 500) # lots of interactions for better CF
    print("Hoàn tất!")
