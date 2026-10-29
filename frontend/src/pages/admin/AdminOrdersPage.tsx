import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { api } from '../../services/api';
import {
  ShoppingCart,
  Search,
  Eye,
  CheckCircle,
  RefreshCw,
  X,
  MapPin,
  Phone,
  User as UserIcon,
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected order for detail view / status change
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('processing');
  const [adminNote, setAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOrders({
        page: 1,
        page_size: 50,
        order_status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setOrders(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchTerm]);

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Chờ xử lý
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Đang đóng gói
          </span>
        );
      case 'shipping':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            Đang giao hàng
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Đã hoàn thành
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status);
    setAdminNote('');
    setUpdateMsg(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    setUpdateMsg(null);

    try {
      const updated = await api.updateAdminOrderStatus(selectedOrder.order_code, {
        order_status: newStatus,
        admin_note: adminNote || undefined,
      });
      setSelectedOrder(updated);
      setUpdateMsg(`Đã cập nhật trạng thái đơn hàng sang "${newStatus}"!`);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-purple-400" />
            Quản lý Đơn hàng Hệ thống
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kiểm duyệt đơn, cập nhật tiến trình đóng gói, bàn giao vận chuyển và theo dõi doanh thu
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { label: 'Tất cả', val: '' },
            { label: 'Chờ xử lý', val: 'pending' },
            { label: 'Đang đóng gói', val: 'processing' },
            { label: 'Đang giao', val: 'shipping' },
            { label: 'Đã hoàn thành', val: 'delivered' },
            { label: 'Đã hủy', val: 'cancelled' },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setStatusFilter(item.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === item.val
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-4 px-5">Mã đơn hàng</th>
                <th className="py-4 px-4">Khách hàng</th>
                <th className="py-4 px-4">Ngày đặt</th>
                <th className="py-4 px-4">Tổng tiền</th>
                <th className="py-4 px-4">Thanh toán</th>
                <th className="py-4 px-4">Trạng thái</th>
                <th className="py-4 px-5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Order Code */}
                    <td className="py-3.5 px-5 font-mono font-bold text-cyan-400">
                      {order.order_code}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{order.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{order.shipping_phone}</div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 font-black text-white">
                      {formatVND(order.total_amount)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        {order.payment_method} • {order.payment_status}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(order.order_status)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        Xử lý đơn
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Đơn hàng: <span className="font-mono text-cyan-400">{selectedOrder.order_code}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ngày đặt: {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {updateMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {updateMsg}
              </div>
            )}

            {/* Customer & Shipping Info */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-5 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Người nhận: <strong className="text-white">{selectedOrder.customer_name}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-purple-400" />
                <span>Số điện thoại: <strong className="text-white">{selectedOrder.shipping_phone}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>Địa chỉ giao hàng: <strong className="text-white">{selectedOrder.shipping_address}</strong></span>
              </div>
              {selectedOrder.note && (
                <div className="text-[11px] text-amber-400 pt-1 border-t border-slate-800">
                  Ghi chú của khách: {selectedOrder.note}
                </div>
              )}
            </div>

            {/* Order Items List */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Các sản phẩm trong đơn hàng
              </h4>
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 divide-y divide-slate-800/80 p-3 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-800"
                        />
                      )}
                      <div>
                        <div className="font-bold text-white">{item.product?.name || `ID #${item.product_id}`}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.quantity} × {formatVND(item.unit_price)}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-slate-200">
                      {formatVND(item.total_price)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 text-sm font-bold text-white">
                <span>Tổng giá trị đơn hàng:</span>
                <span className="text-base text-blue-400 font-black">{formatVND(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Status Update Form */}
            <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-3">
                Cập nhật trạng thái đơn hàng (Fulfillment)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                    Trạng thái đơn hàng:
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="pending">Chờ xử lý (pending)</option>
                    <option value="processing">Đang đóng gói (processing)</option>
                    <option value="shipping">Đang giao hàng (shipping)</option>
                    <option value="delivered">Đã hoàn thành (delivered)</option>
                    <option value="cancelled">Đã hủy đơn (cancelled)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                    Ghi chú Admin:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Đã bàn giao shipper Viettel Post..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {isUpdating ? 'Đang cập nhật...' : 'Lưu trạng thái mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
