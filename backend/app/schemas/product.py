from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.category import CategoryResponse


class ProductBase(BaseModel):
    name: str = Field(..., max_length=255, description="Tên sản phẩm")
    slug: str = Field(..., max_length=255, description="Slug URL")
    brand: str = Field(..., max_length=100, description="Hãng sản xuất: Logitech, Razer, Akko, ASUS ROG, IETS...")
    category_id: int = Field(..., description="ID danh mục phụ kiện")
    price: float = Field(..., ge=0, description="Giá bán hiện tại (VND)")
    original_price: Optional[float] = Field(None, ge=0, description="Giá niêm yết trước giảm")
    stock_quantity: int = Field(default=0, ge=0, description="Số lượng tồn kho")
    description: Optional[str] = Field(None, description="Mô tả chi tiết sản phẩm")
    specs: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Thông số kỹ thuật: DPI, Switch, Polling Rate, Driver, Pin, v.v.",
    )
    image_url: str = Field(..., max_length=500, description="URL ảnh đại diện chính")
    gallery_images: Optional[List[str]] = Field(default_factory=list, description="Danh sách URL ảnh phụ")
    rating: Optional[float] = Field(default=5.0, ge=0, le=5.0)
    review_count: Optional[int] = Field(default=0, ge=0)
    is_featured: Optional[bool] = Field(default=False)
    is_active: Optional[bool] = Field(default=True)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    brand: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    description: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ProductPaginationResponse(BaseModel):
    total: int = Field(..., description="Tổng số sản phẩm phù hợp")
    page: int = Field(..., description="Trang hiện tại")
    page_size: int = Field(..., description="Số sản phẩm trên mỗi trang")
    total_pages: int = Field(..., description="Tổng số trang")
    has_next: bool = Field(..., description="Có trang tiếp theo hay không")
    has_prev: bool = Field(..., description="Có trang trước hay không")
    items: List[ProductResponse] = Field(..., description="Danh sách sản phẩm")
