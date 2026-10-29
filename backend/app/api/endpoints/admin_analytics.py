from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.api.deps import get_db, get_current_admin
from app.models.user import User
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.admin import (
    DashboardStatsResponse,
    RevenueChartItem,
    TopSellingProduct,
)
from app.schemas.order import OrderResponse

router = APIRouter()


@router.get(
    "/overview",
    response_model=DashboardStatsResponse,
    summary="[Admin] Lấy toàn bộ số liệu thống kê tổng quan hệ thống (Doanh thu, Đơn hàng, Khách hàng, Biểu đồ)",
)
def get_dashboard_overview(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Cung cấp số liệu thống kê toàn diện cho Admin Dashboard:
    - **Doanh thu**: Tổng doanh thu tích lũy, Doanh thu trong ngày.
    - **Đơn hàng**: Tổng số đơn và số lượng theo từng trạng thái (Đang đóng gói, Đang giao, Đã hoàn thành, v.v.).
    - **Khách hàng**: Tổng số tài khoản khách hàng đã đăng ký.
    - **Kho hàng**: Tổng số sản phẩm, số lượng sắp hết và đã hết hàng.
    - **Biểu đồ 7 ngày gần nhất**: Phục vụ vẽ chart doanh thu & lượng đơn mỗi ngày.
    - **Top 5 sản phẩm bán chạy nhất**: Theo số lượng và doanh thu mang lại.
    - **5 đơn hàng mới nhất**.
    """
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    # 1. Thống kê Doanh thu
    # Doanh thu tính trên tất cả đơn hàng không bị hủy
    total_revenue_result = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
        .filter(Order.order_status != "cancelled")
        .scalar()
    )
    total_revenue = float(total_revenue_result or 0.0)

    # Doanh thu hôm nay
    today_revenue_result = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
        .filter(Order.created_at >= today_start, Order.order_status != "cancelled")
        .scalar()
    )
    today_revenue = float(today_revenue_result or 0.0)

    # 2. Thống kê Đơn hàng theo trạng thái
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.order_status == "pending").count()
    processing_orders = db.query(Order).filter(Order.order_status == "processing").count()
    shipping_orders = db.query(Order).filter(Order.order_status == "shipping").count()
    delivered_orders = db.query(Order).filter(Order.order_status == "delivered").count()
    cancelled_orders = db.query(Order).filter(Order.order_status == "cancelled").count()

    # 3. Thống kê Khách hàng
    total_customers = db.query(User).filter(User.role == "customer").count()

    # 4. Thống kê Kho hàng
    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.is_active == True).count()
    low_stock_products_count = (
        db.query(Product)
        .filter(Product.stock_quantity > 0, Product.stock_quantity <= 5, Product.is_active == True)
        .count()
    )
    out_of_stock_products_count = (
        db.query(Product)
        .filter(Product.stock_quantity == 0, Product.is_active == True)
        .count()
    )

    # 5. Biểu đồ doanh thu 7 ngày gần nhất (từ 6 ngày trước đến hôm nay)
    revenue_chart_7days: List[RevenueChartItem] = []
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime(day_date.year, day_date.month, day_date.day, 0, 0, 0, tzinfo=timezone.utc)
        day_end = datetime(day_date.year, day_date.month, day_date.day, 23, 59, 59, tzinfo=timezone.utc)

        day_orders = (
            db.query(Order)
            .filter(
                Order.created_at >= day_start,
                Order.created_at <= day_end,
                Order.order_status != "cancelled",
            )
            .all()
        )

        day_rev = sum(o.total_amount for o in day_orders)
        revenue_chart_7days.append(
            RevenueChartItem(
                date=day_date.strftime("%Y-%m-%d"),
                revenue=float(day_rev),
                orders_count=len(day_orders),
            )
        )

    # 6. Top 5 sản phẩm bán chạy nhất
    top_selling_raw = (
        db.query(
            OrderItem.product_id,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.total_price).label("total_revenue"),
        )
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.order_status != "cancelled")
        .group_by(OrderItem.product_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    top_selling_products: List[TopSellingProduct] = []
    for item in top_selling_raw:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if prod:
            top_selling_products.append(
                TopSellingProduct(
                    product_id=prod.id,
                    name=prod.name,
                    brand=prod.brand,
                    image_url=prod.image_url,
                    price=float(prod.price),
                    total_sold=int(item.total_sold),
                    total_revenue=float(item.total_revenue),
                )
            )

    # 7. 5 đơn hàng mới nhất
    recent_orders_raw = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.id.desc())
        .limit(5)
        .all()
    )
    recent_orders = [OrderResponse.model_validate(o) for o in recent_orders_raw]

    return DashboardStatsResponse(
        total_revenue=total_revenue,
        today_revenue=today_revenue,
        total_orders=total_orders,
        pending_orders=pending_orders,
        processing_orders=processing_orders,
        shipping_orders=shipping_orders,
        delivered_orders=delivered_orders,
        cancelled_orders=cancelled_orders,
        total_customers=total_customers,
        total_products=total_products,
        active_products=active_products,
        low_stock_products_count=low_stock_products_count,
        out_of_stock_products_count=out_of_stock_products_count,
        revenue_chart_7days=revenue_chart_7days,
        top_selling_products=top_selling_products,
        recent_orders=recent_orders,
    )

