import React, { useEffect, useState } from 'react';
import { X, Star, ThumbsUp, ShieldCheck, ShoppingCart, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { REVIEWS } from '../data/products';
import ProductCard from './ProductCard';
import { mapProduct, API_BASE_URL } from '../config';
import { supabase } from '../lib/supabase';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onRateProduct?: (product: Product, rating: number) => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onViewProduct,
  onAddToCart,
  onRateProduct
}: ProductDetailModalProps) {
  const [userRating, setUserRating] = useState<number | null>(null);

  const handleRate = (score: number) => {
    setUserRating(score);
    if (onRateProduct) {
      onRateProduct(product, score);
    }
  };

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  const fetchRelatedFromSupabase = async () => {
    try {
      const { data: allProducts } = await supabase.from('products').select('*');
      if (!allProducts || allProducts.length === 0) return;

      const currentCat = product.main_category || (product.categories && product.categories[0]) || '';
      
      // Products in same category excluding current product
      const sameCat = allProducts.filter((p: any) => String(p._id) !== String(product.parent_asin) && p.category === currentCat);
      const otherCat = allProducts.filter((p: any) => String(p._id) !== String(product.parent_asin) && p.category !== currentCat);

      const combined = [...sameCat, ...otherCat].slice(0, 10);
      setRelatedProducts(combined.map(mapProduct));
    } catch (err) {
      console.error("Error fetching related products from Supabase fallback:", err);
    }
  };

  // Fetch related products (Content-Based Filtering)
  useEffect(() => {
    setLoadingRelated(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);

    fetch(`${API_BASE_URL}/recommendations/related/${product.parent_asin}?limit=10`, {
      signal: controller.signal
    })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then(data => {
        setRelatedProducts(data.map(mapProduct));
        setLoadingRelated(false);
      })
      .catch(async () => {
        await fetchRelatedFromSupabase();
        setLoadingRelated(false);
      });
  }, [product.parent_asin]);

  // Filter reviews matching this specific parent_asin
  const productReviews = REVIEWS.filter(
    r => r.parent_asin.toUpperCase() === product.parent_asin.toUpperCase()
  );

  // Format UNIX timestamp to standard date
  const formatDate = (unix: number) => {
    return new Date(unix * 1000).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Auto-scroll modal content to top when a new product is selected
  useEffect(() => {
    const scrollContainer = document.getElementById('product-modal-scroll');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [product]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 select-text font-sans" style={{ backdropFilter: 'blur(2px)' }}>
      <div
        className="relative bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200"
        id={`product-modal-${product.parent_asin}`}
      >
        {/* 1. Header with Title & Close button */}
        <div className="flex justify-between items-center bg-zinc-50 border-b border-zinc-200 px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-200/60 px-2.5 py-0.5 rounded-full tracking-wider border border-zinc-300 font-mono">
              MÃ SP: {product.parent_asin}
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-xs text-zinc-600 font-semibold">{product.main_category}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-full transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Scrollable Body Content */}
        <div
          className="flex-1 overflow-y-auto p-6"
          id="product-modal-scroll"
        >
          {/* Main Info Split Grid: Details + Interactive Specs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">

            {/* Visual Placeholder Cover (Left 5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="aspect-square bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col items-center justify-center p-6 text-center select-none shadow-inner overflow-hidden relative">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{product.store}</span>
                <div className="my-5 w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                  <span className="font-mono text-2xl font-bold uppercase">{product.parent_asin.slice(-4)}</span>
                </div>

                <div className="absolute bottom-4 left-0 right-0 z-10 flex flex-col items-center">
                  <span className="text-[10px] text-zinc-600 font-bold block mb-1 drop-shadow-md">MÃ KHÓA SẢN PHẨM</span>
                  <span className="font-mono text-base font-black tracking-wider text-zinc-800 bg-white/90 px-3 py-1.5 rounded border border-zinc-200/80 shadow-sm">
                    {product.parent_asin}
                  </span>
                </div>
              </div>

              {/* Instant Purchase action block */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-zinc-500 font-medium text-xs">Giá bán:</span>
                  <div className="flex items-baseline text-zinc-900">
                    <span className="text-sm font-bold text-zinc-400 mr-0.5">$</span>
                    <span className="text-2xl font-black">{Math.floor(product.price)}</span>
                    <span className="text-sm font-bold text-zinc-600">{(product.price % 1).toFixed(2).substring(1)}</span>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 leading-normal">
                  Miễn phí giao hàng <strong className="text-indigo-600">✓ prime</strong> siêu tốc. Giao trực tiếp từ kho.
                </div>
                <button
                  onClick={(e) => onAddToCart(product, e)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/30 rounded-lg text-xs text-white font-bold active:ring-2 active:ring-indigo-300/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <ShoppingCart className="h-4 w-4 shrink-0" />
                  <span>Thêm vào giỏ hàng</span>
                </button>
              </div>
            </div>

            {/* Product description specifications (Right 7 cols) */}
            <div className="md:col-span-7 flex flex-col gap-4 text-left font-sans">
              <div>
                <span className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer">
                  Thương hiệu: {product.store}
                </span>
                <h1 className="text-lg md:text-xl font-bold text-zinc-900 mt-1 leading-snug">
                  {product.title}
                </h1>
              </div>

              {/* Rating block */}
              <div className="flex flex-col gap-2 border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(product.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-zinc-800 text-sm">{product.average_rating} trên 5 sao</span>
                  <span className="text-zinc-400 text-xs">({product.rating_number.toLocaleString()} đánh giá)</span>
                </div>

                {/* Interactive user rating */}
                <div className="flex items-center gap-2 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100/80">
                  <span className="text-xs font-bold text-indigo-900">Đánh giá của bạn:</span>
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        className="hover:scale-125 transition-transform cursor-pointer p-0.5"
                        title={`Đánh giá ${star} sao`}
                      >
                        <Star
                          className={`h-4 w-4 ${userRating && star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 hover:text-amber-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  {userRating && (
                    <span className="text-xs font-bold text-emerald-600 ml-1">✓ Đã đánh giá {userRating} sao!</span>
                  )}
                </div>
              </div>

              {/* Description blocks */}
              {product.description.length > 0 && (
                <div>
                  <h4 className="font-bold text-zinc-900 text-xs mb-1 uppercase tracking-wide">Mô tả sản phẩm</h4>
                  <div className="text-zinc-500 text-xs leading-relaxed space-y-1.5">
                    {product.description.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Recommendation system list under details */}
          <div className="border-t border-zinc-200 pt-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-indigo-700 uppercase tracking-wide flex items-center gap-2">
                  <span>Sản phẩm gợi ý liên quan</span>
                </h3>
                <span className="text-xs text-zinc-400 font-medium">Gợi ý các mặt hàng có nội dung và danh mục tương tự.</span>
              </div>
            </div>

            {loadingRelated ? (
              <div className="h-32 flex flex-col items-center justify-center border border-zinc-200 rounded-xl bg-zinc-50 p-4 text-center">
                <span className="text-xs font-bold text-zinc-500 block mb-1">Đang tìm sản phẩm tương tự...</span>
              </div>
            ) : relatedProducts.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border border-zinc-200 rounded-xl bg-zinc-50 p-4 text-center">
                <span className="text-xs font-bold text-zinc-500 block mb-1">KHÔNG CÓ GỢI Ý NÀO</span>
              </div>
            ) : (
              <div className="relative">
                {/* Horizontal Scrolling wrapper */}
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                  {relatedProducts.map((p) => (
                    <ProductCard
                      key={`related-${p.parent_asin}`}
                      product={p}
                      onViewDetails={onViewProduct}
                      isRecommendation={true}
                    />
                  ))}
                </div>
                {/* Side indicators */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none bg-gradient-to-l from-white to-transparent w-12 h-32 flex items-center justify-end pr-2">
                  <ArrowRight className="h-5 w-5 text-zinc-300 animate-bounce" />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
