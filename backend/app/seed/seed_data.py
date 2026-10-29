import sys
import os
from pathlib import Path

# Add backend directory to sys.path so it can be run standalone
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.db.session import engine, SessionLocal, Base
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.cart import CartItem
from app.core.security import get_password_hash


def init_db():
    print("Initializing SQLite database tables...")
    Base.metadata.create_all(bind=engine)


def seed_data():
    init_db()
    db = SessionLocal()

    try:
        # Kiểm tra xem đã có dữ liệu chưa
        if db.query(Category).first():
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding database with categories, users, products (Logitech, Razer, Akko...) and sample cart/orders...")

        # 1. Seed Users
        admin_user = User(
            email="admin@techgear.vn",
            hashed_password=get_password_hash("admin123456"),
            full_name="TechGear Administrator",
            phone="0901234567",
            address="70 Nguyen Du, Hai Ba Trung, Hanoi",
            role="admin",
            is_active=True,
        )
        customer_user = User(
            email="hung.nv@techgear.vn",
            hashed_password=get_password_hash("user123456"),
            full_name="Nguyen Xuan Hung",
            phone="0988776655",
            address="Khu do thi Nam Tu Liem, Hanoi",
            role="customer",
            is_active=True,
        )
        db.add_all([admin_user, customer_user])
        db.flush()

        # 2. Seed Categories
        cat_mouse = Category(
            name="Chuột Gaming",
            slug="chuot-gaming",
            description="Chuột gaming chuyên nghiệp không dây & có dây, cảm biến quang học đỉnh cao, siêu nhẹ.",
            image_url="https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
        )
        cat_keyboard = Category(
            name="Bàn phím cơ",
            slug="ban-phim-co",
            description="Bàn phím cơ custom, gaming layout 65%, 75%, TKL, fullsize với hotswap và switch cao cấp.",
            image_url="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
        )
        cat_headset = Category(
            name="Tai nghe Gaming",
            slug="tai-nghe-gaming",
            description="Tai nghe âm thanh vòm 7.1, driver titanium, micro khử ồn cho trải nghiệm gaming chân thực.",
            image_url="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
        )
        cat_cooler = Category(
            name="Đế tản nhiệt",
            slug="de-tan-nhiet",
            description="Đế tản nhiệt laptop áp suất cao turbofan, giảm ngay 15-25 độ C cho máy trạm và gaming.",
            image_url="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80",
        )

        db.add_all([cat_mouse, cat_keyboard, cat_headset, cat_cooler])
        db.flush()

        # 3. Seed Real Tech Accessory Products (Logitech, Razer, Akko, ASUS ROG, IETS)
        products = [
            # Sản phẩm 1: Chuột Logitech G Pro X Superlight 2
            Product(
                name="Chuột Gaming Không Dây Logitech G Pro X Superlight 2 Lightspeed",
                slug="logitech-g-pro-x-superlight-2-lightspeed",
                brand="Logitech",
                category_id=cat_mouse.id,
                price=3590000,
                original_price=3890000,
                stock_quantity=25,
                description="Biểu tượng chuột gaming esports thế giới nay được nâng cấp với cảm biến HERO 2 và switch lai LIGHTFORCE.",
                specs={
                    "DPI": "32,000 DPI (Cảm biến HERO 2)",
                    "Switch": "Switch cơ quang học lai LIGHTFORCE Hybrid",
                    "Tần số phản hồi": "2,000 Hz / 0.5 ms",
                    "Gia tốc tối đa": "> 40G",
                    "Tốc độ tối đa (IPS)": "> 500 IPS",
                    "Trọng lượng": "60g siêu nhẹ",
                    "Kết nối": "Không dây LIGHTSPEED 2.4GHz + Cáp USB-C",
                    "Thời lượng pin": "Lên đến 95 giờ sử dụng liên tục",
                },
                image_url="https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
                ],
                rating=4.9,
                review_count=128,
                is_featured=True,
                is_active=True,
            ),
            # Sản phẩm 2: Bàn phím cơ ASUS ROG Azoth 75% OLED
            Product(
                name="Bàn phím cơ không dây ASUS ROG Azoth 75% Custom OLED",
                slug="ban-phim-co-asus-rog-azoth-75-oled",
                brand="ASUS ROG",
                category_id=cat_keyboard.id,
                price=5990000,
                original_price=6490000,
                stock_quantity=15,
                description="Bàn phím cơ custom gaming 75% tích hợp màn hình OLED 2 inch, cấu trúc gasket mount 3 lớp đệm tiêu âm và switch bôi trơn sẵn.",
                specs={
                    "Switch": "ROG NX Snow (Linear pre-lubed mượt mà)",
                    "Hotswap": "Hỗ trợ 5-pin và 3-pin tiện thay switch",
                    "Màn hình hiển thị": "Màn hình OLED 2 inch thông minh + núm xoay 3 chiều",
                    "Cấu trúc Mount": "Gasket mount với 3 lớp đệm silicone giảm chấn tiêu âm",
                    "Keycap": "PBT Doubleshot ROG cao cấp chống mài mòn",
                    "Kết nối": "Tri-mode: Bluetooth 5.1, ROG SpeedNova 2.4GHz, USB-C",
                    "Thời lượng pin": "Lên đến 2,000 giờ (khi tắt màn hình OLED và LED RGB)",
                    "Polling Rate": "1,000 Hz",
                },
                image_url="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80",
                ],
                rating=5.0,
                review_count=84,
                is_featured=True,
                is_active=True,
            ),
            # Sản phẩm 3: Tai nghe Gaming Razer BlackShark V2 Pro 2023
            Product(
                name="Tai nghe Gaming không dây Razer BlackShark V2 Pro (Phiên bản 2023)",
                slug="tai-nghe-razer-blackshark-v2-pro-2023",
                brand="Razer",
                category_id=cat_headset.id,
                price=4490000,
                original_price=4990000,
                stock_quantity=20,
                description="Chuẩn mực tai nghe thể thao điện tử FPS với micro siêu băng thông HyperClear và driver TriForce Titanium 50mm.",
                specs={
                    "Màng loa (Driver)": "Razer TriForce Titanium 50mm",
                    "Microphone": "Razer HyperClear Super Wideband 9.6kHz siêu chi tiết",
                    "Âm thanh vòm": "THX Spatial Audio tích hợp sẵn profile âm thanh pro-tuned",
                    "Đệm tai": "Mút hoạt tính FlowKnit êm ái thoáng khí, chống ồn thụ động cực tốt",
                    "Kết nối": "Razer HyperSpeed Wireless 2.4GHz, Bluetooth 5.2, Cáp USB Audio",
                    "Thời lượng pin": "70 giờ (sạc nhanh Type-C 15 phút dùng được 6 giờ)",
                    "Trọng lượng": "320g nhẹ nhàng thoải mái khi đeo lâu",
                },
                image_url="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80",
                ],
                rating=4.8,
                review_count=65,
                is_featured=True,
                is_active=True,
            ),
            # Sản phẩm 4: Đế tản nhiệt IETS GT500 V2
            Product(
                name="Đế tản nhiệt Laptop IETS GT500 V2 Turbofan Công Suất Cao 5000 RPM",
                slug="de-tan-nhiet-laptop-iets-gt500-v2",
                brand="IETS",
                category_id=cat_cooler.id,
                price=1850000,
                original_price=2150000,
                stock_quantity=30,
                description="Quái vật tản nhiệt laptop với quạt tăng áp công nghiệp và đệm mút kín hơi, hạ nhiệt độ CPU/GPU từ 15°C - 25°C.",
                specs={
                    "Tốc độ quạt": "Lên đến 5,000 RPM (núm điều chỉnh tốc độ vô cấp)",
                    "Hiệu quả làm mát": "Hạ nhiệt từ 15°C - 25°C tức thì cho laptop gaming tải nặng",
                    "Cơ chế kín khí": "Vòng đệm bọt biển đàn hồi cao niêm phong đáy máy, tạo áp suất gió cưỡng bức",
                    "Lọc bụi": "Bộ lọc bụi lưới kim loại dày có thể tháo rời và giặt sạch",
                    "Khả năng tương thích": "Tương thích laptop màn hình từ 13 inch đến 17.3 inch",
                    "Cổng mở rộng": "Tích hợp Hub 3 cổng USB 2.0 tiện lợi",
                    "Độ ồn": "50 dB - 65 dB (tùy mức tốc độ gió)",
                },
                image_url="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80",
                ],
                rating=4.9,
                review_count=92,
                is_featured=False,
                is_active=True,
            ),
            # Sản phẩm 5: Chuột Gaming Razer Viper V3 Pro
            Product(
                name="Chuột Gaming Không Dây Siêu Nhẹ Razer Viper V3 Pro (8000Hz Polling)",
                slug="razer-viper-v3-pro-wireless-8000hz",
                brand="Razer",
                category_id=cat_mouse.id,
                price=3990000,
                original_price=4390000,
                stock_quantity=18,
                description="Vũ khí tối thượng của các vận động viên esports với cảm biến 35K Gen-2 và Polling rate 8000Hz không dây.",
                specs={
                    "DPI": "35,000 DPI (Cảm biến quang học Focus Pro 35K Gen-2)",
                    "Switch": "Switch quang học Razer Gen-3 (độ bền 90 triệu lần nhấn, không bị double-click)",
                    "Polling Rate": "HyperPolling Wireless 8,000 Hz Native (độ trễ siêu thấp 0.125ms)",
                    "Tốc độ tối đa (IPS)": "750 IPS",
                    "Gia tốc tối đa": "70G",
                    "Trọng lượng": "54g siêu nhẹ cân đối hoàn hảo",
                    "Kết nối": "Razer HyperSpeed Wireless + Cáp USB Type-C Speedflex",
                    "Thời lượng pin": "Lên đến 95 giờ (ở 1000Hz) hoặc 17 giờ (ở 8000Hz)",
                },
                image_url="https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
                ],
                rating=4.9,
                review_count=110,
                is_featured=True,
                is_active=True,
            ),
            # Sản phẩm 6: Bàn phím cơ Akko MonsGeek M1 V3 QMK/VIA (Nhôm CNC)
            Product(
                name="Bàn phím cơ Akko MonsGeek M1 V3 QMK Nhôm CNC Gasket Mount",
                slug="ban-phim-co-akko-monsgeek-m1-v3-nhom-cnc",
                brand="Akko",
                category_id=cat_keyboard.id,
                price=2890000,
                original_price=3200000,
                stock_quantity=22,
                description="Bàn phím cơ nhôm nguyên khối Anodized cao cấp từ thương hiệu Akko x MonsGeek, hỗ trợ phần mềm QMK/VIA và switch Akko V3 Piano Pro mượt mà.",
                specs={
                    "Hãng": "Akko",
                    "Switch": "Akko V3 Piano Pro (Linear lực nhấn 45g)",
                    "Chất liệu vỏ": "Nhôm nguyên khối CNC Anodized sắc nét",
                    "Hotswap": "Mạch xuôi 5-pin hỗ trợ hotswap mọi loại switch",
                    "Cấu trúc": "Gasket Mount với đệm Poron và lót đáy PET",
                    "Phần mềm tùy biến": "Hỗ trợ QMK/VIA lập trình macro phím chuyên nghiệp",
                    "Kết nối": "Type-C tháo rời mạ vàng",
                    "LED": "RGB 16.8 triệu màu từng phím",
                },
                image_url="https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80",
                gallery_images=[
                    "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80",
                ],
                rating=4.9,
                review_count=76,
                is_featured=True,
                is_active=True,
            ),
        ]

        db.add_all(products)
        db.flush()

        # 4. Seed Giỏ hàng mẫu cho customer_user
        sample_cart_item = CartItem(
            user_id=customer_user.id,
            product_id=products[0].id,  # Logitech Superlight 2
            quantity=1,
        )
        db.add(sample_cart_item)

        # 5. Seed 1 Sample Order for testing
        sample_order = Order(
            order_code="TG-20261029-001",
            user_id=customer_user.id,
            customer_name="Nguyen Xuan Hung",
            shipping_phone="0988776655",
            shipping_address="Khu do thi Nam Tu Liem, Hanoi",
            total_amount=3590000,
            payment_method="COD",
            payment_status="pending",
            order_status="processing",
            note="Giao vào giờ hành chính giúp tôi.",
        )
        db.add(sample_order)
        db.flush()

        order_item = OrderItem(
            order_id=sample_order.id,
            product_id=products[0].id,  # Logitech mouse
            quantity=1,
            unit_price=products[0].price,
            total_price=products[0].price * 1,
        )
        db.add(order_item)

        db.commit()
        print("Successfully seeded categories, users, products (including Akko), cart, and orders!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
