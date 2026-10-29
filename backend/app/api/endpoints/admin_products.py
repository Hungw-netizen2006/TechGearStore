import math
import re
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, get_current_admin
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.order_item import OrderItem
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductPaginationResponse,
)
from app.schemas.admin import ProductStockUpdate

router = APIRouter()


def _slugify(text: str) -> str:
    """Tự động chuyển tên sản phẩm thành slug URL không dấu"""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Thêm mới sản phẩm phụ kiện công nghệ",
)
def create_product(
    product_in: ProductCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Thêm mới sản phẩm phụ kiện:
    - Kiểm tra danh mục `category_id` hợp lệ.
    - Tự động sinh `slug` nếu chưa có.
    - Kiểm tra `slug` không bị trùng lặp.
    - Lưu trữ đầy đủ thông số kỹ thuật (DPI, switch, kết nối, pin...).
    """
    # 1. Kiểm tra danh mục
    category = db.query(Category).filter(Category.id == product_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Danh mục với ID {product_in.category_id} không tồn tại trong hệ thống.",
        )

    # 2. Xử lý slug
    slug = product_in.slug.strip() if product_in.slug else _slugify(product_in.name)
    existing_slug = db.query(Product).filter(Product.slug == slug).first()
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Đường dẫn (slug) '{slug}' đã tồn tại. Vui lòng chọn slug khác hoặc đổi tên sản phẩm.",
        )

    # 3. Tạo sản phẩm
    product_data = product_in.model_dump()
    product_data["slug"] = slug

    product = Product(**product_data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get(
    "",
    response_model=ProductPaginationResponse,
    summary="[Admin] Lấy danh sách toàn bộ sản phẩm quản trị (kèm lọc tồn kho & trạng thái)",
)
def get_admin_products(
    page: int = Query(1, ge=1, description="Số trang hiển thị"),
    page_size: int = Query(10, ge=1, le=100, description="Số sản phẩm mỗi trang"),
    brand: Optional[str] = Query(None, description="Lọc theo hãng: Logitech, Razer, Akko..."),
    category_id: Optional[int] = Query(None, description="Lọc theo ID danh mục"),
    is_active: Optional[bool] = Query(None, description="Lọc theo trạng thái kinh doanh (True/False)"),
    stock_status: Optional[str] = Query(
        None,
        description="Lọc theo tình trạng tồn kho: 'out_of_stock' (hết hàng = 0), 'low_stock' (sắp hết <= 5), 'in_stock' (còn hàng > 0)",
    ),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên, hãng hoặc slug"),
    sort_by: Optional[str] = Query(
        "newest",
        description="Sắp xếp: newest, stock_asc, stock_desc, price_asc, price_desc",
    ),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Truy vấn danh sách sản phẩm dành riêng cho quản trị viên:
    - Xem được cả sản phẩm đang mở bán và sản phẩm đã ẩn/ngừng kinh doanh.
    - Lọc nhanh các sản phẩm hết hàng hoặc sắp hết hàng để kịp nhập kho.
    """
    query = db.query(Product)

    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    if brand and brand.strip():
        query = query.filter(Product.brand.ilike(f"%{brand.strip()}%"))

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    # Lọc tình trạng tồn kho
    if stock_status == "out_of_stock":
        query = query.filter(Product.stock_quantity == 0)
    elif stock_status == "low_stock":
        query = query.filter(Product.stock_quantity > 0, Product.stock_quantity <= 5)
    elif stock_status == "in_stock":
        query = query.filter(Product.stock_quantity > 0)

    # Tìm kiếm
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.brand.ilike(term),
                Product.slug.ilike(term),
            )
        )

    # Sắp xếp
    if sort_by == "stock_asc":
        query = query.order_by(Product.stock_quantity.asc())
    elif sort_by == "stock_desc":
        query = query.order_by(Product.stock_quantity.desc())
    elif sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.id.desc())

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return ProductPaginationResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1 and page <= total_pages + 1,
        items=items,
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="[Admin] Xem chi tiết một sản phẩm",
)
def get_admin_product_detail(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sản phẩm với ID {product_id} không tồn tại.",
        )
    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="[Admin] Cập nhật thông tin chi tiết sản phẩm",
)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Sửa đổi thông tin sản phẩm phụ kiện:
    - Cập nhật giá, số lượng tồn kho, mô tả, thông số kỹ thuật `specs`, hình ảnh.
    - Kiểm tra `slug` và `category_id` nếu có thay đổi.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm ID {product_id} để cập nhật.",
        )

    update_data = product_update.model_dump(exclude_unset=True)

    # Kiểm tra category nếu có cập nhật
    if "category_id" in update_data and update_data["category_id"] is not None:
        category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Danh mục ID {update_data['category_id']} không tồn tại.",
            )

    # Kiểm tra trùng lặp slug nếu có cập nhật
    if "slug" in update_data and update_data["slug"]:
        new_slug = update_data["slug"].strip()
        existing = (
            db.query(Product)
            .filter(Product.slug == new_slug, Product.id != product_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Đường dẫn (slug) '{new_slug}' đã thuộc về một sản phẩm khác.",
            )
        update_data["slug"] = new_slug

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.patch(
    "/{product_id}/stock",
    response_model=ProductResponse,
    summary="[Admin] Cập nhật nhanh số lượng tồn kho hoặc trạng thái còn/hết hàng",
)
def update_product_stock(
    product_id: int,
    stock_in: ProductStockUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Cập nhật nhanh tồn kho hoặc trạng thái kinh doanh:
    - Ví dụ: Đặt `stock_quantity = 0` hoặc chuyển `is_active = False` khi hết hàng.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sản phẩm ID {product_id} không tồn tại.",
        )

    if stock_in.stock_quantity is not None:
        product.stock_quantity = stock_in.stock_quantity

    if stock_in.is_active is not None:
        product.is_active = stock_in.is_active

    db.commit()
    db.refresh(product)
    return product


@router.delete(
    "/{product_id}",
    summary="[Admin] Xóa sản phẩm phụ kiện (Tự động chuyển Soft-delete nếu đã có đơn hàng)",
)
def delete_product(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Xóa sản phẩm:
    - Nếu sản phẩm đã từng được đặt mua trong các đơn hàng trước đó:
      Hệ thống chuyển sang trạng thái Ẩn/Ngừng kinh doanh (`is_active = False`)
      nhằm đảm bảo toàn vẹn dữ liệu kế toán và lịch sử mua sắm của khách.
    - Nếu sản phẩm chưa từng có đơn hàng nào: Xóa hoàn toàn khỏi cơ sở dữ liệu.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sản phẩm ID {product_id} không tồn tại để xóa.",
        )

    # Kiểm tra xem sản phẩm đã có đơn hàng liên kết chưa
    has_orders = db.query(OrderItem).filter(OrderItem.product_id == product_id).first()

    if has_orders:
        product.is_active = False
        product.stock_quantity = 0
        db.commit()
        return {
            "success": True,
            "message": f"Sản phẩm '{product.name}' (ID: {product_id}) đã có trong các đơn hàng trước đây nên đã được chuyển an toàn sang trạng thái 'Ngừng kinh doanh' (Soft Delete).",
            "is_active": False,
        }
    else:
        db.delete(product)
        db.commit()
        return {
            "success": True,
            "message": f"Sản phẩm '{product.name}' (ID: {product_id}) đã được xóa hoàn toàn khỏi hệ thống.",
        }

