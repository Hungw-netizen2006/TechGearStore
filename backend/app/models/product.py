from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    brand = Column(String(100), nullable=False, index=True)  # e.g., Logitech, Razer, ASUS ROG, IETS
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)

    price = Column(Float, nullable=False)  # Giá bán hiện tại (VND)
    original_price = Column(Float, nullable=True)  # Giá niêm yết trước giảm
    stock_quantity = Column(Integer, default=0, nullable=False)
    description = Column(Text, nullable=True)

    # Chi tiết kỹ thuật công nghệ: DPI, switch, cảm biến, kết nối, LED RGB, RPM quạt...
    # Ví dụ: {"dpi": "32000 DPI", "switch": "Lightforce Hybrid", "connection": "Wireless 2.4GHz", "weight": "60g"}
    specs = Column(JSON, nullable=True, default=dict)

    image_url = Column(String(500), nullable=False)  # Ảnh đại diện chính
    gallery_images = Column(JSON, nullable=True, default=list)  # Danh sách URL ảnh bổ sung

    rating = Column(Float, default=5.0)
    review_count = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

