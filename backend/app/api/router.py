from fastapi import APIRouter
from app.api.endpoints import (
    auth,
    categories,
    products,
    cart,
    orders,
    admin_products,
    admin_orders,
    admin_analytics,
)

api_router = APIRouter()

# ==========================================
# 1. API PHÍA KHÁCH HÀNG (CUSTOMER FACING)
# ==========================================
api_router.include_router(auth.router, prefix="/auth", tags=["1. Khách hàng - Xác thực & Profile"])
api_router.include_router(categories.router, prefix="/categories", tags=["2. Khách hàng - Danh mục"])
api_router.include_router(products.router, prefix="/products", tags=["3. Khách hàng - Sản phẩm"])
api_router.include_router(cart.router, prefix="/cart", tags=["4. Khách hàng - Giỏ hàng"])
api_router.include_router(orders.router, prefix="/orders", tags=["5. Khách hàng - Đơn hàng"])

# ==========================================
# 2. API PHÂN HỆ QUẢN TRỊ (ADMIN DASHBOARD)
# ==========================================
api_router.include_router(
    admin_products.router,
    prefix="/admin/products",
    tags=["Quản trị - Quản lý Sản phẩm (CRUD)"],
)
api_router.include_router(
    admin_orders.router,
    prefix="/admin/orders",
    tags=["Quản trị - Quản lý Đơn hàng"],
)
api_router.include_router(
    admin_analytics.router,
    prefix="/admin/analytics",
    tags=["Quản trị - Thống kê Tổng quan Dashboard"],
)
