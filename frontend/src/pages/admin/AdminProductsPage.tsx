import React, { useState, useEffect } from 'react';
import { Product, Category } from '../../types';
import { api } from '../../services/api';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formBrand, setFormBrand] = useState('Logitech');
  const [formCategoryId, setFormCategoryId] = useState<number>(1);
  const [formPrice, setFormPrice] = useState<number>(1000000);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(1200000);
  const [formStock, setFormStock] = useState<number>(10);
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSpecs, setFormSpecs] = useState<string>('{\n  "DPI": "32,000 DPI",\n  "Switch": "Optical"\n}');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminProducts({
        page: 1,
        page_size: 50,
        brand: brandFilter || undefined,
        stock_status: stockStatusFilter || undefined,
        search: searchTerm || undefined,
      });
      setProducts(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [brandFilter, stockStatusFilter, searchTerm]);

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormBrand('Logitech');
    setFormCategoryId(categories[0]?.id || 1);
    setFormPrice(1000000);
    setFormOriginalPrice(1200000);
    setFormStock(20);
    setFormDescription('Mô tả phụ kiện công nghệ gaming cao cấp...');
    setFormImageUrl('https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800');
    setFormSpecs('{\n  "DPI": "32,000 DPI",\n  "Switch": "Optical Hybrid",\n  "Pin": "90 giờ"\n}');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSlug(p.slug);
    setFormBrand(p.brand);
    setFormCategoryId(p.category_id);
    setFormPrice(p.price);
    setFormOriginalPrice(p.original_price || p.price);
    setFormStock(p.stock_quantity);
    setFormDescription(p.description || '');
    setFormImageUrl(p.image_url);
    setFormSpecs(JSON.stringify(p.specs || {}, null, 2));
    setFormIsActive(p.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSaving(true);

    let parsedSpecs = {};
    try {
      parsedSpecs = JSON.parse(formSpecs);
    } catch {
      setFormError('Định dạng thông số kỹ thuật (specs) phải là JSON hợp lệ!');
      setFormSaving(false);
      return;
    }

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      brand: formBrand.trim(),
      category_id: formCategoryId,
      price: Number(formPrice),
      original_price: Number(formOriginalPrice) || undefined,
      stock_quantity: Number(formStock),
      description: formDescription,
      image_url: formImageUrl.trim(),
      specs: parsedSpecs,
      is_active: formIsActive,
    };

    try {
      if (editingProduct) {
        await api.updateAdminProduct(editingProduct.id, payload);
      } else {
        await api.createAdminProduct(payload);
      }
      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Lưu sản phẩm thất bại');
    } finally {
      setFormSaving(false);
    }
  };

  const handleQuickStock = async (product: Product) => {
    const newStockStr = prompt(`Nhập số lượng tồn kho mới cho "${product.name}":`, product.stock_quantity.toString());
    if (newStockStr === null) return;
    const newStock = parseInt(newStockStr, 10);
    if (isNaN(newStock) || newStock < 0) {
      alert('Số lượng tồn kho không hợp lệ!');
      return;
    }

    try {
      await api.updateAdminProductStock(product.id, { stock_quantity: newStock });
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Cập nhật tồn kho thất bại');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) {
      return;
    }
    try {
      const res = await api.deleteAdminProduct(product.id);
      alert(res.message);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Xóa sản phẩm thất bại');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-purple-400" />
            Quản lý Sản phẩm Phụ kiện
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Thêm mới, chỉnh sửa thông số, kiểm soát tồn kho và trạng thái mở bán sản phẩm
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, hãng, slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="">Tất cả các hãng</option>
            <option value="Logitech">Logitech</option>
            <option value="Razer">Razer</option>
            <option value="Akko">Akko</option>
            <option value="ASUS ROG">ASUS ROG</option>
            <option value="IETS">IETS</option>
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="">Tất cả tình trạng kho</option>
            <option value="low_stock">⚠️ Sắp hết hàng (≤ 5)</option>
            <option value="out_of_stock">❌ Đã hết hàng (= 0)</option>
            <option value="in_stock">✅ Còn hàng (&gt; 0)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-4 px-5">Sản phẩm</th>
                <th className="py-4 px-4">Hãng</th>
                <th className="py-4 px-4">Giá bán</th>
                <th className="py-4 px-4">Tồn kho</th>
                <th className="py-4 px-4">Trạng thái</th>
                <th className="py-4 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Đang tải danh sách sản phẩm...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Name & Image */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                        />
                        <div className="min-w-0 max-w-xs">
                          <h4 className="font-bold text-white truncate" title={p.name}>
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: {p.id} • {p.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="py-3.5 px-4 font-semibold text-cyan-400">
                      {p.brand}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{formatVND(p.price)}</div>
                      {p.original_price && (
                        <div className="text-[10px] text-slate-500 line-through">
                          {formatVND(p.original_price)}
                        </div>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleQuickStock(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          p.stock_quantity === 0
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : p.stock_quantity <= 5
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                        title="Bấm để sửa nhanh số lượng tồn kho"
                      >
                        {p.stock_quantity === 0 ? (
                          <span>Hết hàng (0)</span>
                        ) : p.stock_quantity <= 5 ? (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Sắp hết ({p.stock_quantity})</span>
                          </>
                        ) : (
                          <span>{p.stock_quantity} cái</span>
                        )}
                      </button>
                    </td>

                    {/* Active Status */}
                    <td className="py-3.5 px-4">
                      {p.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Đang bán
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Ngừng bán
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm mới phụ kiện công nghệ'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Cung cấp đầy đủ thông số kỹ thuật (DPI, switch, driver, v.v.) và tồn kho
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Đường dẫn (slug - bỏ trống để tự tạo)
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hãng sản xuất *
                  </label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Danh mục phụ kiện *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Số lượng tồn kho *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Giá bán thực tế (VND) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Giá gốc niêm yết (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL ảnh đại diện sản phẩm *
                </label>
                <input
                  type="url"
                  required
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mô tả sản phẩm
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Thông số kỹ thuật JSON (specs: DPI, Switch, Driver, Polling...)
                </label>
                <textarea
                  rows={4}
                  required
                  value={formSpecs}
                  onChange={(e) => setFormSpecs(e.target.value)}
                  className="w-full font-mono bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isActiveCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Mở bán công khai trên Website Store (is_active)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
                >
                  {formSaving ? 'Đang lưu...' : editingProduct ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
