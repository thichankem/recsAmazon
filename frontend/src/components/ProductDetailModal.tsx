import React, { useEffect, useState } from 'react';
import { X, Star, ThumbsUp, ShieldCheck, ShoppingCart, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { REVIEWS } from '../data/products';
import ProductCard from './ProductCard';
import { getContentRecommendations } from '../services/recommendationService';

interface ProductDetailModalProps {
  product: Product;
  catalogProducts: Product[];
  onClose: () => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export default function ProductDetailModal({
  product,
  catalogProducts,
  onClose,
  onViewProduct,
  onAddToCart
}: ProductDetailModalProps) {
  
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

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

  useEffect(() => {
    let isMounted = true;
    const loadRecommendations = async () => {
      setIsLoadingRecommendations(true);
      const fallback = catalogProducts.filter(
        (p) => p.main_category === product.main_category && p.parent_asin !== product.parent_asin
      ).slice(0, 5);

      const contentRecommendations = await getContentRecommendations(
        `${product.title}\n${product.description.join('\n')}\n${product.features.join('\n')}\n${Object.entries(product.details).map(([key, val]) => `${key}: ${val}`).join('\n')}`,
        product.description.join(' '),
        catalogProducts,
        5
      );

      if (!isMounted) return;
      setRelatedProducts(contentRecommendations.length > 0 ? contentRecommendations : fallback);
      setIsLoadingRecommendations(false);
    };

    loadRecommendations();
    return () => {
      isMounted = false;
    };
  }, [product]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 select-text font-sans">
      <div 
        className="relative bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200"
        id={`product-modal-${product.parent_asin}`}
      >
        {/* 1. Header with Title & Close button */}
        <div className="flex justify-between items-center bg-zinc-50 border-b border-zinc-200 px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-200/60 px-2.5 py-0.5 rounded-full tracking-wider border border-zinc-300 font-mono">
              MÃ ASIN: {product.parent_asin}
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
            
            {/* Visual ASIN Placeholder Cover (Left 5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="aspect-square bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col items-center justify-center p-6 text-center select-none shadow-inner">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{product.store}</span>
                
                {/* Big developer icon */}
                <div className="my-5 w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                  <span className="font-mono text-2xl font-bold uppercase">{product.parent_asin.slice(-4)}</span>
                </div>
                
                <span className="text-[10px] text-zinc-400 font-bold block mb-1">MÃ KHÓA SẢN PHẨM</span>
                <span className="font-mono text-base font-black tracking-wider text-zinc-800 bg-zinc-100 px-3 py-1.5 rounded border border-zinc-200/80">
                  {product.parent_asin}
                </span>

                <div className="text-[10px] text-zinc-400 font-medium italic max-w-xs mt-4 leading-normal">
                  Sản phẩm hiển thị thông tin ASIN chuẩn để đối chiếu liên kết dữ liệu hệ thống.
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
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
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

              {/* Key Features Bullet points */}
              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1.5 uppercase tracking-wide">Về mặt hàng này</h4>
                <ul className="list-disc pl-4 space-y-1 text-zinc-600 text-xs">
                  {product.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
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

              {/* Technical specification details dictionary */}
              <div className="mt-2">
                <h4 className="font-bold text-zinc-900 text-xs mb-1.5 uppercase tracking-wide">Thông số chi tiết</h4>
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <tbody>
                      {Object.entries(product.details).map(([key, val], idx) => (
                        <tr 
                          key={key} 
                          className={idx % 2 === 0 ? 'bg-zinc-50' : 'bg-transparent'}
                        >
                          <td className="px-3 py-1.5 font-bold text-zinc-500 border-r border-zinc-200 w-1/3">{key}</td>
                          <td className="px-3 py-1.5 font-medium text-zinc-700">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Product Reviews column */}
          <div className="border-t border-zinc-200 pt-6 mb-8 text-left">
            <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span>Phản hồi khách hàng ({productReviews.length})</span>
            </h3>

            {productReviews.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Chưa có đánh giá nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Review summary stats (3 cols) */}
                <div className="md:col-span-4 bg-zinc-50 p-4 border border-zinc-200 rounded-xl h-fit">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-black text-zinc-800">{product.average_rating}</span>
                    <div>
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.average_rating) ? 'fill-amber-400' : 'text-zinc-200'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-400">Đánh giá trung bình</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-[10px] text-zinc-500 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="w-10 text-right">5 sao</span>
                      <div className="flex-1 h-2 bg-zinc-200 rounded overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: '75%' }} />
                      </div>
                      <span className="w-6 text-right">75%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-10 text-right">4 sao</span>
                      <div className="flex-1 h-2 bg-zinc-200 rounded overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: '15%' }} />
                      </div>
                      <span className="w-6 text-right">15%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-10 text-right">3 sao</span>
                      <div className="flex-1 h-2 bg-zinc-200 rounded overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: '7%' }} />
                      </div>
                      <span className="w-6 text-right">7%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-10 text-right">2 sao</span>
                      <div className="flex-1 h-2 bg-zinc-200 rounded overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: '3%' }} />
                      </div>
                      <span className="w-6 text-right">3%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-10 text-right">1 sao</span>
                      <div className="flex-1 h-2 bg-zinc-200 rounded overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: '0%' }} />
                      </div>
                      <span className="w-6 text-right">0%</span>
                    </div>
                  </div>
                </div>

                {/* Reviews List column (8 cols) */}
                <div className="md:col-span-8 space-y-4">
                  {productReviews.map((review, idx) => (
                    <div 
                      key={idx} 
                      className="border-b border-zinc-100 pb-4 last:border-0"
                      id={`review-${idx}-${product.parent_asin}`}
                    >
                      {/* Reviewer ID & Profile */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-[10px] text-zinc-500 uppercase border border-zinc-200">
                          {review.user_id.slice(4, 6) || 'UR'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-800 text-xs">{review.user_id}</span>
                          <span className="text-[9px] text-zinc-400 font-mono font-semibold">User Hash ID</span>
                        </div>
                      </div>

                      {/* Stars & Title */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400' : 'text-zinc-200'}`} />
                          ))}
                        </div>
                        <span className="font-bold text-zinc-800 text-xs">{review.title}</span>
                      </div>

                      {/* Date & Verification status */}
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium mb-1.5">
                        <span>Đánh giá tại Việt Nam vào {formatDate(review.timestamp)}</span>
                        {review.verified_purchase && (
                          <span className="text-indigo-600 font-extrabold flex items-center gap-0.5">
                            <ShieldCheck className="h-3 w-3 text-indigo-600 shrink-0" />
                            <span>Đã xác minh mua hàng</span>
                          </span>
                        )}
                      </div>

                      {/* Body Review text */}
                      <p className="text-zinc-700 text-xs leading-relaxed mb-2 bg-zinc-50 p-2.5 border border-zinc-200/60 rounded-lg">
                        {review.text}
                      </p>

                      {/* Helpful votes */}
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-semibold">
                        <span>{review.helpful_vote} người thấy đánh giá hữu ích</span>
                        <span className="text-zinc-200">|</span>
                        <button className="flex items-center gap-1 py-0.5 px-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded text-zinc-700 font-bold cursor-pointer transition-colors">
                          <ThumbsUp className="h-3 w-3 text-zinc-400" />
                          <span>Hữu ích</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Recommendation system list under details */}
          <div className="border-t border-zinc-200 pt-6 text-left relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100/50 p-6 mt-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 relative z-10">
              <div>
                <h3 className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                  <span>Sản phẩm gợi ý liên quan</span>
                </h3>
                <span className="text-xs text-zinc-500 font-medium block mt-1">Được đề xuất bởi hệ thống AI dựa trên nội dung mặt hàng này</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-zinc-200 shadow-sm">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">AI Recommendation</span>
              </div>
            </div>

            {isLoadingRecommendations ? (
              <div className="h-32 flex flex-col items-center justify-center border border-zinc-200 rounded-xl bg-zinc-50 p-4 text-center">
                <span className="text-xs font-bold text-indigo-600 block mb-1">Đang tải gợi ý...</span>
              </div>
            ) : relatedProducts.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border border-zinc-200 rounded-xl bg-zinc-50 p-4 text-center">
                <span className="text-xs font-bold text-rose-500 block mb-1">KHÔNG THỂ TẢI GỢI Ý</span>
              </div>
            ) : (
              <div className="relative">
                {/* Horizontal Scrolling wrapper */}
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar scroll-smooth">
                  {relatedProducts.map((p) => (
                    <ProductCard 
                      key={p.parent_asin}
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
