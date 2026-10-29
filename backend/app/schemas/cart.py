from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.product import ProductResponse


class CartItemAdd(BaseModel):
    product_id: int = Field(..., description="ID sản phẩm cần thêm vào giỏ")
    quantity: int = Field(1, ge=1, le=100, description="Số lượng mua (mặc định 1)")


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, le=100, description="Số lượng cập nhật mới (tối thiểu 1)")


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float = Field(..., description="Đơn giá sản phẩm")
    subtotal: float = Field(..., description="Thành tiền = quantity * unit_price")
    is_in_stock: bool = Field(True, description="Còn đủ số lượng trong kho không")
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    total_items: int = Field(..., description="Tổng số loại sản phẩm trong giỏ")
    total_quantity: int = Field(..., description="Tổng số lượng sản phẩm trong giỏ")
    total_amount: float = Field(..., description="Tổng giá trị đơn hàng tạm tính (VND)")
    items: List[CartItemResponse] = Field(default_factory=list, description="Danh sách các sản phẩm trong giỏ")

    model_config = ConfigDict(from_attributes=True)

