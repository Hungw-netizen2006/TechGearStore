import math
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.cart import CartItem
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderPaginationResponse,
)

router = APIRouter()


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo đơn hàng mới (Từ giỏ hàng hiện tại hoặc Mua ngay)",
)
def create_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Tạo đơn hàng mới cho khách hàng:
    - Lấy thông tin người nhận (Họ tên, SĐT, Địa chỉ) từ request hoặc fallback thông tin tài khoản.
    - Hỗ trợ 2 chế độ:
        1. `from_cart = True`: Đặt toàn bộ sản phẩm đang có trong giỏ hàng và tự động làm sạch giỏ hàng.
        2. `from_cart = False`: Đặt mua ngay danh sách sản phẩm gửi trong `items`.
    - Kiểm tra và trừ số lượng tồn kho của từng sản phẩm tự động.
    - Sinh mã đơn hàng duy nhất dạng `TG-YYYYMMDD-XXXX`.
    """
    # 1. Xác định thông tin nhận hàng
    customer_name = (order_in.customer_name or current_user.full_name or "").strip()
    shipping_phone = (order_in.shipping_phone or current_user.phone or "").strip()
    shipping_address = (order_in.shipping_address or current_user.address or "").strip()

    if not customer_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng cung cấp họ và tên người nhận hàng.",
        )
    if not shipping_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng cung cấp số điện thoại người nhận hàng.",
        )
    if not shipping_address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng cung cấp địa chỉ nhận hàng chi tiết.",
        )

    items_to_order: List[tuple[Product, int]] = []

    # 2. Xử lý lấy danh sách mặt hàng đặt mua
    if order_in.from_cart:
        # Lấy từ Database CartItem
        cart_items = (
            db.query(CartItem)
            .options(joinedload(CartItem.product))
            .filter(CartItem.user_id == current_user.id)
            .all()
        )
        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm vào giỏ trước khi đặt hàng.",
            )
        for c_item in cart_items:
            if not c_item.product or not c_item.product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Sản phẩm ID {c_item.product_id} trong giỏ không còn khả dụng.",
                )
            items_to_order.append((c_item.product, c_item.quantity))
    else:
        # Đặt mua ngay qua danh sách items truyền trực tiếp
        if not order_in.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Đơn hàng phải chứa ít nhất 1 sản phẩm khi không đặt từ giỏ hàng.",
            )
        for item_data in order_in.items:
            product = (
                db.query(Product)
                .filter(Product.id == item_data.product_id, Product.is_active == True)
                .first()
            )
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Sản phẩm ID {item_data.product_id} không tồn tại hoặc đã ngừng kinh doanh.",
                )
            items_to_order.append((product, item_data.quantity))

    # 3. Kiểm tra tồn kho và chuẩn bị OrderItem
    total_amount = 0.0
    created_order_items: List[OrderItem] = []

    for product, quantity in items_to_order:
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Số lượng đặt mua cho '{product.name}' phải lớn hơn 0.",
            )

        if product.stock_quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sản phẩm '{product.name}' chỉ còn {product.stock_quantity} sản phẩm trong kho. Không đủ để đáp ứng số lượng {quantity}.",
            )

        unit_price = float(product.price)
        line_total = unit_price * quantity
        total_amount += line_total

        # Trừ tồn kho tự động
        product.stock_quantity -= quantity

        created_order_items.append(
            OrderItem(
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
                total_price=line_total,
            )
        )

    # 4. Sinh mã đơn hàng duy nhất
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    short_uuid = uuid.uuid4().hex[:6].upper()
    order_code = f"TG-{date_str}-{short_uuid}"

    # 5. Lưu đơn hàng
    order = Order(
        order_code=order_code,
        user_id=current_user.id,
        customer_name=customer_name,
        shipping_phone=shipping_phone,
        shipping_address=shipping_address,
        total_amount=total_amount,
        payment_method=order_in.payment_method or "COD",
        payment_status="pending",
        order_status="pending",
        note=order_in.note,
        items=created_order_items,
    )

    db.add(order)

    # 6. Nếu đặt từ giỏ hàng, xóa sạch giỏ hàng của user sau khi đặt thành công
    if order_in.from_cart:
        db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()

    db.commit()
    db.refresh(order)
    return order


@router.get(
    "/my-orders",
    response_model=OrderPaginationResponse,
    summary="Xem lịch sử đơn hàng cá nhân của khách hàng",
)
def get_my_orders(
    page: int = Query(1, ge=1, description="Trang hiển thị"),
    page_size: int = Query(10, ge=1, le=50, description="Số đơn hàng mỗi trang"),
    order_status: Optional[str] = Query(None, description="Lọc theo trạng thái: pending, processing, shipped, delivered, cancelled"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lấy danh sách các đơn hàng của chính khách hàng đang đăng nhập:
    - Sắp xếp theo thời gian đặt mới nhất lên trước.
    - Hỗ trợ phân trang và lọc trạng thái đơn hàng.
    """
    query = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.user_id == current_user.id)
    )

    if order_status and order_status.strip():
        query = query.filter(Order.order_status == order_status.strip().lower())

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
    summary="Xem chi tiết một đơn hàng theo mã đơn",
)
def get_order_detail(
    order_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lấy chi tiết một đơn hàng cụ thể theo mã đơn (ví dụ: 'TG-20261029-XXXX'):
    - Khách hàng chỉ được xem đơn hàng của chính mình (hoặc Admin được xem mọi đơn hàng).
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

    # Kiểm tra quyền sở hữu
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập thông tin đơn hàng này.",
        )

    return order


@router.put(
    "/{order_code}/cancel",
    response_model=OrderResponse,
    summary="Hủy đơn hàng cá nhân (Khi đơn hàng còn ở trạng thái Chờ xử lý)",
)
def cancel_my_order(
    order_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Hủy đơn hàng:
    - Chỉ cho phép khách hàng hủy đơn hàng của chính mình.
    - Chỉ hủy được khi đơn hàng đang ở trạng thái 'pending' (Chờ xử lý).
    - Tự động hoàn lại số lượng tồn kho sản phẩm tương ứng.
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

    # Kiểm tra quyền
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền thao tác trên đơn hàng này.",
        )

    # Kiểm tra trạng thái đơn hàng
    if order.order_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể hủy đơn hàng vì đơn hàng đang ở trạng thái '{order.order_status}'. Bạn chỉ có thể hủy đơn khi đơn hàng đang 'Chờ xử lý' (pending).",
        )

    # Hoàn lại số lượng tồn kho
    for item in order.items:
        if item.product:
            item.product.stock_quantity += item.quantity

    order.order_status = "cancelled"
    db.commit()
    db.refresh(order)
    return order
