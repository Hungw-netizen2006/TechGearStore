import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const CartDrawer: React.FC = () => {
  const { cartItems, totalAmount, totalQuantity, isCartOpen, closeCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [orderSuccessCode, setOrderSuccessCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tự động điền thông tin người dùng nếu có
  useEffect(() => {
    if (currentUser) {
      if (currentUser.full_name) setCustomerName(currentUser.full_name);
      if (currentUser.phone) setShippingPhone(currentUser.phone);
      if (currentUser.address) setShippingAddress(currentUser.address);
    }
  }, [currentUser]);

  if (!isCartOpen) return null;

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !shippingPhone || !shippingAddress) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await api.createOrder({
        customer_name: customerName,
        shipping_phone: shippingPhone,
        shipping_address: shippingAddress,
        payment_method: 'COD',
        note: note || undefined,
        from_cart: isAuthenticated,
        items: !isAuthenticated
          ? cartItems.map((item) => ({
              product_id: item.product.id,
              quantity: item.quantity,
            }))
          : undefined,
      });

      setOrderSuccessCode(res.order_code);
      await clearCart();
    } catch (err: any) {
      setErrorMsg(err.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại giỏ hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              Giỏ hàng của bạn
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full font-bold">
                {totalQuantity} món
              </span>
            </h3>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {orderSuccessCode ? (
              <div className="text-center py-12 animate-in fade-in">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">Đặt hàng thành công!</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Mã đơn hàng chính thức của bạn là:
                </p>
                <div className="inline-block px-4 py-2 bg-slate-800 rounded-xl text-cyan-400 font-mono font-bold text-base mb-6 border border-cyan-500/30 shadow-lg">
                  {orderSuccessCode}
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
                  Bộ phận TechGear Store sẽ liên hệ xác nhận và giao hàng hỏa tốc trong thời gian sớm nhất.
                </p>
                <button
                  onClick={() => {
                    setOrderSuccessCode(null);
                    closeCart();
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-white mb-1">Giỏ hàng của bạn đang trống</p>
                <p className="text-xs text-slate-400 mb-6">Chưa có thiết bị phụ kiện gaming nào được chọn.</p>
                <button
                  onClick={closeCart}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
                >
                  Khám phá phụ kiện ngay
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 items-center"
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-900 shrink-0 border border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate" title={item.product.name}>
                        {item.product.name}
                      </h4>
                      <div className="text-[11px] text-cyan-400 font-bold mt-0.5">
                        {formatVND(item.product.price)}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Checkout Quick Form */}
                <form onSubmit={handleCheckout} className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 tracking-wider">
                    <span>Thông tin giao hàng (COD)</span>
                    {!isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="text-blue-400 hover:underline normal-case text-[11px]"
                      >
                        Đăng nhập để tự điền
                      </button>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="p-3 text-xs text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/30">
                      {errorMsg}
                    </div>
                  )}

                  <input
                    type="text"
                    required
                    placeholder="Họ và tên người nhận *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Số điện thoại nhận hàng *"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Địa chỉ giao hàng chi tiết *"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <input
                    type="text"
                    placeholder="Ghi chú giao hàng (giờ giao, chỉ đường...)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />

                  {/* Summary & Submit */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                      <span>Phí giao hàng:</span>
                      <span className="text-emerald-400 font-semibold">Miễn phí toàn quốc</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-white mb-3">
                      <span>Tổng thanh toán:</span>
                      <span className="text-lg text-blue-400 font-black">{formatVND(totalAmount)}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Đang tạo đơn hàng...' : `Đặt hàng ngay (${formatVND(totalAmount)})`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
