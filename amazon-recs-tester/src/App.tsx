import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Product, RecUser } from './types';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';

// Helper to map backend product to frontend Product type
export const mapProduct = (apiProduct: any): Product => ({
  parent_asin: apiProduct._id,
  title: apiProduct.name,
  main_category: apiProduct.category,
  categories: [apiProduct.category],
  price: apiProduct.price,
  description: [apiProduct.description],
  average_rating: 4.5,
  rating_number: Math.floor(Math.random() * 500) + 10,
  features: ["Chất lượng cao", "Bền bỉ", "Thiết kế đẹp"],
  store: 'AI Store',
  details: {},
  bought_together: [],
  image_url: apiProduct.image_url
});

const API_BASE_URL = 'http://localhost:8000/api';

export default function App() {
  // --- 1. Configurations & States ---
  const [users, setUsers] = useState<RecUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RecUser | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [showToast, setShowToast] = useState<string | null>(null);

  // API States
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 2. Fetch Data ---
  useEffect(() => {
    fetch(`${API_BASE_URL}/users`)
      .then(res => res.json())
      .then(data => {
        const mappedUsers: RecUser[] = data.map((u: any, idx: number) => {
          const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-pink-500'];
          return {
            id: u._id,
            name: u.name,
            avatarColor: colors[idx % colors.length],
            persona: '',
            history: [],
            preferredCategories: []
          };
        });
        setUsers(mappedUsers);
        if (mappedUsers.length > 0) {
          setSelectedUser(mappedUsers[0]);
        }
      })
      .catch(err => console.error("Error fetching users:", err));
  }, []);

  const fetchRecommendations = (userId: string) => {
    setLoading(true);
    fetch(`${API_BASE_URL}/recommendations/home?user_id=${userId}&limit=50`)
      .then(res => res.json())
      .then(data => {
        setRecommendations(data.map(mapProduct));
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching home recommendations:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (selectedUser) {
      fetchRecommendations(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`${API_BASE_URL}/products?q=${encodeURIComponent(searchQuery)}&limit=50`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.map(mapProduct));
          setIsSearching(false);
        })
        .catch(err => {
          console.error("Error searching products:", err);
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // --- 3. Interactive UI Handlers ---
  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);

    if (!selectedUser) return;
    // Log interaction to backend
    fetch(`${API_BASE_URL}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: selectedUser.id,
        product_id: product.parent_asin,
        action: 'click'
      })
    })
    .then(() => fetchRecommendations(selectedUser.id))
    .catch(err => console.error("Error logging interaction:", err));
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    setCartCount(prev => prev + 1);
    triggerToast(`🛒 Đã thêm vào giỏ hàng: ${product.title.substring(0, 25)}...`);

    if (!selectedUser) return;
    fetch(`${API_BASE_URL}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: selectedUser.id,
        product_id: product.parent_asin,
        action: 'add_to_cart'
      })
    })
    .then(() => fetchRecommendations(selectedUser.id))
    .catch(err => console.error("Error logging interaction:", err));
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  // Search functionality is now handled by the backend

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex flex-col text-zinc-800" id="app-container">
      {/* 1. Header Bar */}
      <Header
        users={users}
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
              Kết quả tìm kiếm cho "{searchQuery}" {isSearching ? "..." : `(${searchResults.length} sản phẩm)`}
            </h2>
            {isSearching ? (
              <div className="py-10 text-center text-zinc-500">Đang tìm kiếm...</div>
            ) : searchResults.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-10 text-center">
                <p className="text-sm text-zinc-600 font-semibold">Không tìm thấy sản phẩm phù hợp với từ khóa của bạn.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map((p) => (
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
          /* Standard Store Home View (Now completely Recommendation-based) */
          <div className="space-y-6">

            <div id="catalog-row" className="bg-white border border-indigo-200/80 rounded-xl p-5 shadow-sm text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <div className="border-b border-zinc-100 pb-3 mb-4">
                <h3 className="text-sm font-extrabold text-indigo-700 uppercase tracking-wide flex items-center gap-2">
                  ✨ Dành riêng cho {selectedUser?.name} {selectedUser?.persona && `- ${selectedUser.persona}`} ({recommendations.length} mặt hàng)
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Danh sách sản phẩm được cá nhân hóa hoàn toàn dựa trên lịch sử xem hàng (Collaborative Filtering).
                </p>
              </div>

              {loading ? (
                <div className="py-10 text-center text-zinc-500">Đang phân tích dữ liệu và tìm gợi ý...</div>
              ) : recommendations.length === 0 ? (
                <div className="py-10 text-center text-zinc-500">Không có dữ liệu gợi ý nào.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recommendations.map((product) => (
                    <ProductCard
                      key={product.parent_asin}
                      product={product}
                      onViewDetails={handleViewProductDetails}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
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
