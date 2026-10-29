import {
  Product,
  ProductPaginationResponse,
  Category,
  Order,
  OrderPaginationResponse,
  ServerCartResponse,
  DashboardStats,
  AuthResponse,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('techgear_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // ==========================================
  // 1. AUTHENTICATION
  // ==========================================
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Đăng nhập không thành công');
    }
    const data: AuthResponse = await res.json();
    localStorage.setItem('techgear_token', data.access_token);
    return data;
  },

  async register(payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    address?: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Đăng ký tài khoản không thành công');
    }
    return await res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Không thể lấy thông tin tài khoản');
    return await res.json();
  },

  async updateProfile(payload: {
    full_name?: string;
    phone?: string;
    address?: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Cập nhật thông tin thất bại');
    }
    return await res.json();
  },

  // ==========================================
  // 2. CATEGORIES & PRODUCTS (CUSTOMER)
  // ==========================================
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch {
      return [
        { id: 1, name: 'Chuột Gaming', slug: 'chuot-gaming' },
        { id: 2, name: 'Bàn phím cơ', slug: 'ban-phim-co' },
        { id: 3, name: 'Tai nghe Gaming', slug: 'tai-nghe-gaming' },
        { id: 4, name: 'Đế tản nhiệt', slug: 'de-tan-nhiet' },
      ];
    }
  },

  async getProducts(params?: {
    category_slug?: string;
    brand?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    page?: number;
    page_size?: number;
    sort_by?: string;
  }): Promise<ProductPaginationResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.category_slug) searchParams.append('category_slug', params.category_slug);
      if (params?.brand) searchParams.append('brand', params.brand);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.min_price !== undefined) searchParams.append('min_price', params.min_price.toString());
      if (params?.max_price !== undefined) searchParams.append('max_price', params.max_price.toString());
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
      if (params?.sort_by) searchParams.append('sort_by', params.sort_by);

      const url = `${API_BASE_URL}/products?${searchParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch products');
      return await res.json();
    } catch {
      return {
        total: 0,
        page: 1,
        page_size: 10,
        total_pages: 1,
        has_next: false,
        has_prev: false,
        items: [],
      };
    }
  },

  async getProductDetail(productId: number): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`);
    if (!res.ok) throw new Error('Không tìm thấy sản phẩm');
    return await res.json();
  },

  // ==========================================
  // 3. CART (SERVER SYNC)
  // ==========================================
  async getCart(): Promise<ServerCartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return await res.json();
  },

  async addToCart(productId: number, quantity: number = 1): Promise<ServerCartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Không thể thêm vào giỏ');
    }
    return await res.json();
  },

  async updateCartItem(productId: number, quantity: number): Promise<ServerCartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Không thể cập nhật số lượng');
    }
    return await res.json();
  },

  async removeCartItem(productId: number): Promise<ServerCartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Không thể xóa sản phẩm khỏi giỏ');
    return await res.json();
  },

  async clearCart(): Promise<ServerCartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Không thể xóa giỏ hàng');
    return await res.json();
  },

  // ==========================================
  // 4. ORDERS (CUSTOMER)
  // ==========================================
  async createOrder(payload: {
    customer_name?: string;
    shipping_phone?: string;
    shipping_address?: string;
    payment_method?: string;
    note?: string;
    from_cart?: boolean;
    items?: { product_id: number; quantity: number }[];
  }): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Đặt hàng thất bại');
    }
    return await res.json();
  },

  async getMyOrders(params?: {
    page?: number;
    page_size?: number;
    order_status?: string;
  }): Promise<OrderPaginationResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.order_status) searchParams.append('order_status', params.order_status);

    const res = await fetch(`${API_BASE_URL}/orders/my-orders?${searchParams.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Không thể lấy lịch sử đơn hàng');
    return await res.json();
  },

  async getOrderDetail(orderCode: string): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderCode}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Không tìm thấy đơn hàng');
    return await res.json();
  },

  async cancelOrder(orderCode: string): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderCode}/cancel`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Hủy đơn hàng thất bại');
    }
    return await res.json();
  },

  // ==========================================
  // 5. ADMIN DASHBOARD APIS
  // ==========================================
  async getAdminStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/overview`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Không thể tải số liệu thống kê Dashboard');
    }
    return await res.json();
  },

  async getAdminProducts(params?: {
    page?: number;
    page_size?: number;
    brand?: string;
    stock_status?: string;
    search?: string;
  }): Promise<ProductPaginationResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.brand) searchParams.append('brand', params.brand);
    if (params?.stock_status) searchParams.append('stock_status', params.stock_status);
    if (params?.search) searchParams.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/admin/products?${searchParams.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm quản trị');
    return await res.json();
  },

  async createAdminProduct(productData: any): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Thêm sản phẩm thất bại');
    }
    return await res.json();
  },

  async updateAdminProduct(productId: number, productData: any): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Cập nhật sản phẩm thất bại');
    }
    return await res.json();
  },

  async updateAdminProductStock(
    productId: number,
    stockData: { stock_quantity?: number; is_active?: boolean }
  ): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/admin/products/${productId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(stockData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Cập nhật tồn kho thất bại');
    }
    return await res.json();
  },

  async deleteAdminProduct(productId: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Xóa sản phẩm thất bại');
    }
    return await res.json();
  },

  async getAdminOrders(params?: {
    page?: number;
    page_size?: number;
    order_status?: string;
    search?: string;
  }): Promise<OrderPaginationResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.order_status) searchParams.append('order_status', params.order_status);
    if (params?.search) searchParams.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/admin/orders?${searchParams.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Không thể tải danh sách đơn hàng quản trị');
    return await res.json();
  },

  async updateAdminOrderStatus(
    orderCode: string,
    statusData: { order_status: string; payment_status?: string; admin_note?: string }
  ): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/admin/orders/${orderCode}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(statusData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Cập nhật trạng thái đơn hàng thất bại');
    }
    return await res.json();
  },
};
