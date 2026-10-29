import React from 'react';
import { Product, Category } from '../types';
import { ProductCard } from './ProductCard';
import { Filter, Layers, DollarSign, ArrowUpDown } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
  priceRange: { min?: number; max?: number } | null;
  onSelectPriceRange: (range: { min?: number; max?: number } | null) => void;
  sortBy: string;
  onSelectSortBy: (sort: string) => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  priceRange,
  onSelectPriceRange,
  sortBy,
  onSelectSortBy,
  onAddToCart,
  onViewDetails,
}) => {
  const brands = ['Logitech', 'Razer', 'Akko', 'ASUS ROG', 'IETS'];

  const priceOptions = [
    { label: 'Tất cả mức giá', range: null },
    { label: 'Dưới 2 triệu', range: { min: 0, max: 2000000 } },
    { label: '2tr - 4 triệu', range: { min: 2000000, max: 4000000 } },
    { label: '4tr - 6 triệu', range: { min: 4000000, max: 6000000 } },
    { label: 'Trên 6 triệu', range: { min: 6000000 } },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-blue-500" />
            Bộ sưu tập TechGear
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Thiết bị ngoại vi cao cấp: Chuột gaming, Bàn phím cơ, Tai nghe Esports và Đế tản nhiệt
          </p>
        </div>

        {/* Sort by dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => onSelectSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao xuống Thấp</option>
            <option value="rating">Đánh giá cao nhất</option>
          </select>
        </div>
      </div>

      {/* Filter Bar: Categories, Brands & Price Ranges */}
      <div className="space-y-4 mb-8 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Loại:
          </span>
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === null
                ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            Tất cả phụ kiện
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(selectedCategory === cat.slug ? null : cat.slug)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat.slug
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Brand Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/60 pt-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Hãng:
          </span>
          <button
            onClick={() => onSelectBrand(null)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedBrand === null
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Tất cả
          </button>
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => onSelectBrand(selectedBrand === b ? null : b)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBrand === b
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Price Range Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/60 pt-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Khoảng giá:
          </span>
          {priceOptions.map((opt, idx) => {
            const isSelected =
              (!priceRange && !opt.range) ||
              (priceRange &&
                opt.range &&
                priceRange.min === opt.range.min &&
                priceRange.max === opt.range.max);
            return (
              <button
                key={idx}
                onClick={() => onSelectPriceRange(opt.range)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid List */}
      {products.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Không tìm thấy phụ kiện phù hợp</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Vui lòng thử điều chỉnh lại bộ lọc theo hãng, danh mục hoặc khoảng giá.
          </p>
          <button
            onClick={() => {
              onSelectCategory(null);
              onSelectBrand(null);
              onSelectPriceRange(null);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </section>
  );
};
