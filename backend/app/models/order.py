from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_code = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    customer_name = Column(String(100), nullable=False)
    shipping_phone = Column(String(20), nullable=False)
    shipping_address = Column(Text, nullable=False)

    total_amount = Column(Float, nullable=False)

    payment_method = Column(String(50), default="COD", nullable=False)  # COD, VNPAY, MOMO, BANKING
    payment_status = Column(String(50), default="pending", nullable=False)  # pending, paid, failed, refunded
    order_status = Column(String(50), default="pending", nullable=False)  # pending, processing, shipped, delivered, cancelled

    note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

