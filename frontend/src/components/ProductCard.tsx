import React from 'react';
import { Star, ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
}) => {
  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  // Extract highlight specs (e.g. DPI, Switch, RPM)
  const specEntries = Object.entries(product.specs || {}).slice(0, 2);

  return (
    <div className="group relative bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col">
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onViewDetails(product)}>
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Brand Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900/90 text-cyan-400 border border-cyan-500/30 backdrop-blur-sm shadow-md">
          {product.brand}
        </span>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-extrabold rounded-md bg-rose-500/90 text-white shadow-md">
            -{discountPercent}%
          </span>
        )}

        {/* Quick View Overlay Button */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            Thông số chi tiết
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {/* Rating & Stock */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-500">({product.review_count})</span>
            </div>
            <span className="text-emerald-400 font-medium">
              {product.stock_quantity > 0 ? `Còn hàng (${product.stock_quantity})` : 'Tạm hết hàng'}
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="text-sm sm:text-base font-semibold text-slate-100 hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Tech Specs Badges (DPI, Switch, Driver, etc.) */}
          {specEntries.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {specEntries.map(([key, val]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  <strong className="text-blue-400 mr-1">{key}:</strong> {val}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <div>
            <div className="text-base sm:text-lg font-bold text-white tracking-tight">
              {formatVND(product.price)}
            </div>
            {product.original_price && (
              <div className="text-xs text-slate-500 line-through">
                {formatVND(product.original_price)}
              </div>
            )}
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock_quantity <= 0}
            className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20 active:scale-95"
            title="Thêm vào giỏ"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Mua ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};

