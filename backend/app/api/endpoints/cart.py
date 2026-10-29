from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.cart import CartItem
from app.schemas.cart import (
    CartItemAdd,
    CartItemUpdate,
    CartItemResponse,
    CartResponse,
)

router = APIRouter()


def _calculate_user_cart(db: Session, user_id: int) -> CartResponse:
    """
    Hàm phụ trợ: Truy vấn tất cả sản phẩm trong giỏ hàng của người dùng,
    tự động tính toán thành tiền cho từng sản phẩm và tổng tiền cả giỏ hàng.
    """
    cart_items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == user_id)
        .order_by(CartItem.id.asc())
        .all()
    )

    items_response: List[CartItemResponse] = []
    total_amount = 0.0
    total_quantity = 0

    for item in cart_items:
        prod = item.product
        if not prod or not prod.is_active:
            continue

        unit_price = float(prod.price)
        subtotal = unit_price * item.quantity
        is_in_stock = prod.stock_quantity >= item.quantity

        total_amount += subtotal
        total_quantity += item.quantity

        items_response.append(
            CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=unit_price,
                subtotal=subtotal,
                is_in_stock=is_in_stock,
                product=prod,
            )
        )

    return CartResponse(
        total_items=len(items_response),
        total_quantity=total_quantity,
        total_amount=total_amount,
        items=items_response,
    )


@router.get(
    "",
    response_model=CartResponse,
    summary="Xem giỏ hàng của khách hàng hiện tại (kèm tính tổng tiền tự động)",
)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lấy toàn bộ sản phẩm trong giỏ hàng của người dùng đang đăng nhập:
    - Tự động tính đơn giá và thành tiền theo giá mới nhất của sản phẩm.
    - Kiểm tra tình trạng tồn kho của từng món hàng.
    - Tính tổng số lượng và tổng tiền thanh toán tạm tính.
    """
    return _calculate_user_cart(db, current_user.id)


@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Thêm sản phẩm vào giỏ hàng",
)
def add_to_cart(
    item_in: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Thêm sản phẩm vào giỏ hàng:
    - Kiểm tra sản phẩm tồn tại và đang được mở bán.
    - Kiểm tra số lượng tồn kho của sản phẩm.
    - Nếu sản phẩm đã có sẵn trong giỏ hàng -> Tăng số lượng dồn.
    - Trả về giỏ hàng cập nhật kèm tổng tiền tự động.
    """
    # 1. Kiểm tra sản phẩm
    product = (
        db.query(Product)
        .filter(Product.id == item_in.product_id, Product.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sản phẩm với ID {item_in.product_id} không tồn tại hoặc đã ngừng kinh doanh.",
        )

    # 2. Tìm sản phẩm trong giỏ hàng hiện tại của user
    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == item_in.product_id,
        )
        .first()
    )

    requested_quantity = item_in.quantity
    if cart_item:
        new_quantity = cart_item.quantity + requested_quantity
    else:
        new_quantity = requested_quantity

    # 3. Kiểm tra số lượng tồn kho
    if product.stock_quantity < new_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sản phẩm '{product.name}' chỉ còn {product.stock_quantity} sản phẩm trong kho. Bạn đang yêu cầu {new_quantity} sản phẩm.",
        )

    # 4. Lưu vào Database
    if cart_item:
        cart_item.quantity = new_quantity
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=product.id,
            quantity=new_quantity,
        )
        db.add(cart_item)

    db.commit()

    return _calculate_user_cart(db, current_user.id)


@router.put(
    "/items/{product_id}",
    response_model=CartResponse,
    summary="Cập nhật số lượng sản phẩm trong giỏ hàng",
)
def update_cart_item_quantity(
    product_id: int,
    item_update: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cập nhật số lượng sản phẩm cụ thể trong giỏ hàng:
    - Kiểm tra tồn tại trong giỏ hàng.
    - Kiểm tra số lượng tồn kho thực tế.
    - Cập nhật số lượng và trả về giỏ hàng mới.
    """
    # 1. Tìm item trong giỏ
    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == product_id,
        )
        .first()
    )
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sản phẩm ID {product_id} chưa có trong giỏ hàng của bạn.",
        )

    # 2. Kiểm tra tồn kho
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product or not product.is_active:
        db.delete(cart_item)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sản phẩm này đã ngừng kinh doanh và đã được gỡ khỏi giỏ hàng.",
        )

    if product.stock_quantity < item_update.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Số lượng yêu cầu ({item_update.quantity}) vượt quá tồn kho hiện có ({product.stock_quantity}).",
        )

    # 3. Cập nhật
    cart_item.quantity = item_update.quantity
    db.commit()

    return _calculate_user_cart(db, current_user.id)


@router.delete(
    "/items/{product_id}",
    response_model=CartResponse,
    summary="Xóa một sản phẩm khỏi giỏ hàng",
)
def remove_cart_item(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Xóa hẳn một sản phẩm ra khỏi giỏ hàng của khách hàng.
    """
    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == product_id,
        )
        .first()
    )
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sản phẩm ID {product_id} không có trong giỏ hàng.",
        )

    db.delete(cart_item)
    db.commit()

    return _calculate_user_cart(db, current_user.id)


@router.delete(
    "",
    response_model=CartResponse,
    summary="Xóa toàn bộ giỏ hàng (Clear Cart)",
)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Xóa sạch mọi sản phẩm trong giỏ hàng của người dùng hiện tại.
    """
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()

    return CartResponse(
        total_items=0,
        total_quantity=0,
        total_amount=0.0,
        items=[],
    )

