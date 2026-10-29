import React from 'react';
import { X, ShieldCheck, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="bg-slate-950 p-6 flex flex-col justify-center items-center">
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-80 w-auto object-contain rounded-xl"
            />
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
              Bảo hành chính hãng 24 tháng
            </div>
          </div>

          {/* Details & Specs */}
          <div className="p-6 md:p-8 flex flex-col justify-between max-h-[80vh] overflow-y-auto">
            <div>
              <div className="text-xs uppercase font-bold text-cyan-400 tracking-wider mb-1">
                {product.brand}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{product.name}</h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-2xl font-extrabold text-blue-400">
                  {formatVND(product.price)}
                </span>
                {product.original_price && (
                  <span className="text-sm text-slate-500 line-through">
                    {formatVND(product.original_price)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Full Specs Table */}
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Thông số kỹ thuật chi tiết
              </h4>
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 mb-6 divide-y divide-slate-800/60">
                {product.specs &&
                  Object.entries(product.specs).map(([specKey, specVal]) => (
                    <div key={specKey} className="py-1.5 flex justify-between text-xs">
                      <span className="text-slate-400">{specKey}</span>
                      <span className="text-slate-200 font-medium text-right pl-4">{specVal}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
