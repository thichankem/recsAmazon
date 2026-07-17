import React from 'react';
import { Star, Eye, Tag, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart?: (product: Product, e: React.MouseEvent) => void;
  isRecommendation?: boolean;
  key?: any;
}

export default function ProductCard({
  product,
  onViewDetails,
  onAddToCart,
  isRecommendation = false
}: ProductCardProps) {
  // Generate a distinct category color theme for the placeholder
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'Electronics':
        return {
          bg: 'from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100',
          border: 'border-indigo-100',
          badge: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
          text: 'text-indigo-600',
          accent: 'bg-indigo-600'
        };
      case 'Home & Kitchen':
        return {
          bg: 'from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100',
          border: 'border-emerald-100',
          badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
          text: 'text-emerald-600',
          accent: 'bg-emerald-600'
        };
      case 'Sports & Outdoors':
        return {
          bg: 'from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100',
          border: 'border-amber-100',
          badge: 'bg-amber-100 text-amber-800 border border-amber-200',
          text: 'text-amber-600',
          accent: 'bg-amber-600'
        };
      case 'Office Products':
        return {
          bg: 'from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100',
          border: 'border-purple-100',
          badge: 'bg-purple-100 text-purple-800 border border-purple-200',
          text: 'text-purple-600',
          accent: 'bg-purple-600'
        };
      case 'Books':
        return {
          bg: 'from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100',
          border: 'border-rose-100',
          badge: 'bg-rose-100 text-rose-800 border border-rose-200',
          text: 'text-rose-600',
          accent: 'bg-rose-600'
        };
      default:
        return {
          bg: 'from-zinc-50 to-slate-50 hover:from-zinc-100 hover:to-slate-100',
          border: 'border-zinc-100',
          badge: 'bg-zinc-100 text-zinc-800 border border-zinc-200',
          text: 'text-zinc-600',
          accent: 'bg-zinc-600'
        };
    }
  };

  const theme = getCategoryTheme(product.main_category);

  return (
    <div 
      className={`group flex flex-col bg-white border ${isRecommendation ? 'border-indigo-100/80 shadow-indigo-500/5' : 'border-zinc-200/80'} hover:border-indigo-500 rounded-xl shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden text-zinc-700 text-xs text-left cursor-pointer ${
        isRecommendation ? 'w-56 shrink-0' : 'w-full'
      }`}
      onClick={() => onViewDetails(product)}
      id={`product-card-${product.parent_asin}`}
    >
      {/* 1. ASIN Placeholder Graphic */}
      <div className={`relative h-32 bg-gradient-to-br ${theme.bg} flex flex-col items-center justify-center border-b border-zinc-100 transition-colors duration-200 p-4`}>
        {/* Category Tag */}
        <span className={`absolute top-2 left-2 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${theme.badge}`}>
          {product.main_category}
        </span>

        {/* ASIN display */}
        <div className="font-mono text-center">
          <span className="text-[10px] text-zinc-400 font-semibold tracking-wide uppercase block">ASIN Key</span>
          <span className="text-xs font-black text-zinc-700 tracking-wider select-all bg-white/80 px-2.5 py-1 rounded border border-zinc-200/60 inline-block mt-0.5 font-mono shadow-xs">
            {product.parent_asin}
          </span>
        </div>

        {/* Action icons on hover */}
        <div className="absolute inset-0 bg-zinc-950/5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2">
          <button className="p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform">
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Content Info */}
      <div className="p-3 flex-1 flex flex-col gap-1.5 font-sans">
        {/* Brand Store */}
        <span className="text-[10px] text-zinc-400 font-bold truncate uppercase tracking-wider block">
          {product.store}
        </span>

        {/* Title */}
        <h3 className="font-bold text-zinc-900 text-[12px] leading-tight line-clamp-2 h-8 group-hover:text-indigo-600 transition-colors">
          {product.title}
        </h3>

        {/* Ratings block */}
        <div className="flex items-center gap-1 mt-0.5">
          <div className="flex text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`h-3 w-3 ${i < Math.floor(product.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`} 
              />
            ))}
          </div>
          <span className="font-semibold text-zinc-800 text-[11px]">{product.average_rating}</span>
          <span className="text-zinc-400 text-[10px]">({product.rating_number.toLocaleString()})</span>
        </div>

        {/* Price & Prime */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
          <div className="flex items-baseline">
            <span className="text-xs text-zinc-400 font-medium mr-0.5">$</span>
            <span className="text-base font-extrabold text-zinc-900 leading-none">
              {Math.floor(product.price)}
            </span>
            <span className="text-xs font-semibold leading-none text-zinc-500">
              {(product.price % 1).toFixed(2).substring(1)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-extrabold tracking-tight">
            <span>✓ prime</span>
          </div>
        </div>

        {/* Simple inline buttons */}
        {onAddToCart && (
          <button 
            onClick={(e) => onAddToCart(product, e)}
            className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/30 rounded text-[11px] text-white font-semibold active:ring-2 active:ring-indigo-300/40 transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
          >
            <ShoppingCart className="h-3 w-3 shrink-0" />
            <span>Thêm vào giỏ</span>
          </button>
        )}
      </div>
    </div>
  );
}
