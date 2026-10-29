# TechGear Store - Backend API (FastAPI + SQLite)

Hệ thống Backend RESTful API hoàn chỉnh phục vụ cả **Phía Khách hàng (Customer-Facing APIs)** và **Phân hệ Quản trị (Admin Dashboard APIs)** cho TechGear Store.

---

## 🛠 Công nghệ & Thư viện sử dụng
- **Ngôn ngữ**: Python 3.13+
- **Framework Web**: FastAPI (Chuẩn Asynchronous ASGI)
- **Database**: SQLite (file `techgear.db`)
- **ORM**: SQLAlchemy 2.0 (Declarative Base, Relationship, Eager Loading)
- **Validation**: Pydantic v2 (Data modeling & type checking)
- **Bảo mật & Phân quyền**: `bcrypt` (mã hóa mật khẩu), `python-jose` (JWT), RBAC (`role: admin` / `customer`)
- **Kiểm thử**: `httpx` (FastAPI TestClient)

---

## 🔑 Tài khoản mẫu thử nghiệm
| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin@techgear.vn` | `admin123456` | Toàn quyền quản trị hệ thống, CRUD sản phẩm, duyệt đơn, xem thống kê |
| **Khách hàng (Customer)** | `hung.nv@techgear.vn` | `user123456` | Mua hàng, xem giỏ, đặt hàng, xem lịch sử cá nhân |

---

## 📚 Danh sách API Endpoints

### 1. Phân hệ Quản trị - Admin Dashboard (`/api/v1/admin`) *(Yêu cầu quyền Admin)*

#### A. Quản lý Sản phẩm (CRUD):
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/v1/admin/products` | Thêm mới sản phẩm phụ kiện (tên, hãng, giá, tồn kho, specs chi tiết...). Kiểm tra slug trùng lặp. |
| `GET` | `/api/v1/admin/products` | Xem danh sách toàn bộ sản phẩm quản trị (kèm phân trang, lọc theo hãng, tồn kho `stock_status=out_of_stock, low_stock`, tìm kiếm). |
| `GET` | `/api/v1/admin/products/{id}` | Xem chi tiết 1 sản phẩm. |
| `PUT` | `/api/v1/admin/products/{id}` | Cập nhật thông tin chi tiết sản phẩm (sửa giá, specs, tên, mô tả, ảnh, hãng...). |
| `PATCH` | `/api/v1/admin/products/{id}/stock` | Cập nhật nhanh số lượng tồn kho hoặc trạng thái kinh doanh còn/hết hàng (`stock_quantity`, `is_active`). |
| `DELETE` | `/api/v1/admin/products/{id}` | Xóa sản phẩm: Tự động chuyển **Soft-delete** (`is_active = False`) nếu sản phẩm đã có đơn hàng liên kết; Xóa hoàn toàn nếu chưa có đơn hàng. |

#### B. Quản lý Đơn hàng:
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/admin/orders` | Xem danh sách toàn bộ đơn hàng của hệ thống (phân trang, lọc theo trạng thái, tìm kiếm theo mã đơn, tên khách, SĐT). |
| `GET` | `/api/v1/admin/orders/{order_code}` | Xem chi tiết toàn bộ thông tin đơn hàng, danh sách sản phẩm và khách hàng. |
| `PATCH` | `/api/v1/admin/orders/{order_code}/status` | Cập nhật trạng thái đơn hàng (`processing`: Đang đóng gói, `shipping`: Đang giao, `delivered`: Đã hoàn thành, `cancelled`: Đã hủy). Tự động cập nhật thanh toán hoặc hoàn tồn kho khi hủy đơn. |

#### C. Thống kê Tổng quan (Dashboard Analytics):
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/admin/analytics/overview` | Trả về toàn bộ số liệu thống kê: **Tổng doanh thu**, **Doanh thu hôm nay**, **Tổng số đơn hàng** (phân loại theo từng trạng thái), **Tổng số khách hàng**, **Tồn kho sản phẩm** (sắp hết / hết hàng), **Dữ liệu biểu đồ doanh thu 7 ngày gần nhất**, **Top 5 sản phẩm bán chạy nhất**, và **5 đơn hàng mới nhất**. |

---

### 2. Phân hệ Khách hàng (`/api/v1`)
| Phân nhóm | Endpoint | Mô tả |
|---|---|---|
| **Xác thực** | `POST /api/v1/auth/register` | Đăng ký tài khoản khách hàng mới (kiểm tra trùng email). |
| | `POST /api/v1/auth/login` | Đăng nhập nhận JWT Access Token. |
| | `GET /api/v1/auth/me` | Xem thông tin cá nhân. |
| | `PUT /api/v1/auth/me` | Cập nhật thông tin hoặc đổi mật khẩu. |
| **Sản phẩm** | `GET /api/v1/products` | Lấy danh sách sản phẩm (phân trang, lọc hãng Logitech, Razer, Akko..., khoảng giá, tìm kiếm). |
| | `GET /api/v1/products/{id}` | Chi tiết sản phẩm kèm thông số kỹ thuật `specs`. |
| **Giỏ hàng** | `GET /api/v1/cart` | Xem giỏ hàng cá nhân, tự động tính tổng tiền. |
| | `POST /api/v1/cart/items` | Thêm sản phẩm vào giỏ, kiểm tra tồn kho. |
| | `PUT /api/v1/cart/items/{id}` | Cập nhật số lượng trong giỏ. |
| | `DELETE /api/v1/cart/items/{id}`| Xóa sản phẩm khỏi giỏ. |
| | `DELETE /api/v1/cart` | Xóa toàn bộ giỏ hàng. |
| **Đơn hàng** | `POST /api/v1/orders` | Đặt hàng từ giỏ hàng hoặc mua ngay, trừ tồn kho, xóa giỏ sau khi đặt. |
| | `GET /api/v1/orders/my-orders` | Xem lịch sử đơn hàng cá nhân. |
| | `GET /api/v1/orders/{code}` | Xem chi tiết đơn hàng cá nhân. |
| | `PUT /api/v1/orders/{code}/cancel` | Hủy đơn hàng cá nhân khi đang pending (tự động hoàn kho). |

---

## 🧪 Chạy Kiểm thử Tự động (100% Pass)

Hệ thống có sẵn 2 bộ kiểm thử tự động toàn diện:
```powershell
cd backend

# 1. Kiểm thử toàn bộ API Khách hàng:
.\venv\Scripts\python ..\test_client_apis.py

# 2. Kiểm thử toàn bộ API Quản trị (Admin Dashboard):
.\venv\Scripts\python ..\test_admin_apis.py
```

---

## 🚀 Khởi chạy Máy chủ Backend

```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
- **Tài liệu Swagger UI**: `http://localhost:8000/api/v1/docs`
- **Tài liệu ReDoc**: `http://localhost:8000/api/v1/redoc`
