import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import (
    ProductResponse,
    ProductPaginationResponse,
    ProductCreate,
)

router = APIRouter()


@router.get(
    "",
    response_model=ProductPaginationResponse,
    summary="Lấy danh sách sản phẩm (Hỗ trợ phân trang, lọc theo hãng, khoảng giá, từ khóa tìm kiếm)",
)
def get_products(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Số trang hiển thị (bắt đầu từ 1)"),
    page_size: int = Query(10, ge=1, le=100, description="Số sản phẩm mỗi trang (tối đa 100)"),
    brand: Optional[str] = Query(None, description="Lọc theo hãng: Logitech, Razer, Akko, ASUS ROG, IETS..."),
    min_price: Optional[float] = Query(None, ge=0, description="Khoảng giá tối thiểu (VND)"),
    max_price: Optional[float] = Query(None, ge=0, description="Khoảng giá tối đa (VND)"),
    search: Optional[str] = Query(None, description="Tìm kiếm từ khóa theo tên, thương hiệu hoặc mô tả"),
    category_slug: Optional[str] = Query(None, description="Lọc theo slug danh mục phụ kiện"),
    category_id: Optional[int] = Query(None, description="Lọc theo ID danh mục phụ kiện"),
    is_featured: Optional[bool] = Query(None, description="Lọc riêng sản phẩm nổi bật"),
    sort_by: Optional[str] = Query(
        "newest",
        description="Sắp xếp kết quả: newest (mới nhất), price_asc (giá tăng dần), price_desc (giá giảm dần), rating (đánh giá cao), name_asc (tên A-Z)",
    ),
):
    """
    Truy vấn danh sách sản phẩm phong phú với đầy đủ tiêu chí lọc và phân trang:
    - **brand**: lọc hãng sản xuất (không phân biệt chữ hoa, chữ thường)
    - **min_price** & **max_price**: lọc theo tầm giá mong muốn
    - **search**: tìm kiếm từ khóa linh hoạt
    - **category_slug** / **category_id**: phân loại sản phẩm
    - **sort_by**: sắp xếp theo giá cả hoặc độ mới
    """
    # 1. Kiểm tra logic khoảng giá
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Khoảng giá không hợp lệ: Giá tối thiểu ({min_price:,.0f} VND) không được lớn hơn giá tối đa ({max_price:,.0f} VND).",
        )

    # 2. Xây dựng Query cơ sở (chỉ lấy sản phẩm đang hoạt động)
    query = db.query(Product).filter(Product.is_active == True)

    # 3. Lọc theo hãng sản xuất (Logitech, Razer, Akko...)
    if brand and brand.strip():
        query = query.filter(Product.brand.ilike(f"%{brand.strip()}%"))

    # 4. Lọc theo khoảng giá
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # 5. Lọc theo danh mục
    if category_slug and category_slug.strip():
        category = db.query(Category).filter(Category.slug == category_slug.strip()).first()
        if category:
            query = query.filter(Product.category_id == category.id)
        else:
            # Danh mục không tồn tại -> trả về rỗng ngay
            return ProductPaginationResponse(
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
                has_next=False,
                has_prev=False,
                items=[],
            )

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    # 6. Tìm kiếm từ khóa (tên, hãng, mô tả)
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.brand.ilike(search_term),
                Product.description.ilike(search_term),
            )
        )

    # 7. Lọc sản phẩm nổi bật
    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)

    # 8. Sắp xếp thứ tự
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(Product.rating.desc(), Product.review_count.desc())
    elif sort_by == "name_asc":
        query = query.order_by(Product.name.asc())
    else:  # 'newest' hoặc mặc định
        query = query.order_by(Product.id.desc())

    # 9. Tính toán phân trang
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
    summary="Lấy thông tin chi tiết một sản phẩm kèm thông số kỹ thuật (theo ID)",
)
def get_product_detail(product_id: int, db: Session = Depends(get_db)):
    """
    Lấy toàn bộ thông tin chi tiết của sản phẩm theo Product ID:
    - Thông tin cơ bản: Tên, Hãng, Giá, Tồn kho.
    - Thông số kỹ thuật chi tiết (`specs`): DPI, loại switch, cảm biến, tần số phản hồi, thời lượng pin...
    - Danh mục và ảnh bổ sung.
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm với ID {product_id} hoặc sản phẩm đã ngừng kinh doanh.",
        )
    return product


@router.get(
    "/slug/{slug}",
    response_model=ProductResponse,
    summary="Lấy chi tiết sản phẩm theo đường dẫn thân thiện (slug)",
)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Lấy thông tin sản phẩm bằng slug (ví dụ: 'logitech-g-pro-x-superlight-2-lightspeed').
    """
    product = (
        db.query(Product)
        .filter(Product.slug == slug.strip(), Product.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm với đường dẫn '{slug}'.",
        )
    return product
