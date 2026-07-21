import React, { useState } from 'react';
import { ShoppingCart, Search, MapPin, ChevronDown, UserPlus, X } from 'lucide-react';
import { RecUser } from '../types';

interface HeaderProps {
  users: RecUser[];
  selectedUser: RecUser | null;
  onSelectUser: (user: RecUser) => void;
  onAddUser?: (name: string) => void;
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
  onAddUser,
  searchQuery,
  onSearchChange,
  cartCount,
}: HeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !onAddUser) return;
    onAddUser(newUserName.trim());
    setNewUserName('');
    setShowAddModal(false);
    setShowUserDropdown(false);
  };

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
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nhóm bên phải: Giỏ hàng, Nút Tạo User & User Switcher */}
        <div className="flex items-center gap-3 shrink-0">
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

          {/* Direct Add User Button */}
          {onAddUser && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
              title="Tạo người dùng mới để test"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Thêm User</span>
            </button>
          )}

          {/* User Switcher */}
          <div className="relative">
            <div
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center cursor-pointer py-1 px-2 hover:bg-zinc-100 rounded text-left gap-2 transition-all border border-zinc-200"
              id="user-profile-switcher"
            >
              {selectedUser ? (
                <>
                  <div className={`h-7 w-7 rounded-full ${selectedUser.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-inner uppercase`}>
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
                  <div className="px-3 py-1.5 border-b border-zinc-100 flex items-center justify-between font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                    <span>Thay đổi hồ sơ hoạt động</span>
                  </div>

                  {/* Prominent Add User option in dropdown list */}
                  {onAddUser && (
                    <div className="p-2 border-b border-zinc-100 bg-indigo-50/40">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddModal(true);
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>+ Thêm người dùng mới</span>
                      </button>
                    </div>
                  )}

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

      {/* Modal Thêm người dùng mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                Tạo người dùng mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tên người dùng
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nhập tên (ví dụ: Test User A)"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}