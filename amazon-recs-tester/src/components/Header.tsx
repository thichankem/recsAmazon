import React, { useState } from 'react';
import { ShoppingCart, Search, MapPin, ChevronDown } from 'lucide-react';
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
  users,
  selectedUser,
  onSelectUser,
  searchQuery,
  onSearchChange,
  cartCount,
}: HeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white text-zinc-800 font-sans text-sm select-none border-b border-zinc-200 shadow-xs">
      {/* Primary header bar */}
      <div className="flex items-center justify-between h-14 px-4 gap-4">

        {/* Nhóm bên trái: Vị trí & Thanh tìm kiếm */}
        <div className="flex flex-1 items-center gap-4 max-w-3xl">
          {/* Deliver to Vietnam */}
          <div className="hidden md:flex items-center cursor-pointer py-1 px-2 hover:bg-zinc-100 rounded transition-all shrink-0" id="header-location">
            <MapPin className="h-5 w-5 mr-1 text-indigo-600" />
            <div className="flex flex-col text-xs">
              <span className="text-zinc-400">Giao đến</span>
              <span className="font-bold text-zinc-700">Việt Nam</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex items-center h-10 rounded-lg overflow-hidden bg-zinc-50 border border-zinc-200 group focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all" id="header-search-container">
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
              <Search className="h-4 w-4" /> {/* Sửa chiều rộng w-2 thành w-4 cho cân đối */}
            </button>
          </div>
        </div>

        {/* Nhóm bên phải: Giỏ hàng & User Switcher */}
        <div className="flex items-center gap-4 shrink-0">
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

          {/* User Switcher - Đã được đưa vào trong thanh chính */}
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
                  <span className="text-zinc-400">Đang tải...</span>
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
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}