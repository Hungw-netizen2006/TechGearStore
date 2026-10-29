import sys
from pathlib import Path

# Thêm thư mục backend vào sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def run_admin_tests():
    print("=" * 65)
    print("BAT DAU KIEM THU TOAN DIEN PHAN HE QUAN TRI (ADMIN DASHBOARD)")
    print("=" * 65)

    # ---------------------------------------------------------
    # 0. KIEM TRA XAC THUC & PHAN QUYEN (RBAC)
    # ---------------------------------------------------------
    print("\n[0] KIEM TRA PHAN QUYEN QUAN TRI VIEN (RBAC):")

    # 0.1 Truy cập không có token
    r_no_auth = client.get("/api/v1/admin/analytics/overview")
    print(f"-> 0.1 Truy cap khong co Token: Status {r_no_auth.status_code}")
    assert r_no_auth.status_code == 401
    print(f"   ✓ Xu ly 401 Unauthorized chuan: {r_no_auth.json()['detail']}")

    # 0.2 Truy cập với token của Khách hàng thông thường (Customer)
    r_cust_login = client.post(
        "/api/v1/auth/login",
        json={"email": "hung.nv@techgear.vn", "password": "user123456"},
    )
    assert r_cust_login.status_code == 200
    cust_token = r_cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    r_cust_forbidden = client.get("/api/v1/admin/analytics/overview", headers=cust_headers)
    print(f"-> 0.2 Khach hang thu truy cap vao Admin API: Status {r_cust_forbidden.status_code}")
    assert r_cust_forbidden.status_code == 403
    print(f"   ✓ Xu ly 403 Forbidden chuan: {r_cust_forbidden.json()['detail']}")

    # 0.3 Đăng nhập với tài khoản Quản trị viên (Admin)
    r_admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@techgear.vn", "password": "admin123456"},
    )
    print(f"-> 0.3 Dang nhap tai khoan Admin (admin@techgear.vn): Status {r_admin_login.status_code}")
    assert r_admin_login.status_code == 200
    admin_token = r_admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("   ✓ Nhan Admin JWT Token thanh cong!")

    # ---------------------------------------------------------
    # 1. KIEM THU API QUAN LY SAN PHAM (CRUD)
    # ---------------------------------------------------------
    print("\n[1] KIEM THU API QUAN LY SAN PHAM (CRUD):")

    # 1.1 Thêm mới sản phẩm phụ kiện (Create Product)
    new_product_payload = {
        "name": "Tai nghe Gaming SteelSeries Arctis Nova Pro Wireless",
        "slug": "tai-nghe-steelseries-arctis-nova-pro-wireless",
        "brand": "SteelSeries",
        "category_id": 3,  # Tai nghe Gaming
        "price": 8490000,
        "original_price": 9290000,
        "stock_quantity": 10,
        "description": "Tai nghe không dây đa nền tảng với hệ thống pin kép vô hạn và khử ồn chủ động ANC 4 micro.",
        "specs": {
            "Driver": "Neodymium 40mm Hi-Res Audio",
            "Chống ồn": "Active Noise Cancellation (ANC) 4 mic",
            "Hệ thống pin": "Infinity Power System (2 viên pin sạc luân phiên)",
            "Kết nối": "Dual Wireless 2.4GHz + Bluetooth 5.0",
            "DAC": "GameDAC Gen 2 màn hình OLED",
        },
        "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
        "gallery_images": [
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800"
        ],
        "is_featured": True,
        "is_active": True,
    }

    r_create = client.post("/api/v1/admin/products", json=new_product_payload, headers=admin_headers)
    print(f"-> 1.1 Them moi san pham: Status {r_create.status_code}")
    assert r_create.status_code == 201, f"Failed: {r_create.text}"
    created_prod = r_create.json()
    new_prod_id = created_prod["id"]
    print(f"   ✓ Da them san pham moi ID {new_prod_id}: {created_prod['name']}")
    print(f"   ✓ Hang: {created_prod['brand']} | Gia: {created_prod['price']:,.0f} VND | Ton kho: {created_prod['stock_quantity']}")

    # 1.2 Thử thêm sản phẩm trùng slug -> Kiểm tra ngoại lệ
    r_create_dup = client.post("/api/v1/admin/products", json=new_product_payload, headers=admin_headers)
    print(f"-> 1.2 Ngoai le trung lap slug: Status {r_create_dup.status_code}")
    assert r_create_dup.status_code == 400
    print(f"   ✓ Xu ly 400 Bad Request chuan: {r_create_dup.json()['detail']}")

    # 1.3 Lấy danh sách sản phẩm quản trị (kèm lọc tồn kho & tìm kiếm)
    r_list = client.get("/api/v1/admin/products?brand=SteelSeries", headers=admin_headers)
    print(f"-> 1.3 Tim kiem san pham theo hang: Status {r_list.status_code}")
    assert r_list.status_code == 200
    assert r_list.json()["total"] >= 1
    print(f"   ✓ Tim thay {r_list.json()['total']} san pham hang SteelSeries")

    # 1.4 Xem chi tiết sản phẩm
    r_get = client.get(f"/api/v1/admin/products/{new_prod_id}", headers=admin_headers)
    assert r_get.status_code == 200
    print(f"   ✓ Lay chi tiet san pham ID {new_prod_id} thanh cong!")

    # 1.5 Sửa thông tin sản phẩm (Update Product)
    update_payload = {
        "price": 7990000,
        "description": "Giá khuyến mãi mùa hè 2026 cho tai nghe esports SteelSeries.",
        "is_featured": True,
    }
    r_update = client.put(f"/api/v1/admin/products/{new_prod_id}", json=update_payload, headers=admin_headers)
    print(f"-> 1.4 Cap nhat thong tin san pham: Status {r_update.status_code}")
    assert r_update.status_code == 200
    updated_prod = r_update.json()
    assert updated_prod["price"] == 7990000
    print(f"   ✓ Gia moi da duoc cap nhat thanh cong: {updated_prod['price']:,.0f} VND")

    # 1.6 Cập nhật trạng thái còn/hết hàng hoặc tồn kho nhanh (PATCH stock)
    stock_payload = {"stock_quantity": 0, "is_active": True}
    r_stock = client.patch(f"/api/v1/admin/products/{new_prod_id}/stock", json=stock_payload, headers=admin_headers)
    print(f"-> 1.5 Cap nhat nhanh ton kho sang het hang (stock=0): Status {r_stock.status_code}")
    assert r_stock.status_code == 200
    assert r_stock.json()["stock_quantity"] == 0
    print("   ✓ Da cap nhat nhanh trang thai ton kho thanh cong!")

    # 1.7 Xóa sản phẩm (Delete Product)
    # Vì sản phẩm mới này chưa có đơn hàng liên kết -> Xóa hoàn toàn (Hard delete)
    r_delete = client.delete(f"/api/v1/admin/products/{new_prod_id}", headers=admin_headers)
    print(f"-> 1.6 Xoa san pham chua co don hang: Status {r_delete.status_code}")
    assert r_delete.status_code == 200
    print(f"   ✓ {r_delete.json()['message']}")

    # Kiểm tra sản phẩm đã bị xóa
    r_check_deleted = client.get(f"/api/v1/admin/products/{new_prod_id}", headers=admin_headers)
    assert r_check_deleted.status_code == 404
    print("   ✓ San pham khong con ton tai trong he thong!")

    # 1.8 Kiểm tra Soft-delete với sản phẩm đã có đơn hàng (ID 1 - Logitech)
    r_soft_delete = client.delete("/api/v1/admin/products/1", headers=admin_headers)
    print(f"-> 1.7 Xoa san pham da co don hang (Soft-delete): Status {r_soft_delete.status_code}")
    assert r_soft_delete.status_code == 200
    assert r_soft_delete.json()["is_active"] is False
    print(f"   ✓ {r_soft_delete.json()['message']}")

    # Khôi phục lại is_active = True cho sản phẩm 1 để các phần sau hoạt động bình thường
    client.patch("/api/v1/admin/products/1/stock", json={"is_active": True, "stock_quantity": 25}, headers=admin_headers)

    # ---------------------------------------------------------
    # 2. KIEM THU API QUAN LY DON HANG
    # ---------------------------------------------------------
    print("\n[2] KIEM THU API QUAN LY DON HANG:")

    # 2.1 Xem danh sách toàn bộ đơn hàng của hệ thống
    r_all_orders = client.get("/api/v1/admin/orders", headers=admin_headers)
    print(f"-> 2.1 Lay toan bo don hang he thong: Status {r_all_orders.status_code}")
    assert r_all_orders.status_code == 200
    orders_data = r_all_orders.json()
    assert orders_data["total"] >= 1
    sample_order = orders_data["items"][0]
    sample_code = sample_order["order_code"]
    print(f"   ✓ Tong so don hang trong he thong: {orders_data['total']} | Ma don thu nghiem: {sample_code}")

    # 2.2 Xem chi tiết đơn hàng
    r_order_detail = client.get(f"/api/v1/admin/orders/{sample_code}", headers=admin_headers)
    assert r_order_detail.status_code == 200
    print(f"   ✓ Chi tiet don hang: Khach '{r_order_detail.json()['customer_name']}' | Tong: {r_order_detail.json()['total_amount']:,.0f} VND")

    # 2.3 Cập nhật trạng thái đơn hàng: Đang đóng gói (processing)
    r_status1 = client.patch(
        f"/api/v1/admin/orders/{sample_code}/status",
        json={"order_status": "processing", "admin_note": "Kho da in van don va dong goi san pham"},
        headers=admin_headers,
    )
    print(f"-> 2.2 Cap nhat trang thai sang 'processing' (Dang dong goi): Status {r_status1.status_code}")
    assert r_status1.status_code == 200
    assert r_status1.json()["order_status"] == "processing"
    print(f"   ✓ Trang thai moi: {r_status1.json()['order_status']}")

    # 2.4 Cập nhật trạng thái đơn hàng: Đang giao (shipping)
    r_status2 = client.patch(
        f"/api/v1/admin/orders/{sample_code}/status",
        json={"order_status": "shipping", "admin_note": "Da ban giao cho shipper"},
        headers=admin_headers,
    )
    print(f"-> 2.3 Cap nhat trang thai sang 'shipping' (Dang giao): Status {r_status2.status_code}")
    assert r_status2.status_code == 200
    assert r_status2.json()["order_status"] == "shipping"
    print(f"   ✓ Trang thai moi: {r_status2.json()['order_status']}")

    # 2.5 Cập nhật trạng thái đơn hàng: Đã hoàn thành (delivered)
    # Tự động cập nhật payment_status = paid
    r_status3 = client.patch(
        f"/api/v1/admin/orders/{sample_code}/status",
        json={"order_status": "delivered"},
        headers=admin_headers,
    )
    print(f"-> 2.4 Cap nhat trang thai sang 'delivered' (Da hoan thanh): Status {r_status3.status_code}")
    assert r_status3.status_code == 200
    assert r_status3.json()["order_status"] == "delivered"
    assert r_status3.json()["payment_status"] == "paid"
    print(f"   ✓ Trang thai: {r_status3.json()['order_status']} | Tu dong cap nhat thanh toan: {r_status3.json()['payment_status']}")

    # 2.6 Kiểm tra ngoại lệ trạng thái không hợp lệ
    r_invalid_status = client.patch(
        f"/api/v1/admin/orders/{sample_code}/status",
        json={"order_status": "invalid_status_xyz"},
        headers=admin_headers,
    )
    print(f"-> 2.5 Ngoai le trang thai khong hop le: Status {r_invalid_status.status_code}")
    assert r_invalid_status.status_code == 400
    print(f"   ✓ Xu ly 400 Bad Request chuan: {r_invalid_status.json()['detail']}")

    # ---------------------------------------------------------
    # 3. KIEM THU API THONG KE TONG QUAN (DASHBOARD ANALYTICS)
    # ---------------------------------------------------------
    print("\n[3] KIEM THU API THONG KE TONG QUAN (DASHBOARD ANALYTICS):")

    r_stats = client.get("/api/v1/admin/analytics/overview", headers=admin_headers)
    print(f"-> 3.1 Lay toan bo so lieu thong ke Dashboard: Status {r_stats.status_code}")
    assert r_stats.status_code == 200
    stats = r_stats.json()

    print("\n   📊 CAC CHI SO THONG KE THUC TE:")
    print(f"   • Tong doanh thu he thong: {stats['total_revenue']:,.0f} VND")
    print(f"   • Doanh thu hom nay:       {stats['today_revenue']:,.0f} VND")
    print(f"   • Tong so don hang:        {stats['total_orders']} don")
    print(f"     - Cho xu ly (pending):   {stats['pending_orders']}")
    print(f"     - Dang dong goi:         {stats['processing_orders']}")
    print(f"     - Dang giao:             {stats['shipping_orders']}")
    print(f"     - Da hoan thanh:         {stats['delivered_orders']}")
    print(f"     - Da huy:                {stats['cancelled_orders']}")
    print(f"   • Tong so khach hang:      {stats['total_customers']} tai khoan")
    print(f"   • Tong san pham trong kho: {stats['total_products']} san pham (Dang ban: {stats['active_products']})")
    print(f"   • So san pham sap het hang:{stats['low_stock_products_count']}")

    # Kiểm tra dữ liệu biểu đồ 7 ngày
    assert len(stats["revenue_chart_7days"]) == 7
    print(f"\n   📈 DU LIEU BIEU DO 7 NGAY GAN NHAT: Co {len(stats['revenue_chart_7days'])} diem du lieu")
    for day in stats["revenue_chart_7days"][-3:]:
        print(f"     - Ngay {day['date']}: {day['revenue']:,.0f} VND ({day['orders_count']} don)")

    # Kiểm tra top sản phẩm bán chạy
    print(f"\n   🏆 TOP SAN PHAM BAN CHAY NHAT: {len(stats['top_selling_products'])} san pham")
    for idx, top_p in enumerate(stats["top_selling_products"], 1):
        print(f"     {idx}. {top_p['name']} ({top_p['brand']}) - Da ban: {top_p['total_sold']} | Doanh thu: {top_p['total_revenue']:,.0f} VND")

    # Kiểm tra đơn hàng gần đây
    assert len(stats["recent_orders"]) > 0
    print(f"\n   📦 DON HANG MOI NHAT: {len(stats['recent_orders'])} don gan day")

    print("\n" + "=" * 65)
    print("TAT CA CAC TESTS PHAN HE QUAN TRI DA VUOT QUA 100% THANH CONG!")
    print("=" * 65)


if __name__ == "__main__":
    run_admin_tests()

