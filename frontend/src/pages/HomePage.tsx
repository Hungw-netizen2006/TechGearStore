import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { ProductGrid } from '../components/ProductGrid';
import { ProductModal } from '../components/ProductModal';
import { Sparkles, Zap, Flame, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  searchTerm: string;
}

export const HomePage: React.FC<HomePageProps> = ({ searchTerm }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number } | null>(null);
  const [sortBy, setSortBy] = useState('newest');

  // Modal
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  // Load Categories on mount
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch Products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const data = await api.getProducts({
          category_slug: selectedCategory || undefined,
          brand: selectedBrand || undefined,
          min_price: priceRange?.min,
          max_price: priceRange?.max,
          search: searchTerm || undefined,
          sort_by: sortBy,
        });
        setProducts(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [selectedCategory, selectedBrand, priceRange, searchTerm, sortBy]);

  return (
    <>
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold mb-4 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Nâng tầm trải nghiệm Gaming Esports 2026</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Phụ kiện công nghệ <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Độ chính xác cao & Hiệu năng đỉnh
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              Trang bị vũ khí tối thượng cho góc máy của bạn: Chuột cảm biến 35K DPI, Bàn phím cơ ROG OLED & Akko MonsGeek M1 V3 nhôm CNC, Tai nghe không dây 70h pin và Đế tản nhiệt turbofan 5000 RPM.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Polling Rate Native 8000Hz</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Switch cơ quang học lai</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Hạ nhiệt độ tới 25°C</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Product Grid */}
      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs">Đang tải danh sách phụ kiện công nghệ...</p>
          </div>
        ) : (
          <ProductGrid
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            priceRange={priceRange}
            onSelectPriceRange={setPriceRange}
            sortBy={sortBy}
            onSelectSortBy={setSortBy}
            onAddToCart={(prod) => addToCart(prod)}
            onViewDetails={(prod) => navigate(`/product/${prod.id}`)}
          />
        )}
      </main>

      {/* Quick View Modal */}
      <ProductModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={(prod) => addToCart(prod)}
      />
    </>
  );
};

