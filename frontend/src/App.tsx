import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Product, RecUser } from './types';
import { PRODUCTS, USERS } from './data/products';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import { getCollaborativeRecommendations } from './services/recommendationService';

export default function App() {
  // --- 1. Configurations & States ---
  const [selectedUser, setSelectedUser] = useState<RecUser>(USERS[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartCount, setCartCount] = useState<number>(0);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [viewedProductTitles, setViewedProductTitles] = useState<string[]>([]);

  // --- 2. Interactive UI Handlers ---
  useEffect(() => {
    const loadRecommendations = async () => {
      const baseHistory = selectedUser.history
        .map((asin) => PRODUCTS.find((product) => product.parent_asin === asin)?.title)
        .filter(Boolean) as string[];
      const viewedTitles = [...baseHistory, ...viewedProductTitles].filter(Boolean);
      const recs = await getCollaborativeRecommendations(viewedTitles, 30);
      setRecommendedProducts(recs);
    };

    loadRecommendations();
  }, [selectedUser, viewedProductTitles]);

  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setViewedProductTitles((prev) => {
      const next = [product.title, ...prev.filter((title) => title !== product.title)].slice(0, 8);
      return next;
    });
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    setCartCount(prev => prev + 1);
    triggerToast(`🛒 Đã thêm vào giỏ hàng: ${product.title.substring(0, 25)}...`);
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  // Filter main products grid based on search bar
  const filteredProducts = PRODUCTS.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      p.parent_asin.toLowerCase().includes(query) ||
      p.main_category.toLowerCase().includes(query) ||
      p.store.toLowerCase().includes(query) ||
      p.categories.some(c => c.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex flex-col text-zinc-800" id="app-container">
      {/* 1. Header Bar */}
      <Header
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        isSandboxActive={false}
      />

      {/* 2. Main Storefront Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6" id="storefront-container">
        
        {searchQuery ? (
          /* Search results column */
          <div className="bg-white rounded-xl border border-zinc-200/80 p-6 shadow-sm">
            <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide mb-4">
              Kết quả tìm kiếm cho "{searchQuery}" ({filteredProducts.length} sản phẩm)
            </h2>
            {filteredProducts.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-10 text-center">
                <p className="text-sm text-zinc-600 font-semibold">Không tìm thấy sản phẩm phù hợp với từ khóa của bạn.</p>
                <p className="text-xs text-zinc-500 mt-1">Thử tìm kiếm các từ khóa chung như "Sony", "Coffee", "Yoga", hoặc danh mục.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p) => (
                  <ProductCard 
                    key={p.parent_asin}
                    product={p}
                    onViewDetails={handleViewProductDetails}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Standard Store Home View with Carousel & Catalog Grid */
          <div className="space-y-6">
            
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm text-left">
              <div className="border-b border-zinc-100 pb-3 mb-4">
                <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide">
                  Gợi ý cho bạn ({recommendedProducts.length} sản phẩm)
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Dựa trên hành vi xem và lịch sử tương tác của người dùng, hệ thống dùng collaborative filtering để đề xuất.
                </p>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar scroll-smooth">
                {recommendedProducts.map((product) => (
                  <ProductCard
                    key={product.parent_asin}
                    product={product}
                    onViewDetails={handleViewProductDetails}
                    onAddToCart={handleAddToCart}
                    isRecommendation={true}
                  />
                ))}
              </div>
            </div>

            {/* ROW 2: "All Products" list */}
            <div id="catalog-row" className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm text-left">
              <div className="border-b border-zinc-100 pb-3 mb-4">
                <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide">
                  Danh sách sản phẩm ({PRODUCTS.length} mặt hàng)
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Duyệt qua danh mục. Nhấp vào bất kỳ sản phẩm nào để xem chi tiết thông số kỹ thuật và đánh giá.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {PRODUCTS.map((product) => (
                  <ProductCard 
                    key={product.parent_asin}
                    product={product}
                    onViewDetails={handleViewProductDetails}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* 3. Product Details Modal View */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onViewProduct={handleViewProductDetails}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 4. Simple action Toast indicator */}
      {showToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-zinc-900 text-white font-sans text-xs px-4 py-2.5 rounded-lg shadow-2xl border border-white/10 flex items-center gap-2 animate-bounce">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold">{showToast}</span>
        </div>
      )}
    </div>
  );
}
