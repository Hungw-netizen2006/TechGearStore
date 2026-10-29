from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.order import OrderResponse


class ProductStockUpdate(BaseModel):
    stock_quantity: Optional[int] = Field(None, ge=0, description="Số lượng tồn kho mới")
    is_active: Optional[bool] = Field(None, description="Trạng thái kinh doanh (True: Còn bán, False: Ngừng bán/Ẩn)")


class OrderStatusUpdate(BaseModel):
    order_status: str = Field(
        ...,
        description="Trạng thái đơn hàng: pending (Chờ xử lý), processing (Đang đóng gói), shipping (Đang giao), delivered (Đã hoàn thành), cancelled (Đã hủy)",
    )
    payment_status: Optional[str] = Field(
        None,
        description="Trạng thái thanh toán: pending (Chưa thanh toán), paid (Đã thanh toán), refunded (Đã hoàn tiền), failed (Thất bại)",
    )
    admin_note: Optional[str] = Field(None, description="Ghi chú nội bộ của quản trị viên")


class RevenueChartItem(BaseModel):
    date: str = Field(..., description="Ngày thống kê (YYYY-MM-DD)")
    revenue: float = Field(..., description="Doanh thu trong ngày (VND)")
    orders_count: int = Field(..., description="Số đơn hàng trong ngày")


class TopSellingProduct(BaseModel):
    product_id: int
    name: str
    brand: str
    image_url: str
    price: float
    total_sold: int = Field(..., description="Tổng số lượng đã bán")
    total_revenue: float = Field(..., description="Tổng doanh thu từ sản phẩm này (VND)")


class DashboardStatsResponse(BaseModel):
    # Doanh thu
    total_revenue: float = Field(..., description="Tổng doanh thu toàn hệ thống (VND)")
    today_revenue: float = Field(..., description="Doanh thu trong ngày hôm nay (VND)")

    # Đơn hàng
    total_orders: int = Field(..., description="Tổng số lượng đơn hàng")
    pending_orders: int = Field(..., description="Số đơn chờ xử lý (pending)")
    processing_orders: int = Field(..., description="Số đơn đang đóng gói (processing)")
    shipping_orders: int = Field(..., description="Số đơn đang giao (shipping)")
    delivered_orders: int = Field(..., description="Số đơn hoàn thành (delivered)")
    cancelled_orders: int = Field(..., description="Số đơn đã hủy (cancelled)")

    # Khách hàng
    total_customers: int = Field(..., description="Tổng số khách hàng đăng ký tài khoản")

    # Kho hàng
    total_products: int = Field(..., description="Tổng số sản phẩm trong danh mục")
    active_products: int = Field(..., description="Số sản phẩm đang mở bán")
    low_stock_products_count: int = Field(..., description="Số sản phẩm sắp hết hàng (tồn <= 5)")
    out_of_stock_products_count: int = Field(..., description="Số sản phẩm đã hết hàng (tồn = 0)")

    # Biểu đồ & Danh sách nổi bật
    revenue_chart_7days: List[RevenueChartItem] = Field(
        default_factory=list,
        description="Số liệu doanh thu và số đơn 7 ngày gần nhất",
    )
    top_selling_products: List[TopSellingProduct] = Field(
        default_factory=list,
        description="Top 5 sản phẩm bán chạy nhất",
    )
    recent_orders: List[OrderResponse] = Field(
        default_factory=list,
        description="5 đơn hàng mới nhất của hệ thống",
    )

    model_config = ConfigDict(from_attributes=True)

