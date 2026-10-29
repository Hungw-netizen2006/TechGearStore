<<<<<<< HEAD
# 🎮 TechGear Store - Full-Stack E-Commerce Platform

Dự án Website thương mại điện tử chuyên kinh doanh phụ kiện công nghệ gaming cao cấp (Chuột Esports, Bàn phím cơ Custom, Tai nghe Hi-Res, Đế tản nhiệt Turbofan).

---

## 🏗 Kiến trúc tổng thể hệ thống

```
BTL_VibeCoding/
├── backend/                  # FastAPI (Python 3.13) + SQLite
│   ├── app/
│   │   ├── api/              # RESTful API Endpoints:
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py              # Đăng ký, Đăng nhập JWT, Profile
│   │   │   │   ├── products.py          # Lọc sản phẩm (DPI, switch, brand, khoảng giá)
│   │   │   │   ├── cart.py              # Thêm, sửa, xóa giỏ hàng, tính tổng tiền tự động
│   │   │   │   ├── orders.py            # Đặt hàng, lịch sử đơn hàng cá nhân, hủy đơn
│   │   │   │   ├── admin_products.py    # [Admin] CRUD sản phẩm, cập nhật tồn kho
│   │   │   │   ├── admin_orders.py      # [Admin] Quản lý đơn, cập nhật trạng thái (đóng gói, giao, hoàn thành)
│   │   │   │   └── admin_analytics.py   # [Admin] Thống kê doanh thu, biểu đồ 7 ngày, top bán chạy
│   │   │   └── router.py                # Tổng hợp Router v1
│   │   ├── core/             # Cấu hình dự án (Settings, CORS, JWT Security)
│   │   ├── db/               # SQLite connection & SQLAlchemy Session
│   │   ├── models/           # Database Models (User, Category, Product, Order, OrderItem, CartItem)
│   │   ├── schemas/          # Pydantic Schemas (Request/Response DTOs & Admin Analytics)
│   │   ├── seed/             # Seed phụ kiện công nghệ thực tế (Logitech, Razer, Akko...) & Danh mục
│   │   └── main.py           # FastAPI Entrypoint & Docs Swagger UI
│   ├── requirements.txt      # Thư viện Python
│   ├── .env.example          # Biến môi trường mẫu
│   └── README.md
│
├── frontend/                 # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # UI Components (Navbar, Footer, ProductCard, ProductGrid, Modal, CartDrawer)
│   │   ├── services/         # Tích hợp API Backend & Offline Fallback
│   │   ├── types/            # TypeScript Interfaces
│   │   ├── App.tsx           # Ứng dụng chính (Bộ lọc, Tìm kiếm, Giỏ hàng, Modal)
│   │   ├── main.tsx          # React DOM render
│   │   └── index.css         # Tailwind directives
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md
│
└── README.md                 # Tài liệu hướng dẫn tổng quan dự án
```

---

## 🗄 Mô hình cơ sở dữ liệu (SQLite Database Models)

1. **User (`users`)**:
   - `id`, `email`, `hashed_password`, `full_name`, `phone`, `address`, `role` (`admin`/`customer`), `is_active`, `created_at`, `updated_at`.
2. **Category (`categories`)**:
   - `id`, `name`, `slug`, `description`, `image_url`, `created_at`.
   - Danh mục: _Chuột Gaming_, _Bàn phím cơ_, _Tai nghe Gaming_, _Đế tản nhiệt_.
3. **Product (`products`)**:
   - `id`, `name`, `slug`, `brand`, `category_id`, `price`, `original_price`, `stock_quantity`, `description`, `specs` (JSON: chứa thông số DPI, loại switch, driver, tốc độ quạt RPM...), `image_url`, `gallery_images` (JSON), `rating`, `review_count`, `is_featured`, `is_active`.
4. **Order (`orders`)**:
   - `id`, `order_code` (e.g. `TG-20261029-XXXX`), `user_id`, `customer_name`, `shipping_phone`, `shipping_address`, `total_amount`, `payment_method` (`COD`, `Banking`...), `payment_status`, `order_status`, `note`, `created_at`.
5. **OrderItem (`order_items`)**:
   - `id`, `order_id`, `product_id`, `quantity`, `unit_price`, `total_price`.

---

## 📦 5 Sản phẩm phụ kiện công nghệ thực tế được Seed sẵn

1. **Chuột Gaming Không Dây Logitech G Pro X Superlight 2 Lightspeed**:
   - **Hãng**: Logitech G | **Giá**: 3.590.000 ₫ (Gốc: 3.890.000 ₫)
   - **Thông số kỹ thuật nổi bật**: Cảm biến HERO 2 **32,000 DPI**, Switch cơ quang học lai **LIGHTFORCE Hybrid**, tần số **2,000Hz (0.5ms)**, trọng lượng siêu nhẹ **60g**, thời lượng pin **95 giờ**.
2. **Bàn phím cơ không dây ASUS ROG Azoth 75% Custom OLED**:
   - **Hãng**: ASUS ROG | **Giá**: 5.990.000 ₫ (Gốc: 6.490.000 ₫)
   - **Thông số kỹ thuật nổi bật**: Switch **ROG NX Snow** pre-lubed, **Màn hình OLED 2-inch** hiển thị thông số và GIF, Cấu trúc **Gasket Mount 3 lớp đệm silicone tiêu âm**, Pin khủng **2,000 giờ**.
3. **Tai nghe Gaming không dây Razer BlackShark V2 Pro (2023 Edition)**:
   - **Hãng**: Razer | **Giá**: 4.490.000 ₫ (Gốc: 4.990.000 ₫)
   - **Thông số kỹ thuật nổi bật**: Màng loa **TriForce Titanium 50mm**, Micro **HyperClear Super Wideband 9.6kHz**, Âm thanh vòm **THX Spatial Audio**, Pin **70 giờ** (sạc nhanh Type-C).
4. **Đế tản nhiệt Laptop IETS GT500 V2 Turbofan 5000 RPM**:
   - **Hãng**: IETS | **Giá**: 1.850.000 ₫ (Gốc: 2.150.000 ₫)
   - **Thông số kỹ thuật nổi bật**: Tốc độ quạt tăng áp **5,000 RPM**, Vòng đệm bọt biển kín khí hạ nhiệt CPU/GPU từ **15°C - 25°C**, Lưới lọc bụi công nghiệp có thể rửa sạch.
5. **Chuột Gaming Không Dây Siêu Nhẹ Razer Viper V3 Pro**:
   - **Hãng**: Razer | **Giá**: 3.990.000 ₫ (Gốc: 4.390.000 ₫)
   - **Thông số kỹ thuật nổi bật**: Cảm biến quang học **35,000 DPI** (Focus Pro Gen-2), Switch quang học **Razer Gen-3** (90 triệu click), **HyperPolling Native 8000Hz**, Trọng lượng **54g**.

---

## ⚡ Hướng dẫn chạy dự án nhanh chóng

### 1. Khởi chạy Backend (FastAPI + SQLite)

```bash
# Mở terminal thứ nhất:
cd backend

# Kích hoạt virtualenv (đã tạo sẵn trong thư mục backend/venv):
.\venv\Scripts\activate

# Chạy seed dữ liệu (tùy chọn vì server tự seed khi bật lần đầu):
python -m app.seed.seed_data

# Khởi chạy server FastAPI:
uvicorn app.main:app --reload --port 8000
```

- API Docs Swagger: `http://localhost:8000/api/v1/docs`

### 2. Khởi chạy Frontend (React + Vite + Tailwind CSS)

```bash
# Mở terminal thứ hai:
cd frontend

# Chạy ứng dụng ở chế độ phát triển:
npm run dev
```

- Truy cập cửa hàng: `http://localhost:5173`
=======
# VibeCode_V1
>>>>>>> 56cce964264e981668844d6c9b3208db2697f210
# TechGearStore
