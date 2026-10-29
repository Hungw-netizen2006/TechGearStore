import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  LogOut,
  ShieldAlert,
  Shield,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { currentUser, isAdmin, isAuthenticated, logout, openAuthModal, quickLoginAs } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Kiểm tra quyền Admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Yêu cầu quyền Quản trị viên</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Bạn cần đăng nhập bằng tài khoản Quản trị viên (Admin) để truy cập hệ thống quản trị TechGear Store.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => quickLoginAs('admin')}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Đăng nhập nhanh 1-Click tài khoản Admin
            </button>
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Đăng nhập bằng tài khoản khác
            </button>
            <Link
              to="/"
              className="inline-block text-xs text-slate-400 hover:text-white pt-2"
            >
              ← Quay lại cửa hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Thống kê tổng quan', path: '/admin', icon: LayoutDashboard },
    { label: 'Quản lý sản phẩm', path: '/admin/products', icon: Package },
    { label: 'Quản lý đơn hàng', path: '/admin/orders', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                TechGear
              </span>
              <span className="text-[10px] uppercase tracking-widest text-purple-400 font-extrabold block -mt-1">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Store className="w-4 h-4 text-cyan-400" />
            <span>Xem Website Cửa hàng</span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất Quản trị</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800 px-6 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hệ thống TechGear Online</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-white">{currentUser?.full_name}</div>
              <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
                Administrator
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs">
              AD
            </div>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

