from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.product import ProductResponse


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., description="ID sản phẩm cần đặt")
    quantity: int = Field(1, ge=1, description="Số lượng đặt mua")


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total_price: float
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    customer_name: Optional[str] = Field(None, max_length=100, description="Tên người nhận (bỏ trống để lấy từ tài khoản)")
    shipping_phone: Optional[str] = Field(None, max_length=20, description="SĐT người nhận (bỏ trống để lấy từ tài khoản)")
    shipping_address: Optional[str] = Field(None, max_length=255, description="Địa chỉ nhận hàng (bỏ trống để lấy từ tài khoản)")
    payment_method: str = Field(default="COD", description="Phương thức thanh toán: COD, VNPAY, MOMO, BANKING")
    note: Optional[str] = Field(None, description="Ghi chú giao hàng")

    # Đặt hàng từ giỏ hàng hoặc gửi danh sách sản phẩm mua ngay
    from_cart: bool = Field(default=True, description="Đặt hàng từ toàn bộ giỏ hàng hiện tại")
    items: Optional[List[OrderItemCreate]] = Field(None, description="Danh sách sản phẩm mua ngay (nếu from_cart=False)")


class OrderResponse(BaseModel):
    id: int
    order_code: str
    user_id: Optional[int] = None
    customer_name: str
    shipping_phone: str
    shipping_address: str
    total_amount: float
    payment_method: str
    payment_status: str
    order_status: str
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class OrderPaginationResponse(BaseModel):
    total: int = Field(..., description="Tổng số đơn hàng")
    page: int = Field(..., description="Trang hiện tại")
    page_size: int = Field(..., description="Số đơn hàng mỗi trang")
    total_pages: int = Field(..., description="Tổng số trang")
    items: List[OrderResponse] = Field(..., description="Danh sách đơn hàng")
