import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  ShoppingBag,
  Plus,
  Minus,
  Cpu,
  Check,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      setLoading(true);
      try {
        const prod = await api.getProductDetail(parseInt(id, 10));
        setProduct(prod);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Đang tải thông số kỹ thuật sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Không tìm thấy sản phẩm</h2>
        <p className="text-slate-400 text-sm mb-6">Sản phẩm này có thể đã bị gỡ hoặc không tồn tại.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  const handleBuyNow = async () => {
    await addToCart(product, quantity);
    navigate('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-400 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại tất cả phụ kiện
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Product Images View */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl p-8 flex items-center justify-center relative overflow-hidden group shadow-2xl">
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
            {discountPercent > 0 && (
              <span className="absolute top-5 right-5 px-3 py-1 bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-lg">
                Giảm {discountPercent}%
              </span>
            )}
            <span className="absolute top-5 left-5 px-3 py-1 bg-slate-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-xl backdrop-blur-sm">
              {product.brand}
            </span>
          </div>

          {/* Key Trust Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-[11px]">
                <div className="font-bold text-white">Chính hãng 100%</div>
                <div className="text-slate-400">Bảo hành 24 tháng</div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex items-center gap-2.5">
              <RotateCcw className="w-5 h-5 text-purple-400 shrink-0" />
              <div className="text-[11px]">
                <div className="font-bold text-white">Đổi mới 15 ngày</div>
                <div className="text-slate-400">Lỗi nhà sản xuất</div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-[11px]">
                <div className="font-bold text-white">Hỏa tốc 2H</div>
                <div className="text-slate-400">Nội thành Hà Nội</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details & Purchase Form */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <span className="text-cyan-400 uppercase tracking-wider">{product.brand}</span>
              <span>•</span>
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{product.rating}</span>
                <span className="text-slate-500">({product.review_count} đánh giá)</span>
              </div>
              <span>•</span>
              <span className={product.stock_quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {product.stock_quantity > 0 ? `Còn hàng (${product.stock_quantity})` : 'Hết hàng'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-4">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 mb-6 flex items-baseline gap-4">
              <span className="text-3xl sm:text-4xl font-black text-blue-400">
                {formatVND(product.price)}
              </span>
              {product.original_price && (
                <span className="text-base text-slate-500 line-through">
                  {formatVND(product.original_price)}
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Detailed Specs Table */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Thông số kỹ thuật chi tiết
              </h3>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800/80">
                {product.specs &&
                  Object.entries(product.specs).map(([specKey, specVal]) => (
                    <div key={specKey} className="py-2.5 flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">{specKey}</span>
                      <span className="text-slate-100 font-semibold text-right pl-4">
                        {specVal}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Action Box: Quantity & Purchase */}
          <div className="pt-6 border-t border-slate-800">
            {addedNotice && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4" />
                Đã thêm {quantity} sản phẩm vào giỏ hàng thành công!
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center border border-slate-700 bg-slate-900 rounded-xl p-1 shrink-0 w-full sm:w-auto justify-between">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-white">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock_quantity, q + 1))
                  }
                  className="w-9 h-9 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity <= 0}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                Thêm vào giỏ
              </button>

              {/* Buy Now Button */}
              <button
                onClick={handleBuyNow}
                disabled={product.stock_quantity <= 0}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

