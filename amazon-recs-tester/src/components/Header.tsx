import React, { useState } from 'react';
import { ShoppingCart, Search, MapPin, User, ChevronDown, RefreshCw } from 'lucide-react';
import { RecUser } from '../types';

interface HeaderProps {
  users: RecUser[];
  selectedUser: RecUser | null;
  onSelectUser: (user: RecUser) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  isSandboxActive: boolean;
  onResetDatabase?: () => void;
}

export default function Header({
  selectedUser,
  onSelectUser,
  searchQuery,
  onSearchChange,
  cartCount,
  isSandboxActive
}: HeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white text-zinc-800 font-sans text-sm select-none border-b border-zinc-200 shadow-xs">
      {/* Primary header bar */}
      <div className="flex items-center justify-between h-14 px-4 gap-4">
        {/* Logo Style */}
        <div className="flex items-center cursor-pointer py-1 px-2 hover:bg-zinc-100 rounded transition-all" id="header-logo">
          <div className="flex items-center space-x-3">
            <div className="h-4 w-[1px] bg-zinc-200 hidden sm:block"></div>
          </div>
        </div>

        {/* Deliver to Vietnam */}
        <div className="hidden md:flex items-center cursor-pointer py-1 px-2 hover:bg-zinc-100 rounded transition-all" id="header-location">
          <MapPin className="h-5 w-5 mr-1 text-indigo-600" />
          <div className="flex flex-col text-xs">
            <span className="text-zinc-400">Giao đến</span>
            <span className="font-bold text-zinc-700">Việt Nam</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl flex items-center h-10 rounded-lg overflow-hidden bg-zinc-50 border border-zinc-200 group focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all" id="header-search-container">
          <select className="hidden sm:block h-full px-3 text-xs text-zinc-500 bg-zinc-100/50 border-r border-zinc-200 outline-none hover:bg-zinc-100 cursor-pointer font-sans">
            <option>Tất cả danh mục</option>
            <option>Electronics</option>
            <option>Home & Kitchen</option>
            <option>Sports & Outdoors</option>
            <option>Office Products</option>
            <option>Books</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm sản phẩm theo tên, danh mục, thương hiệu..."
            className="flex-1 h-full px-3 bg-transparent text-zinc-800 text-sm outline-none placeholder-zinc-400"
            id="header-search-input"
          />
          <button className="h-full px-6 bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center cursor-pointer text-white">
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* User Switcher */}
        <div className="relative">
          <div
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center cursor-pointer py-1 px-2 hover:bg-zinc-100 rounded text-left gap-2 transition-all"
            id="user-profile-switcher"
          >
            {selectedUser ? (
              <>
                <div className={`h-8 w-8 rounded-full ${selectedUser.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-inner uppercase`}>
                  {selectedUser.name[0]}
                </div>
                <div className="hidden lg:flex flex-col text-xs leading-tight">
                  <span className="text-zinc-400">Người dùng:</span>
                  <span className="font-bold flex items-center gap-1 text-zinc-800">
                    {selectedUser.name} {selectedUser.persona && `- ${selectedUser.persona}`} <ChevronDown className="h-3 w-3 text-zinc-500" />
                  </span>
                </div>
              </>
            ) : (
              <div className="hidden lg:flex flex-col text-xs leading-tight">
                <span className="text-zinc-400">Đang tải người dùng...</span>
              </div>
            )}
          </div>

          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white text-zinc-800 rounded-lg shadow-xl border border-zinc-200 z-50 py-2 text-xs font-sans">
                <div className="px-3 py-1.5 border-b border-zinc-100 font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                  Thay đổi hồ sơ hoạt động
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-start gap-2 border-l-2 transition-colors ${selectedUser?.id === user.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-transparent'
                        }`}
                    >
                      <div className={`h-6 w-6 rounded-full shrink-0 ${user.avatarColor} text-white flex items-center justify-center font-bold text-xs uppercase`}>
                        {user.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-zinc-800">{user.name}</div>
                        {user.persona && (
                          <div className="text-[10px] text-zinc-500 mt-0.5 font-semibold">
                            Nhóm sở thích: <span className="text-indigo-600">{user.persona}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Orders block */}
        <div className="hidden sm:flex flex-col text-xs cursor-pointer py-1 px-2 hover:bg-zinc-100 rounded transition-all" id="header-orders">
          <span className="text-zinc-400">Trạng thái</span>
          <span className="font-bold text-indigo-600">Hoạt động</span>
        </div>

        {/* Cart */}
        <div className="flex items-center cursor-pointer py-1 px-2 hover:bg-zinc-100 rounded transition-all" id="header-cart">
          <div className="relative mr-1">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white font-extrabold text-[10px] rounded-full h-4.5 w-4.5 flex items-center justify-center shadow-md">
              {cartCount}
            </span>
          </div>
          <span className="hidden md:inline font-bold text-xs self-end mb-0.5 text-zinc-700">Giỏ hàng</span>
        </div>
      </div>

      {/* Secondary navigation bar */}
      <div className="flex items-center justify-between h-9 px-4 bg-zinc-50 text-xs font-medium border-t border-zinc-200">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <span className="font-bold flex items-center gap-1 cursor-pointer text-zinc-800">
            <span>Tất cả danh mục</span>
          </span>
        </div>
      </div>
    </header>
  );
}
