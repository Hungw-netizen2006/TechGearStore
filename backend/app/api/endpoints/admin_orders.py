import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.api.deps import get_db, get_current_admin
from app.models.user import User
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderResponse, OrderPaginationResponse
from app.schemas.admin import OrderStatusUpdate

router = APIRouter()

VALID_ORDER_STATUSES = ["pending", "processing", "shipping", "delivered", "cancelled"]
VALID_PAYMENT_STATUSES = ["pending", "paid", "refunded", "failed"]


@router.get(
    "",
    response_model=OrderPaginationResponse,
    summary="[Admin] Xem danh sách toàn bộ đơn hàng của hệ thống (kèm lọc & tìm kiếm)",
)
def get_all_orders(
    page: int = Query(1, ge=1, description="Số trang hiển thị"),
    page_size: int = Query(10, ge=1, le=100, description="Số đơn hàng mỗi trang"),
    order_status: Optional[str] = Query(
        None,
        description="Lọc theo trạng thái: pending (Chờ xử lý), processing (Đang đóng gói), shipping (Đang giao), delivered (Đã hoàn thành), cancelled (Đã hủy)",
    ),
    payment_status: Optional[str] = Query(None, description="Lọc theo thanh toán: pending, paid, refunded"),
    payment_method: Optional[str] = Query(None, description="Lọc theo hình thức: COD, VNPAY, MOMO, BANKING"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo mã đơn hàng, tên khách hàng hoặc SĐT"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Quản lý toàn bộ đơn hàng trên TechGear Store:
    - Tìm kiếm nhanh theo mã đơn (VD: TG-20261029-XXXX), họ tên khách hoặc số điện thoại.
    - Lọc theo từng nấc trạng thái đơn hàng.
    """
    query = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product))

    # Lọc trạng thái đơn hàng
    if order_status and order_status.strip():
        status_clean = order_status.strip().lower()
        if status_clean in VALID_ORDER_STATUSES:
            query = query.filter(Order.order_status == status_clean)

    # Lọc trạng thái thanh toán
    if payment_status and payment_status.strip():
        query = query.filter(Order.payment_status == payment_status.strip().lower())

    # Lọc phương thức thanh toán
    if payment_method and payment_method.strip():
        query = query.filter(Order.payment_method == payment_method.strip().upper())

    # Tìm kiếm
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Order.order_code.ilike(term),
                Order.customer_name.ilike(term),
                Order.shipping_phone.ilike(term),
            )
        )

    # Đơn hàng mới nhất lên đầu
    query = query.order_by(Order.id.desc())

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return OrderPaginationResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=items,
    )


@router.get(
    "/{order_code}",
    response_model=OrderResponse,
    summary="[Admin] Xem chi tiết toàn bộ một đơn hàng",
)
def get_order_detail(
    order_code: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.order_code == order_code.strip())
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Đơn hàng với mã '{order_code}' không tồn tại.",
        )
    return order


@router.patch(
    "/{order_code}/status",
    response_model=OrderResponse,
    summary="[Admin] Cập nhật trạng thái đơn hàng (Đang đóng gói, Đang giao, Đã hoàn thành, v.v.)",
)
def update_order_status(
    order_code: str,
    status_in: OrderStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Cập nhật tiến độ xử lý đơn hàng:
    - **processing**: Đang đóng gói hàng.
    - **shipping**: Đang bàn giao cho đơn vị vận chuyển.
    - **delivered**: Đã giao thành công (Tự động cập nhật payment_status thành 'paid' nếu COD).
    - **cancelled**: Hủy đơn (Tự động hoàn lại số lượng tồn kho cho các sản phẩm trong đơn).
    """
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.order_code == order_code.strip())
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy đơn hàng với mã '{order_code}'.",
        )

    new_order_status = status_in.order_status.strip().lower()
    if new_order_status not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trạng thái đơn hàng '{new_order_status}' không hợp lệ. Các trạng thái hợp lệ gồm: {', '.join(VALID_ORDER_STATUSES)}",
        )

    old_status = order.order_status

    # 1. Xử lý tồn kho khi chuyển trạng thái sang cancelled hoặc từ cancelled sang trạng thái khác
    if new_order_status == "cancelled" and old_status != "cancelled":
        # Hoàn kho
        for item in order.items:
            if item.product:
                item.product.stock_quantity += item.quantity
    elif old_status == "cancelled" and new_order_status != "cancelled":
        # Phục hồi đơn -> trừ lại kho
        for item in order.items:
            if item.product:
                if item.product.stock_quantity < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Không thể phục hồi đơn vì sản phẩm '{item.product.name}' chỉ còn tồn {item.product.stock_quantity} (cần {item.quantity}).",
                    )
                item.product.stock_quantity -= item.quantity

    # 2. Cập nhật trạng thái đơn hàng
    order.order_status = new_order_status

    # 3. Tự động xử lý trạng thái thanh toán khi giao thành công
    if new_order_status == "delivered":
        order.payment_status = "paid"

    if status_in.payment_status:
        pay_status = status_in.payment_status.strip().lower()
        if pay_status in VALID_PAYMENT_STATUSES:
            order.payment_status = pay_status

    if status_in.admin_note:
        order.note = (order.note or "") + f" [Admin]: {status_in.admin_note}"

    db.commit()
    db.refresh(order)
    return order

