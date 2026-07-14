Kiến trúc sư Hệ thống + Phản biện code

** 1.

Hệ Thống Gợi Ý Sản Phẩm 

1. dataset: https://amazon-reviews-2023.github.io/

2. data field:

* User Reviews
rating (float): Rating of the product (from 1.0 to 5.0).
title (str): Title of the user review.
text (str): Text body of the user review.
images (list): Images that users post after they have received the product. Each image has different sizes (small, medium, large), represented by the small_image_url, medium_image_url, and large_image_url respectively.
asin (str): ID of the product.
parent_asin (str): Parent ID of the product. Note: Products with different colors, styles, sizes usually belong to the same parent ID. The “asin” in previous Amazon datasets is actually parent ID. Please use parent ID to find product meta.
user_id (str): ID of the reviewer.
timestamp (int): Time of the review (unix time).
verified_purchase (bool): User purchase verification.
helpful_vote (int): Helpful votes of the review.

* Item Metadata 
main_category (str): Main category (i.e., domain) of the product.
title (str): Name of the product.
average_rating (float): Rating of the product shown on the product page.
rating_number (int): Number of ratings in the product.
features (list): Bullet-point format features of the product.
description (list): Description of the product.
price (float): Price in US dollars (at time of crawling).
images (list): Images of the product. Each image has different sizes (thumb, large, hi_res). The “variant” field shows the position of image.
videos (list): Videos of the product including title and url.
store (str): Store name of the product.
categories (list): Hierarchical categories of the product.
details (dict): Product details, including materials, brand, sizes, etc.
parent_asin (str): Parent ID of the product.
bought_together (list): Recommended bundles from the websites.


3. Bài toán: gợi ý các sản phẩm phù hợp nhất cho người dùng sử dụng công nghệ mới nhất 2026

4. Điều kiện phần cứng: toàn bộ triển khai phát triển trên 1 laptop chip ryzen 7 7840, gpu rtx4080, ram 6gb trống

Hãy đề xuất ý tưởng, công nghệ, kiến trúc hệ thống ngắn gọn xúc tích để tôi kiểm thử với các AI khác.