import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PackageCheck, Clock, MapPin, AlertCircle, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyOrdersPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingCode, setCancellingCode] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getMyOrders({ page: 1, page_size: 50 });
      setOrders(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const handleCancelOrder = async (orderCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${orderCode}?`)) {
      return;
    }
    setCancellingCode(orderCode);
    try {
      await api.cancelOrder(orderCode);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Hủy đơn hàng thất bại');
    } finally {
      setCancellingCode(null);
    }
  };

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Chờ xử lý
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Đang đóng gói
          </span>
        );
      case 'shipping':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            Đang giao hàng
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Đã hoàn thành
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-2xl">
        <AlertCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Đăng nhập để xem đơn hàng</h3>
        <p className="text-xs text-slate-400 mb-6">
          Vui lòng đăng nhập tài khoản của bạn để tra cứu lịch sử mua sắm và trạng thái đơn hàng.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-400 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại cửa hàng
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <PackageCheck className="w-7 h-7 text-cyan-400" />
            Lịch sử đơn hàng cá nhân
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi tiến trình xử lý, vận chuyển và chi tiết các đơn hàng bạn đã đặt
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Đang tải lịch sử đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <PackageCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Bạn chưa có đơn hàng nào</h3>
          <p className="text-xs text-slate-400 mb-6">
            Hãy khám phá các thiết bị phụ kiện công nghệ gaming đỉnh cao tại TechGear Store!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl overflow-hidden shadow-xl transition-all"
            >
              {/* Order Header */}
              <div className="p-5 sm:px-6 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm font-black text-cyan-400 tracking-wider">
                    {order.order_code}
                  </div>
                  {getStatusBadge(order.order_status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(order.created_at).toLocaleString('vi-VN')}
                  </span>
                  <span className="text-slate-200 font-bold">
                    Tổng: {formatVND(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-5 sm:p-6 divide-y divide-slate-800/60">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                        />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {item.product?.name || `Sản phẩm #${item.product_id}`}
                        </h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Số lượng: <strong className="text-slate-200">{item.quantity}</strong> × {formatVND(item.unit_price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-200 shrink-0">
                      {formatVND(item.total_price)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer Info & Cancel Action */}
              <div className="p-5 sm:px-6 bg-slate-950/40 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1 text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Người nhận: <strong className="text-slate-200">{order.customer_name}</strong> • SĐT: <strong className="text-slate-200">{order.shipping_phone}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-400 pl-5">
                    Địa chỉ: {order.shipping_address}
                  </div>
                  {order.note && (
                    <div className="text-[11px] text-amber-400/90 pl-5">
                      Ghi chú: {order.note}
                    </div>
                  )}
                </div>

                {/* Cancel Button if Pending */}
                {order.order_status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(order.order_code)}
                    disabled={cancellingCode === order.order_code}
                    className="self-end sm:self-auto px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {cancellingCode === order.order_code ? 'Đang hủy...' : 'Hủy đơn hàng'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
