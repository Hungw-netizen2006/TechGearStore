import React, { useState, useEffect } from 'react';
import { DashboardStats } from '../../types';
import { api } from '../../services/api';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Flame,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold">Đang tổng hợp số liệu thống kê Dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-sm">Không thể tải dữ liệu thống kê. Vui lòng thử lại.</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
        >
          Tải lại
        </button>
      </div>
    );
  }

  // Tính max doanh thu trong 7 ngày để scale chiều cao cột biểu đồ
  const maxDayRevenue = Math.max(...stats.revenue_chart_7days.map((d) => d.revenue), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Thống kê Tổng quan TechGear
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Số liệu kinh doanh, tình trạng đơn hàng và luồng xuất nhập kho theo thời gian thực
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới số liệu
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Doanh thu */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng doanh thu
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {formatVND(stats.total_revenue)}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Hôm nay: {formatVND(stats.today_revenue)}
          </div>
        </div>

        {/* Đơn hàng */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng số đơn hàng
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {stats.total_orders} <span className="text-xs font-semibold text-slate-400">đơn</span>
          </div>
          <div className="text-[11px] text-blue-400 font-semibold">
            {stats.pending_orders} chờ xử lý • {stats.processing_orders} đang đóng gói
          </div>
        </div>

        {/* Khách hàng */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng khách hàng
            </span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {stats.total_customers} <span className="text-xs font-semibold text-slate-400">người</span>
          </div>
          <div className="text-[11px] text-cyan-400 font-semibold">
            Tài khoản đã đăng ký trên hệ thống
          </div>
        </div>

        {/* Tồn kho */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tồn kho sản phẩm
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {stats.total_products} <span className="text-xs font-semibold text-slate-400">mẫu</span>
          </div>
          <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {stats.low_stock_products_count} mẫu sắp hết • {stats.out_of_stock_products_count} mẫu hết hàng
          </div>
        </div>
      </div>

      {/* Row: 7-Day Revenue Chart & Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue 7-Day Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Biểu đồ Doanh thu 7 ngày gần nhất
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Xu hướng dòng tiền theo từng ngày giao dịch
              </p>
            </div>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-xl">
              7 Ngày qua
            </span>
          </div>

          {/* Chart Bars */}
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2">
            {stats.revenue_chart_7days.map((day) => {
              const heightPercent = Math.max(
                Math.round((day.revenue / maxDayRevenue) * 100),
                8
              );
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                  {/* Tooltip Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg text-slate-200 pointer-events-none whitespace-nowrap shadow-xl">
                    {formatVND(day.revenue)} ({day.orders_count} đơn)
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-slate-800/80 rounded-2xl overflow-hidden h-40 flex items-end p-1">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-purple-600 via-indigo-500 to-cyan-400 rounded-xl transition-all duration-500 group-hover:brightness-125"
                    />
                  </div>

                  {/* Date label */}
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide mb-1">
              Tiến độ xử lý đơn hàng
            </h3>
            <p className="text-[11px] text-slate-400 mb-6">
              Phân loại theo quy trình fulfillment
            </p>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">Chờ xử lý</span>
                </div>
                <span className="text-sm font-black text-amber-400">{stats.pending_orders}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-blue-300">Đang đóng gói</span>
                </div>
                <span className="text-sm font-black text-blue-400">{stats.processing_orders}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-300">Đang giao hàng</span>
                </div>
                <span className="text-sm font-black text-purple-400">{stats.shipping_orders}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">Đã hoàn thành</span>
                </div>
                <span className="text-sm font-black text-emerald-400">{stats.delivered_orders}</span>
              </div>
            </div>
          </div>

          <Link
            to="/admin/orders"
            className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold text-center block transition-colors"
          >
            Quản lý toàn bộ đơn hàng →
          </Link>
        </div>
      </div>

      {/* Row: Top 5 Best-Selling Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Best-selling Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              Top 5 Phụ kiện Bán chạy nhất
            </h3>
            <Link to="/admin/products" className="text-xs text-purple-400 hover:underline">
              Xem kho
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {stats.top_selling_products.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu bán hàng</p>
            ) : (
              stats.top_selling_products.map((item, idx) => (
                <div key={item.product_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center font-black text-sm text-slate-500">
                      #{idx + 1}
                    </span>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-cyan-400 font-semibold">{item.brand}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-white">
                      Đã bán: <span className="text-purple-400">{item.total_sold}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{formatVND(item.total_revenue)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent 5 Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-cyan-400" />
              Đơn hàng vừa đặt gần đây
            </h3>
            <Link to="/admin/orders" className="text-xs text-purple-400 hover:underline">
              Tất cả đơn
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {stats.recent_orders.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Chưa có đơn hàng nào</p>
            ) : (
              stats.recent_orders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs font-bold text-cyan-400">
                      {order.order_code}
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium mt-0.5">
                      Khách: {order.customer_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">
                      {formatVND(order.total_amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {order.order_status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

