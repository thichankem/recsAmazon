import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Product, RecUser } from './types';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import { mapProduct, API_BASE_URL } from './config';
import { supabase } from './lib/supabase';

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

  const formatUsers = (data: any[]): RecUser[] => {
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-pink-500'];
    return data.map((u: any, idx: number) => ({
      id: u._id,
      name: u.name,
      avatarColor: colors[idx % colors.length],
      persona: '',
      history: [],
      preferredCategories: []
    }));
  };

  // --- 2. Fetch Data ---
  useEffect(() => {
    // Try FastAPI backend first with short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);

    fetch(`${API_BASE_URL}/users`, { signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then(data => {
        const mappedUsers = formatUsers(data);
        setUsers(mappedUsers);
        if (mappedUsers.length > 0) setSelectedUser(mappedUsers[0]);
      })
      .catch(async () => {
        // Fallback directly to Supabase
        try {
          const { data, error } = await supabase.from('users').select('_id, name');
          if (error) throw error;
          const mappedUsers = formatUsers(data || []);
          setUsers(mappedUsers);
          if (mappedUsers.length > 0) setSelectedUser(mappedUsers[0]);
          else setLoading(false);
        } catch (err) {
          console.error("Error fetching users from Supabase:", err);
          setLoading(false);
        }
      });
  }, []);

  const getHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const fetchRecommendationsFromSupabase = async (userId: string) => {
    try {
      const { data: allProducts } = await supabase.from('products').select('*');
      if (!allProducts || allProducts.length === 0) return;

      const { data: rawInteractions } = await supabase
        .from('interactions')
        .select('*');

      const allInteractions = rawInteractions || [];

      if (allInteractions.length > 0) {
        // Calculate user mean ratings for bias normalization
        const userSums: Record<string, number> = {};
        const userCounts: Record<string, number> = {};
        allInteractions.forEach((i: any) => {
          if (i.action === 'rating' || i.rating_score) {
            const u = String(i.user_id);
            const score = i.rating_score ? Number(i.rating_score) : 5;
            userSums[u] = (userSums[u] || 0) + score;
            userCounts[u] = (userCounts[u] || 0) + 1;
          }
        });

        const getWeight = (item: any) => {
          const u = String(item.user_id);
          const act = item.action;
          if (act === 'rating' || item.rating_score) {
            const score = item.rating_score ? Number(item.rating_score) : 5;
            const uMean = userCounts[u] ? (userSums[u] / userCounts[u]) : 3.0;
            return Math.max(0.5, 3.0 + (score - uMean));
          }
          if (act === 'add_to_cart') return 5.0;
          if (act === 'click') return 1.0;
          return 1.0;
        };

        // Target user's interactions
        const targetInteractions = allInteractions.filter((i: any) => String(i.user_id) === String(userId));
        
        // Cold start diversity for users with no interaction history
        if (targetInteractions.length === 0) {
          const categories = Array.from(new Set(allProducts.map((p: any) => p.category).filter(Boolean))).sort();
          if (categories.length > 0) {
            const hashVal = getHash(userId);
            const favCategory = categories[hashVal % categories.length];
            const favProds = [...allProducts.filter((p: any) => p.category === favCategory)];
            const otherProds = [...allProducts.filter((p: any) => p.category !== favCategory)];

            const favSorted = favProds.sort((a: any, b: any) => (getHash(userId + '_' + a._id) % 10007) - (getHash(userId + '_' + b._id) % 10007));
            const otherSorted = otherProds.sort((a: any, b: any) => (getHash(userId + '_' + a._id) % 10007) - (getHash(userId + '_' + b._id) % 10007));

            setRecommendations([...favSorted, ...otherSorted].map(mapProduct));
            return;
          }
        }

        const targetProductSet = new Set(targetInteractions.map((i: any) => String(i.product_id)));

        // Category weights for target user
        const categoryWeights: Record<string, number> = {};
        targetInteractions.forEach((item: any) => {
          const weight = getWeight(item);
          const prod = allProducts.find((p: any) => String(p._id) === String(item.product_id));
          if (prod && prod.category) {
            categoryWeights[prod.category] = (categoryWeights[prod.category] || 0) + weight;
          }
        });

        const totalCatWeight = Object.values(categoryWeights).reduce((a, b) => a + b, 0) || 1;

        // Find similarities with other users based on shared products
        const otherUserSimilarity: Record<string, number> = {};
        allInteractions.forEach((item: any) => {
          const itemUserId = String(item.user_id);
          const itemProdId = String(item.product_id);
          if (itemUserId !== String(userId) && targetProductSet.has(itemProdId)) {
            otherUserSimilarity[itemUserId] = (otherUserSimilarity[itemUserId] || 0) + getWeight(item);
          }
        });

        // Collaborative scores for candidate products from similar users
        const collabScores: Record<string, number> = {};
        allInteractions.forEach((item: any) => {
          const itemUserId = String(item.user_id);
          const itemProdId = String(item.product_id);
          if (itemUserId !== String(userId) && otherUserSimilarity[itemUserId]) {
            const sim = otherUserSimilarity[itemUserId];
            const weight = getWeight(item);
            collabScores[itemProdId] = (collabScores[itemProdId] || 0) + sim * weight;
          }
        });

        // Global product popularity
        const globalPopularity: Record<string, number> = {};
        allInteractions.forEach((item: any) => {
          const itemProdId = String(item.product_id);
          globalPopularity[itemProdId] = (globalPopularity[itemProdId] || 0) + getWeight(item);
        });

        // Score products: Category Affinity gets top priority (200 * catAffinity), Collaborative adds fine tuning (20 * cScore)
        const scoredProducts = allProducts.map((p: any) => {
          const pid = String(p._id);
          const cScore = collabScores[pid] || 0;
          const catWeight = categoryWeights[p.category] || 0;
          const catAffinity = totalCatWeight > 0 ? catWeight / totalCatWeight : 0;
          const popWeight = globalPopularity[pid] || 0;
          const isUnseen = !targetProductSet.has(pid);
          const userTieBreaker = (getHash(userId + '_' + pid) % 1000) / 10000;

          let score = 0;
          if (isUnseen) {
            score = catAffinity * 1000 + cScore * 10 + popWeight * 0.05 + userTieBreaker;
          } else {
            score = catAffinity * 100 + cScore * 2 + popWeight * 0.01 + userTieBreaker;
          }
          return { product: p, score };
        });

        // Sort products by highest score
        scoredProducts.sort((a, b) => b.score - a.score);
        setRecommendations(scoredProducts.map(sp => mapProduct(sp.product)));
      } else {
        // Cold-start when no interactions exist in DB at all
        const hashVal = getHash(userId);
        const sortedProds = [...allProducts].sort((a: any, b: any) => (getHash(userId + '_' + a._id) % 10007) - (getHash(userId + '_' + b._id) % 10007));
        setRecommendations(sortedProds.map(mapProduct));
      }
    } catch (err) {
      console.error("Error fetching recommendations from Supabase:", err);
    }
  };

  const fetchRecommendations = async (userId: string) => {
    setLoading(true);
    setRecommendations([]); // Instantly clear old recommendations on user switch!

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${API_BASE_URL}/recommendations/home?user_id=${userId}&limit=50`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setRecommendations(data.map(mapProduct));
    } catch {
      await fetchRecommendationsFromSupabase(userId);
    } finally {
      setLoading(false);
    }
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
        .then(res => {
          if (!res.ok) throw new Error('API request failed');
          return res.json();
        })
        .then(data => {
          setSearchResults(data.map(mapProduct));
          setIsSearching(false);
        })
        .catch(async () => {
          try {
            const { data } = await supabase.from('products').select('*').ilike('name', `%${searchQuery}%`).limit(50);
            setSearchResults((data || []).map(mapProduct));
          } catch (err) {
            console.error("Error searching products from Supabase:", err);
          } finally {
            setIsSearching(false);
          }
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Helper for instant interaction logging and real-time recommendation updates
  const logInteractionAndRefresh = async (userId: string, productId: string, action: string, ratingScore?: number) => {
    try {
      await supabase.from('interactions').insert({
        user_id: userId,
        product_id: productId,
        action: action
      });
    } catch (err) {
      console.error("Interaction insert error:", err);
    }

    // Optional background log to FastAPI
    fetch(`${API_BASE_URL}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        product_id: productId,
        action: action,
        rating_score: ratingScore
      })
    }).catch(() => {});

    // Instantly refresh recommendations in real-time
    fetchRecommendations(userId);
  };

  // --- 3. Interactive UI Handlers ---
  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    if (selectedUser) {
      logInteractionAndRefresh(selectedUser.id, product.parent_asin, 'click');
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    setCartCount(prev => prev + 1);
    triggerToast(`🛒 Đã thêm vào giỏ hàng: ${product.title.substring(0, 25)}...`);

    if (selectedUser) {
      logInteractionAndRefresh(selectedUser.id, product.parent_asin, 'add_to_cart');
    }
  };

  const handleRateProduct = (product: Product, ratingScore: number) => {
    triggerToast(`⭐ Đã đánh giá ${ratingScore} sao cho: ${product.title.substring(0, 20)}...`);

    if (selectedUser) {
      logInteractionAndRefresh(selectedUser.id, product.parent_asin, 'rating', ratingScore);
    }
  };

  const handleAddUser = async (name: string) => {
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-pink-500'];
    try {
      let newUserObj: RecUser;
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const data = await res.json();
        newUserObj = {
          id: data._id,
          name: data.name,
          avatarColor: colors[users.length % colors.length],
          persona: '',
          history: [],
          preferredCategories: []
        };
      } else {
        throw new Error('Backend API request failed');
      }
      setUsers(prev => [...prev, newUserObj]);
      setSelectedUser(newUserObj);
      triggerToast(`👤 Đã tạo người dùng mới: ${name}`);
    } catch {
      // Fallback directly to Supabase
      try {
        const customId = `user_${Date.now()}`;
        const { data, error } = await supabase.from('users').insert({ _id: customId, name }).select('*');
        if (error) throw error;
        const newUserObj: RecUser = {
          id: data?.[0]?._id || customId,
          name: data?.[0]?.name || name,
          avatarColor: colors[users.length % colors.length],
          persona: '',
          history: [],
          preferredCategories: []
        };
        setUsers(prev => [...prev, newUserObj]);
        setSelectedUser(newUserObj);
        triggerToast(`👤 Đã tạo người dùng mới: ${name}`);
      } catch (err) {
        console.error("Error creating user in Supabase:", err);
        triggerToast(`❌ Lỗi khi tạo người dùng!`);
      }
    }
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
        onAddUser={handleAddUser}
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
                  Danh sách sản phẩm
                </h3>
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
          onRateProduct={handleRateProduct}
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
