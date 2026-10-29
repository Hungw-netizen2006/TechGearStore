import sys
import uuid
from pathlib import Path

# Thêm thư mục backend vào sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("BAT DAU KIEM THU TOAN DIEN BACKEND APIS PHIA KHACH HANG")
    print("=" * 60)

    # ---------------------------------------------------------
    # 1. KIEM THU API XAC THUC (AUTH)
    # ---------------------------------------------------------
    print("\n[1] KIEM THU API XAC THUC:")
    
    # Test Register
    test_email = f"gamer_{uuid.uuid4().hex[:6]}@techgear.vn"
    reg_payload = {
        "email": test_email,
        "password": "securepassword123",
        "full_name": "Tran Van Gamer",
        "phone": "0912345678",
        "address": "123 Pham Van Dong, Cau Giay, Hanoi"
    }
    r = client.post("/api/v1/auth/register", json=reg_payload)
    print(f"-> 1.1 Dang ky tai khoan moi: Status {r.status_code}")
    assert r.status_code == 201, f"Failed register: {r.text}"
    user_data = r.json()
    assert user_data["email"] == test_email
    assert user_data["role"] == "customer"
    print("   ✓ Dang ky thanh cong!")

    # Test Register Duplicate Email
    r_dup = client.post("/api/v1/auth/register", json=reg_payload)
    print(f"-> 1.2 Dang ky email trung lap: Status {r_dup.status_code}")
    assert r_dup.status_code == 409, f"Failed duplicate check: {r_dup.text}"
    print(f"   ✓ Xu ly 409 Conflict chuan: {r_dup.json()['detail']}")

    # Test Login Success
    login_payload = {
        "email": test_email,
        "password": "securepassword123"
    }
    r_login = client.post("/api/v1/auth/login", json=login_payload)
    print(f"-> 1.3 Dang nhap thanh cong: Status {r_login.status_code}")
    assert r_login.status_code == 200, f"Failed login: {r_login.text}"
    token_data = r_login.json()
    access_token = token_data["access_token"]
    assert access_token is not None
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    print("   ✓ Nhan access_token JWT thanh cong!")

    # Test Login Wrong Password
    r_wrong = client.post("/api/v1/auth/login", json={"email": test_email, "password": "wrongpassword"})
    print(f"-> 1.4 Dang nhap sai mat khau: Status {r_wrong.status_code}")
    assert r_wrong.status_code == 401, f"Expected 401: {r_wrong.text}"
    print(f"   ✓ Xu ly 401 Unauthorized chuan: {r_wrong.json()['detail']}")

    # Test Get Profile (GET /me)
    r_me = client.get("/api/v1/auth/me", headers=auth_headers)
    print(f"-> 1.5 Lay thong tin ca nhan (GET /me): Status {r_me.status_code}")
    assert r_me.status_code == 200
    assert r_me.json()["email"] == test_email
    print(f"   ✓ Profile: {r_me.json()['full_name']} | SĐT: {r_me.json()['phone']}")

    # ---------------------------------------------------------
    # 2. KIEM THU API SAN PHAM (PRODUCTS)
    # ---------------------------------------------------------
    print("\n[2] KIEM THU API SAN PHAM:")

    # 2.1 Phân trang
    r_prod = client.get("/api/v1/products?page=1&page_size=2")
    print(f"-> 2.1 Phan trang (page=1, page_size=2): Status {r_prod.status_code}")
    assert r_prod.status_code == 200
    p_data = r_prod.json()
    assert len(p_data["items"]) == 2
    assert p_data["total"] >= 6
    print(f"   ✓ Tong so san pham: {p_data['total']} | So trang: {p_data['total_pages']} | Has next: {p_data['has_next']}")

    # 2.2 Lọc theo hãng Akko
    r_akko = client.get("/api/v1/products?brand=Akko")
    print(f"-> 2.2 Loc theo hang Akko: Status {r_akko.status_code}")
    assert r_akko.status_code == 200
    akko_items = r_akko.json()["items"]
    assert len(akko_items) > 0
    assert any("Akko" in p["brand"] for p in akko_items)
    print(f"   ✓ Tim thay san pham hang Akko: {akko_items[0]['name']}")

    # 2.3 Lọc theo hãng Logitech
    r_logi = client.get("/api/v1/products?brand=Logitech")
    assert r_logi.status_code == 200
    logi_items = r_logi.json()["items"]
    assert any("Logitech" in p["brand"] for p in logi_items)
    print(f"   ✓ Tim thay san pham hang Logitech: {logi_items[0]['name']}")

    # 2.4 Lọc theo khoảng giá (min_price=2000000 & max_price=4000000)
    r_price = client.get("/api/v1/products?min_price=2000000&max_price=4000000")
    print(f"-> 2.3 Loc theo khoang gia (2tr - 4tr VND): Status {r_price.status_code}")
    assert r_price.status_code == 200
    for p in r_price.json()["items"]:
        assert 2000000 <= p["price"] <= 4000000
    print(f"   ✓ Co {r_price.json()['total']} san pham trong tam gia 2-4 trieu")

    # 2.5 Kiểm tra ngoại lệ khoảng giá không hợp lệ
    r_invalid_price = client.get("/api/v1/products?min_price=5000000&max_price=2000000")
    print(f"-> 2.4 Ngoai le khoang gia min > max: Status {r_invalid_price.status_code}")
    assert r_invalid_price.status_code == 400
    print(f"   ✓ Xu ly 400 Bad Request chuan: {r_invalid_price.json()['detail']}")

    # 2.6 Tìm kiếm từ khóa (search=OLED)
    r_search = client.get("/api/v1/products?search=OLED")
    print(f"-> 2.5 Tim kiem tu khoa 'OLED': Status {r_search.status_code}")
    assert r_search.status_code == 200
    assert r_search.json()["total"] >= 1
    print(f"   ✓ Ket qua tim kiem: {r_search.json()['items'][0]['name']}")

    # 2.7 Lấy chi tiết sản phẩm kèm thông số kỹ thuật (GET /{id})
    product_id = p_data["items"][0]["id"]
    r_detail = client.get(f"/api/v1/products/{product_id}")
    print(f"-> 2.6 Chi tiet san pham ID {product_id}: Status {r_detail.status_code}")
    assert r_detail.status_code == 200
    p_detail = r_detail.json()
    assert "specs" in p_detail
    assert p_detail["specs"] is not None
    print(f"   ✓ San pham: {p_detail['name']}")
    print(f"   ✓ Thong so ky thuat (specs): {list(p_detail['specs'].keys())[:4]}...")

    # 2.8 Ngoại lệ 404 khi sản phẩm không tồn tại
    r_notfound = client.get("/api/v1/products/999999")
    print(f"-> 2.7 San pham khong ton tai (ID 999999): Status {r_notfound.status_code}")
    assert r_notfound.status_code == 404
    print(f"   ✓ Xu ly 404 Not Found chuan: {r_notfound.json()['detail']}")

    # ---------------------------------------------------------
    # 3. KIEM THU API GIO HANG (CART)
    # ---------------------------------------------------------
    print("\n[3] KIEM THU API GIO HANG:")

    # 3.1 Xem giỏ hàng ban đầu (đang rỗng)
    r_cart_init = client.get("/api/v1/cart", headers=auth_headers)
    assert r_cart_init.status_code == 200
    print(f"-> 3.1 Gio hang ban dau: {r_cart_init.json()['total_items']} san pham | Tong tien: {r_cart_init.json()['total_amount']:,.0f} VND")

    # 3.2 Thêm sản phẩm 1 vào giỏ
    prod_1 = p_data["items"][0]
    prod_2 = p_data["items"][1]

    r_add1 = client.post("/api/v1/cart/items", json={"product_id": prod_1["id"], "quantity": 1}, headers=auth_headers)
    print(f"-> 3.2 Them san pham ID {prod_1['id']} ({prod_1['name']}) vao gio: Status {r_add1.status_code}")
    assert r_add1.status_code == 200
    cart_after1 = r_add1.json()
    assert cart_after1["total_items"] == 1
    assert cart_after1["total_amount"] == prod_1["price"]
    print(f"   ✓ Gio hang sau khi them: {cart_after1['total_items']} mon | Tong tien tinh tu dong: {cart_after1['total_amount']:,.0f} VND")

    # 3.3 Thêm sản phẩm 2 vào giỏ
    r_add2 = client.post("/api/v1/cart/items", json={"product_id": prod_2["id"], "quantity": 2}, headers=auth_headers)
    assert r_add2.status_code == 200
    cart_after2 = r_add2.json()
    assert cart_after2["total_items"] == 2
    assert cart_after2["total_quantity"] == 3
    expected_total = prod_1["price"] * 1 + prod_2["price"] * 2
    assert cart_after2["total_amount"] == expected_total
    print(f"   ✓ Them mon thu 2 ID {prod_2['id']}: Tong {cart_after2['total_quantity']} chiec | Tong tien tu dong: {cart_after2['total_amount']:,.0f} VND")

    # 3.4 Cập nhật số lượng sản phẩm trong giỏ (PUT /cart/items/{product_id})
    r_update_cart = client.put(f"/api/v1/cart/items/{prod_1['id']}", json={"quantity": 3}, headers=auth_headers)
    print(f"-> 3.3 Cap nhat so luong san pham ID {prod_1['id']} thanh 3: Status {r_update_cart.status_code}")
    assert r_update_cart.status_code == 200
    cart_updated = r_update_cart.json()
    new_expected_total = prod_1["price"] * 3 + prod_2["price"] * 2
    assert cart_updated["total_amount"] == new_expected_total
    print(f"   ✓ Tong tien moi cap nhat tu dong: {cart_updated['total_amount']:,.0f} VND")

    # 3.5 Kiểm tra ngoại lệ thêm số lượng vượt quá tồn kho (Stock = 22, yêu cầu 50)
    r_over = client.post("/api/v1/cart/items", json={"product_id": prod_1["id"], "quantity": 50}, headers=auth_headers)
    print(f"-> 3.4 Ngoai le them vuot qua ton kho: Status {r_over.status_code}")
    assert r_over.status_code == 400
    print(f"   ✓ Xu ly 400 Bad Request chuan: {r_over.json()['detail']}")

    # 3.6 Kiểm tra validation schema vượt quá giới hạn 100 chiếc (Pydantic 422)
    r_schema_invalid = client.post("/api/v1/cart/items", json={"product_id": prod_1["id"], "quantity": 9999}, headers=auth_headers)
    assert r_schema_invalid.status_code == 422
    print(f"   ✓ Xu ly 422 Unprocessable Entity chuan: Gioi han dat mua le=100")

    # ---------------------------------------------------------
    # 4. KIEM THU API DON HANG (ORDERS)
    # ---------------------------------------------------------
    print("\n[4] KIEM THU API DON HANG:")

    # 4.1 Tạo đơn hàng từ giỏ hàng hiện tại (from_cart=True)
    order_payload = {
        "customer_name": "Tran Van Gamer",
        "shipping_phone": "0912345678",
        "shipping_address": "123 Pham Van Dong, Cau Giay, Hanoi",
        "payment_method": "COD",
        "note": "Goi hang can than giup minh nhe!",
        "from_cart": True
    }
    r_create_order = client.post("/api/v1/orders", json=order_payload, headers=auth_headers)
    print(f"-> 4.1 Tao don hang moi tu gio hang: Status {r_create_order.status_code}")
    assert r_create_order.status_code == 201, f"Failed create order: {r_create_order.text}"
    created_order = r_create_order.json()
    order_code = created_order["order_code"]
    assert order_code.startswith("TG-")
    assert created_order["total_amount"] == new_expected_total
    assert created_order["order_status"] == "pending"
    assert len(created_order["items"]) == 2
    print(f"   ✓ Ma don hang sinh tu dong: {order_code}")
    print(f"   ✓ Tong tien don hang: {created_order['total_amount']:,.0f} VND | Trang thai: {created_order['order_status']}")

    # 4.2 Kiểm tra giỏ hàng sau khi đặt thành công -> Đã được làm sạch tự động
    r_cart_after_order = client.get("/api/v1/cart", headers=auth_headers)
    assert r_cart_after_order.json()["total_items"] == 0
    assert r_cart_after_order.json()["total_amount"] == 0.0
    print("   ✓ Gio hang da duoc lam sach tu dong sau khi tao don!")

    # 4.3 Xem lịch sử đơn hàng cá nhân (GET /api/v1/orders/my-orders)
    r_my_orders = client.get("/api/v1/orders/my-orders", headers=auth_headers)
    print(f"-> 4.2 Xem lich su don hang ca nhan: Status {r_my_orders.status_code}")
    assert r_my_orders.status_code == 200
    my_orders_data = r_my_orders.json()
    assert my_orders_data["total"] >= 1
    assert my_orders_data["items"][0]["order_code"] == order_code
    print(f"   ✓ Tim thay {my_orders_data['total']} don hang trong lich su ca nhan")

    # 4.4 Xem chi tiết đơn hàng (GET /api/v1/orders/{order_code})
    r_order_detail = client.get(f"/api/v1/orders/{order_code}", headers=auth_headers)
    print(f"-> 4.3 Xem chi tiet don hang '{order_code}': Status {r_order_detail.status_code}")
    assert r_order_detail.status_code == 200
    assert r_order_detail.json()["customer_name"] == "Tran Van Gamer"
    print(f"   ✓ Nguoi nhan: {r_order_detail.json()['customer_name']} | Dia chi: {r_order_detail.json()['shipping_address']}")

    # 4.5 Hủy đơn hàng cá nhân khi đang pending (PUT /api/v1/orders/{order_code}/cancel)
    r_cancel = client.put(f"/api/v1/orders/{order_code}/cancel", headers=auth_headers)
    print(f"-> 4.4 Huy don hang ca nhan (khi pending): Status {r_cancel.status_code}")
    assert r_cancel.status_code == 200
    assert r_cancel.json()["order_status"] == "cancelled"
    print(f"   ✓ Don hang da chuyen sang trang thai: {r_cancel.json()['order_status']} (Da hoan kho thanh cong)")

    # 4.6 Thử hủy lại đơn hàng đã bị hủy -> Kiểm tra xử lý ngoại lệ
    r_cancel_again = client.put(f"/api/v1/orders/{order_code}/cancel", headers=auth_headers)
    print(f"-> 4.5 Ngoai le huy don hang da huy: Status {r_cancel_again.status_code}")
    assert r_cancel_again.status_code == 400
    print(f"   ✓ Xu ly 400 Bad Request chuan: {r_cancel_again.json()['detail']}")

    print("\n" + "=" * 60)
    print("TAT CA CAC TESTS DA VUOT QUA 100% THANH CONG!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
