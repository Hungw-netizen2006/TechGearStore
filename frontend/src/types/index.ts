export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at?: string;
}

export interface ProductSpecs {
  DPI?: string;
  Switch?: string;
  "Loại switch"?: string;
  "Tốc độ quạt"?: string;
  "Màng loa (Driver)"?: string;
  "Microphone"?: string;
  "Polling Rate"?: string;
  "Tần số phản hồi"?: string;
  "Trọng lượng"?: string;
  "Kết nối"?: string;
  "Thời lượng pin"?: string;
  [key: string]: string | undefined;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category_id: number;
  price: number;
  original_price?: number;
  stock_quantity: number;
  description?: string;
  specs?: ProductSpecs;
  image_url: string;
  gallery_images?: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_active: boolean;
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPaginationResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  items: Product[];
}

export interface ProductListResponse {
  total: number;
  items: Product[];
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'customer';
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: User;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface Order {
  id: number;
  order_code: string;
  user_id?: number;
  customer_name: string;
  shipping_phone: string;
  shipping_address: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  note?: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}

export interface OrderPaginationResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: Order[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ServerCartResponse {
  total_items: number;
  total_quantity: number;
  total_amount: number;
  items: {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    is_in_stock: boolean;
    product: Product;
  }[];
}

// Admin Dashboard Types
export interface RevenueChartItem {
  date: string;
  revenue: number;
  orders_count: number;
}

export interface TopSellingProduct {
  product_id: number;
  name: string;
  brand: string;
  image_url: string;
  price: number;
  total_sold: number;
  total_revenue: number;
}

export interface DashboardStats {
  total_revenue: number;
  today_revenue: number;
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipping_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_customers: number;
  total_products: number;
  active_products: number;
  low_stock_products_count: number;
  out_of_stock_products_count: number;
  revenue_chart_7days: RevenueChartItem[];
  top_selling_products: TopSellingProduct[];
  recent_orders: Order[];
}
