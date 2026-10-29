import React from 'react';
import { ShoppingCart, Cpu, Search, Shield, PackageCheck, LogOut, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ searchTerm = '', onSearchChange }) => {
  const { currentUser, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const { totalQuantity, openCart } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-900/90 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                TechGear
              </span>
              <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold block -mt-1">
                Store
              </span>
            </div>
          </Link>

          {/* Search bar */}
          {onSearchChange && (
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm chuột 32K DPI, phím ROG, tai nghe, Akko..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Dashboard Pill */}
            {isAdmin && (
              <Link
                to="/admin"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Dashboard</span>
              </Link>
            )}

            {/* My Orders Button */}
            {isAuthenticated && (
              <Link
                to="/my-orders"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Đơn hàng của tôi"
              >
                <PackageCheck className="w-4 h-4 text-cyan-400" />
                <span className="hidden lg:inline">Đơn hàng</span>
              </Link>
            )}

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-2 group"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="w-4 h-4 group-hover:scale-105 transition-transform text-blue-400" />
              <span className="hidden sm:inline text-xs font-semibold">Giỏ hàng</span>
              {totalQuantity > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {totalQuantity}
                </span>
              )}
            </button>

            {/* User Profile / Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
                <div className="hidden xl:block text-right">
                  <div className="text-xs font-bold text-white truncate max-w-[120px]">
                    {currentUser?.full_name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isAdmin ? 'Quản trị viên' : 'Khách hàng'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {onSearchChange && (
          <div className="py-2.5 pb-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm chuột, phím cơ, tai nghe, Akko..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
