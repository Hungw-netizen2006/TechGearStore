# TechGear Store - Giao diện Frontend (React + TypeScript + Tailwind CSS)

Giao diện thương mại điện tử chuyên biệt phụ kiện công nghệ gaming đỉnh cao, được thiết kế theo phong cách hiện đại (Dark Theme, Cyberpunk/Esports Accent, Glassmorphism, Responsive 100%).

---

## 🛠 Công nghệ sử dụng
- **Build Tool**: Vite 5
- **Framework**: React 18 (TypeScript)
- **Routing**: React Router DOM 6
- **Styling**: Tailwind CSS 3
- **Icon Set**: Lucide React
- **Quản lý trạng thái (State Management)**: React Context API (`AuthContext`, `CartContext`)

---

## 🌟 Tính năng Giao diện chi tiết

### 1. Phía Khách hàng (Customer Storefront)
- **Trang chủ (`/`)**:
  - Banner Hero Esports công nghệ cao với các badge thông số nổi bật (8000Hz Polling, Optical Hybrid Switch, Tản nhiệt 25°C).
  - Thanh tìm kiếm sản phẩm với phím gõ phản hồi nhanh.
  - **Bộ lọc đa tiêu chí**:
    - **Lọc theo Danh mục**: Chuột Gaming, Bàn phím cơ, Tai nghe, Đế tản nhiệt.
    - **Lọc theo Hãng**: Tất cả, Logitech, Razer, Akko, ASUS ROG, IETS.
    - **Lọc theo Khoảng giá**: Dưới 2 triệu, 2tr - 4 triệu, 4tr - 6 triệu, Trên 6 triệu.
    - **Sắp xếp**: Mới nhất, Giá tăng dần, Giá giảm dần, Đánh giá cao.
  - Lưới hiển thị sản phẩm (Product Grid) với thẻ sản phẩm hiển thị thông số DPI/switch, tính % giảm giá, nút Mua ngay và nút Xem nhanh.
- **Trang Chi tiết Sản phẩm (`/product/:id`)**:
  - Hình ảnh sản phẩm lớn cùng nhãn thương hiệu và % giảm giá.
  - Bảng thông số kỹ thuật chi tiết (`specs`): Cảm biến, DPI, loại switch, driver, pin, kích thước, khối lượng, kết nối.
  - Bộ chọn số lượng mua, nút "Thêm vào giỏ" và nút "Mua ngay".
  - Các cam kết dịch vụ: Bảo hành 24 tháng 1 đổi 1, đổi mới 15 ngày, giao hỏa tốc 2 giờ.
- **Modal Đăng nhập / Đăng ký (`AuthModal`)**:
  - Chuyển tab mượt mà giữa Đăng nhập và Đăng ký.
  - Form validation: email, mật khẩu tối thiểu 6 ký tự, họ tên, số điện thoại, địa chỉ nhận hàng.
  - **Nút 1-Click Demo Login**: Đăng nhập nhanh 1 chạm với quyền Admin hoặc Khách hàng cực kỳ tiện lợi khi chấm điểm & thử nghiệm!
- **Giỏ hàng trượt (`CartDrawer`)**:
  - Tự động đồng bộ với cơ sở dữ liệu server khi đã đăng nhập hoặc lưu trữ LocalStorage khi duyệt vãng lai.
  - Tự động tính số lượng và tổng thành tiền theo thời gian thực.
  - Form đặt hàng COD nhanh: Tự động điền họ tên, số điện thoại, địa chỉ từ hồ sơ khách hàng.
  - Đặt hàng thành công hiển thị mã đơn hàng dạng `TG-YYYYMMDD-XXXX`.
- **Trang Lịch sử Đơn hàng cá nhân (`/my-orders`)**:
  - Danh sách đơn hàng đã đặt của khách.
  - Huy hiệu màu sắc trực quan theo từng trạng thái (Chờ xử lý, Đang đóng gói, Đang giao, Đã hoàn thành, Đã hủy).
  - Chi tiết từng món hàng, đơn giá, tổng tiền, địa chỉ giao hàng.
  - Nút **Hủy đơn hàng** trực tiếp khi đơn đang ở trạng thái `pending`.

---

### 2. Phía Quản trị (Admin Dashboard)
> **Bảo vệ quyền truy cập**: Tự động chặn và yêu cầu đăng nhập tài khoản có quyền `admin` (`role == 'admin'`).

- **Thống kê Tổng quan Dashboard (`/admin`)**:
  - **4 Thẻ chỉ số KPI**:
    - **Tổng doanh thu** (VND) và doanh thu hôm nay.
    - **Tổng số đơn hàng** (phân loại đơn theo trạng thái).
    - **Tổng số khách hàng** đăng ký.
    - **Tồn kho sản phẩm** (cảnh báo số mẫu sắp hết hàng và hết hàng).
  - **Biểu đồ Doanh thu 7 ngày gần nhất**: Vẽ trực quan bằng thanh cột đồ thị tỷ lệ theo ngày giao dịch.
  - **Tiến độ xử lý đơn hàng**: Thống kê số lượng đơn theo quy trình fulfillment (Chờ xử lý, Đang đóng gói, Đang giao, Đã hoàn thành).
  - **Top 5 Phụ kiện Bán chạy nhất**: Hiển thị ảnh, tên, hãng, số lượng bán ra và tổng doanh thu mang lại.
  - **5 Đơn hàng vừa đặt gần nhất**.
- **Trang Quản lý Sản phẩm (`/admin/products`)**:
  - Bảng dữ liệu sản phẩm quản trị: Ảnh, Tên, Hãng, Giá bán, Giá gốc, Tồn kho (Badge màu đỏ/vàng cảnh báo), Trạng thái (Đang bán / Ngừng bán).
  - Bộ lọc sản phẩm theo Hãng, lọc tình trạng tồn kho (`Hết hàng`, `Sắp hết hàng`), Tìm kiếm theo tên/slug.
  - **Nút "Thêm sản phẩm mới"**: Modal form nhập Tên, Slug, Hãng, Danh mục, Giá, Tồn kho, Mô tả, Ảnh URL và thông số kỹ thuật JSON (`specs`).
  - **Nút "Chỉnh sửa"**: Modal form cập nhật mọi thông tin và thông số sản phẩm.
  - **Nút "Sửa nhanh tồn kho"**: Cập nhật tức thì số lượng tồn kho `stock_quantity`.
  - **Nút "Xóa"**: Hỏi xác nhận, tự động chuyển Soft-delete an toàn nếu sản phẩm đã phát sinh đơn hàng.
- **Trang Quản lý Đơn hàng (`/admin/orders`)**:
  - Bảng danh sách toàn bộ đơn hàng trong toàn hệ thống.
  - Bộ lọc nhanh theo trạng thái (`Chờ xử lý`, `Đang đóng gói`, `Đang giao`, `Đã hoàn thành`, `Đã hủy`).
  - Thanh tìm kiếm đơn theo mã đơn hàng, tên khách hàng hoặc SĐT.
  - **Modal Xử lý Đơn hàng**: Xem chi tiết người nhận, địa chỉ, các sản phẩm trong đơn và Dropdown cập nhật trạng thái đơn hàng (Đang đóng gói -> Đang giao -> Đã hoàn thành -> Đã hủy).

---

## 🚀 Hướng dẫn khởi chạy Frontend

```powershell
cd frontend

# Cài đặt thư viện (nếu chưa):
npm install

# Khởi chạy chế độ phát triển:
npm run dev
```

Mở trình duyệt truy cập: **`http://localhost:5173`**

### Các đường dẫn điều hướng chính:
- Cửa hàng trang chủ: `http://localhost:5173/`
- Đơn hàng của tôi: `http://localhost:5173/my-orders`
- Phân hệ Quản trị Admin: `http://localhost:5173/admin`
- Quản lý Sản phẩm Admin: `http://localhost:5173/admin/products`
- Quản lý Đơn hàng Admin: `http://localhost:5173/admin/orders`
