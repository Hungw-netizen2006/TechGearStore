import json
import httpx
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.product import Product
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatSuggestedProduct,
)

router = APIRouter()


def _build_products_context(products: List[Product]) -> str:
    """Định dạng danh sách sản phẩm từ database thành ngữ cảnh chi tiết cho AI"""
    lines = []
    for p in products:
        specs_str = ", ".join([f"{k}: {v}" for k, v in (p.specs or {}).items()])
        price_str = f"{p.price:,.0f} VND"
        original_price_str = f"{p.original_price:,.0f} VND" if p.original_price else "Không có"
        lines.append(
            f"- [ID: {p.id}] {p.name}\n"
            f"  + Hãng sản xuất: {p.brand}\n"
            f"  + Danh mục: {p.category.name if p.category else 'Phụ kiện'}\n"
            f"  + Giá bán hiện tại: {price_str} (Giá niêm yết: {original_price_str})\n"
            f"  + Số lượng còn trong kho: {p.stock_quantity}\n"
            f"  + Thông số kỹ thuật nổi bật: {specs_str}\n"
            f"  + Mô tả tóm tắt: {p.description or 'Chính hãng cao cấp'}"
        )
    return "\n".join(lines)


def _find_matching_products(text: str, products: List[Product]) -> List[ChatSuggestedProduct]:
    """Tìm các sản phẩm từ database được đề cập hoặc phù hợp nhất để gửi kèm cho UI"""
    matched = []
    text_lower = text.lower()

    for p in products:
        # Kiểm tra xem tên, thương hiệu hoặc từ khóa sản phẩm có xuất hiện trong câu tư vấn không
        name_keywords = [w for w in p.name.lower().split() if len(w) > 3]
        brand_match = p.brand.lower() in text_lower
        name_match = any(w in text_lower for w in name_keywords)

        if brand_match or name_match:
            matched.append(
                ChatSuggestedProduct(
                    id=p.id,
                    name=p.name,
                    brand=p.brand,
                    price=float(p.price),
                    original_price=float(p.original_price) if p.original_price else None,
                    image_url=p.image_url,
                    slug=p.slug,
                    specs=p.specs,
                )
            )

    # Nếu không khớp đích danh, thử tìm theo danh mục chung
    if not matched:
        if any(w in text_lower for w in ["chuột", "mouse", "dpi"]):
            matched = [
                ChatSuggestedProduct(
                    id=p.id, name=p.name, brand=p.brand, price=float(p.price),
                    original_price=float(p.original_price) if p.original_price else None,
                    image_url=p.image_url, slug=p.slug, specs=p.specs,
                ) for p in products if "chuột" in p.name.lower() or p.category_id == 1
            ]
        elif any(w in text_lower for w in ["phím", "keyboard", "switch", "akko"]):
            matched = [
                ChatSuggestedProduct(
                    id=p.id, name=p.name, brand=p.brand, price=float(p.price),
                    original_price=float(p.original_price) if p.original_price else None,
                    image_url=p.image_url, slug=p.slug, specs=p.specs,
                ) for p in products if "phím" in p.name.lower() or p.category_id == 2
            ]
        elif any(w in text_lower for w in ["tai nghe", "headset", "âm thanh"]):
            matched = [
                ChatSuggestedProduct(
                    id=p.id, name=p.name, brand=p.brand, price=float(p.price),
                    original_price=float(p.original_price) if p.original_price else None,
                    image_url=p.image_url, slug=p.slug, specs=p.specs,
                ) for p in products if "tai nghe" in p.name.lower() or p.category_id == 3
            ]
        elif any(w in text_lower for w in ["tản nhiệt", "cooler", "quạt"]):
            matched = [
                ChatSuggestedProduct(
                    id=p.id, name=p.name, brand=p.brand, price=float(p.price),
                    original_price=float(p.original_price) if p.original_price else None,
                    image_url=p.image_url, slug=p.slug, specs=p.specs,
                ) for p in products if "tản nhiệt" in p.name.lower() or p.category_id == 4
            ]

    return matched[:3]  # Gợi ý tối đa 3 sản phẩm phù hợp nhất


def _smart_advisor_fallback(query: str, products: List[Product]) -> tuple[str, List[ChatSuggestedProduct]]:
    """
    Hệ thống tư vấn chuyên gia nội bộ (hoạt động khi chưa có GEMINI_API_KEY hoặc khi API ngoài gián đoạn):
    Phân tích trực tiếp từ Database sản phẩm thực tế của TechGear Store.
    """
    q = query.lower()
    matched_prods: List[Product] = []

    # Phân tích ý định người dùng
    if any(k in q for k in ["chuột", "mouse", "dpi", "valorant", "cs2", "bắn súng", "fps"]):
        matched_prods = [p for p in products if p.category_id == 1 or "chuột" in p.name.lower()]
        reply = (
            "Chào bạn! Để chiến các tựa game FPS như CS2 hay Valorant, bạn cần một chú chuột siêu nhẹ, cảm biến đỉnh cao và tần số phản hồi cực thấp. "
            "Hiện tại TechGear Store đang có sẵn hai siêu phẩm esports hàng đầu thế giới:\n\n"
            "1. **Logitech G Pro X Superlight 2** (3.590.000 ₫): Trọng lượng 60g, cảm biến HERO 2 đạt 32,000 DPI, switch lai quang-cơ LIGHTFORCE Hybrid bền bỉ, pin trâu 95h.\n"
            "2. **Razer Viper V3 Pro Wireless** (3.990.000 ₫): Trọng lượng chỉ 54g, cảm biến Focus Pro 35K Gen-2 và đặc biệt hỗ trợ Polling Rate native lên tới 8000Hz (0.125ms) mượt mà tối đa.\n\n"
            "Bạn có thể bấm vào sản phẩm bên dưới để xem chi tiết hoặc thêm ngay vào giỏ hàng nhé!"
        )
    elif any(k in q for k in ["bàn phím", "phím", "keyboard", "switch", "akko", "oled", "gõ", "code"]):
        matched_prods = [p for p in products if p.category_id == 2 or "phím" in p.name.lower()]
        reply = (
            "Chào bạn! Nếu bạn đang tìm kiếm một chiếc bàn phím cơ chất lượng cao để gõ code hay chơi game thì TechGear Store có 2 lựa chọn cực kỳ sáng giá:\n\n"
            "1. **Bàn phím cơ ASUS ROG Azoth 75%** (5.990.000 ₫): Dòng phím cơ custom cao cấp nhất tích hợp màn hình OLED 2 inch thông minh, cấu trúc Gasket mount 3 lớp tiêu âm và switch ROG NX Snow pre-lubed cực êm.\n"
            "2. **Bàn phím cơ Akko MonsGeek M1 V3** (2.890.000 ₫): Vỏ nhôm nguyên khối CNC Anodized đầm tay, switch Akko V3 Piano Pro linear mượt mà, hỗ trợ tùy biến layout qua QMK/VIA chuyên nghiệp.\n\n"
            "Cả hai đều hỗ trợ hotswap tiện lợi để bạn dễ dàng thay đổi switch theo sở thích cá nhân!"
        )
    elif any(k in q for k in ["tai nghe", "headset", "mic", "âm thanh", "nghe"]):
        matched_prods = [p for p in products if p.category_id == 3 or "tai nghe" in p.name.lower()]
        reply = (
            "Chào bạn! Về tai nghe gaming esports, mình nhiệt tình gợi ý mẫu **Razer BlackShark V2 Pro 2023** (giá ưu đãi 4.490.000 ₫):\n\n"
            "• Màng loa TriForce Titanium 50mm cho âm thanh chi tiết, định vị tiếng bước chân địch trong game FPS chuẩn xác.\n"
            "• Micro HyperClear Super Wideband 9.6kHz thu âm giọng nói trong trẻo như mic phòng thu.\n"
            "• Đệm tai FlowKnit êm ái thoáng khí không đau tai khi đeo lâu, thời lượng pin ấn tượng lên đến 70 giờ liên tục."
        )
    elif any(k in q for k in ["tản nhiệt", "cooler", "quạt", "nóng", "laptop"]):
        matched_prods = [p for p in products if p.category_id == 4 or "tản nhiệt" in p.name.lower()]
        reply = (
            "Chào bạn! Nếu laptop gaming của bạn bị nóng khi render hoặc chơi game tải nặng, bạn hãy trang bị ngay **Đế tản nhiệt IETS GT500 V2 Turbofan** (1.850.000 ₫):\n\n"
            "• Quạt áp suất gió công nghiệp lên tới 5,000 RPM (có núm điều chỉnh vô cấp).\n"
            "• Vòng đệm bọt biển niêm phong đáy máy, ép luồng gió cưỡng bức làm hạ ngay 15°C - 25°C tức thì.\n"
            "• Tích hợp màng lọc bụi kim loại dày ngăn bụi bẩn lọt vào quạt laptop, có thể rửa sạch và dùng lại bền bỉ."
        )
    else:
        matched_prods = products[:2]
        reply = (
            "Xin chào! Mình là **TechGear AI Assistant** - chuyên viên tư vấn phụ kiện công nghệ gaming chuyên nghiệp.\n\n"
            "Tại TechGear Store, chúng mình đang sẵn sàng các thiết bị ngoại vi hàng đầu: Chuột gaming 35K DPI, Bàn phím cơ ROG OLED & Akko nhôm CNC, Tai nghe esports 70h pin và Đế tản nhiệt turbofan 5000 RPM.\n\n"
            "Bạn đang tìm phụ kiện cho nhu cầu gì (chơi game FPS, gõ văn phòng/code, làm mát laptop) hay có tầm ngân sách khoảng bao nhiêu triệu để mình tư vấn chính xác nhất nhé?"
        )

    suggested = [
        ChatSuggestedProduct(
            id=p.id, name=p.name, brand=p.brand, price=float(p.price),
            original_price=float(p.original_price) if p.original_price else None,
            image_url=p.image_url, slug=p.slug, specs=p.specs,
        )
        for p in matched_prods[:3]
    ]

    return reply, suggested


@router.post(
    "",
    response_model=ChatResponse,
    summary="AI Chatbot tư vấn phụ kiện công nghệ (Google Gemini API + Database context)",
)
async def chat_with_ai(
    req: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Endpoint tư vấn bán hàng thông minh bằng AI:
    1. Lấy toàn bộ sản phẩm đang kinh doanh từ SQLite Database truyền vào System Context của Gemini.
    2. Đóng vai chuyên viên tư vấn công nghệ chuyên nghiệp (chuột, bàn phím cơ, tai nghe, đế tản nhiệt).
    3. Trả về câu trả lời phân tích chuyên sâu kèm danh sách thẻ sản phẩm gợi ý (suggested_products).
    """
    # 1. Truy vấn danh sách sản phẩm từ SQLite Database
    products = db.query(Product).filter(Product.is_active == True).all()
    products_context = _build_products_context(products)

    # 2. Xây dựng System Instruction chuyên sâu
    system_instruction = (
        "Bạn là TechGear AI - Chuyên gia tư vấn bán hàng phụ kiện công nghệ gaming cao cấp của TechGear Store.\n"
        "Bạn có kiến thức chuyên sâu về phần cứng: cảm biến quang học chuột (HERO 2, Focus Pro 35K), switch chuột (quang học, hybrid), "
        "tần số phản hồi (1000Hz, 8000Hz), bàn phím cơ (gasket mount, màn hình OLED, hotswap 5-pin, switch pre-lubed như ROG NX Snow hay Akko V3 Piano), "
        "tai nghe (driver Titanium 50mm, THX Spatial Audio, mic băng thông rộng), và đế tản nhiệt laptop (turbofan 5000 RPM, áp suất kín khí).\n\n"
        "DANH SÁCH SẢN PHẨM HIỆN CÓ TẠI TECHGEAR STORE (DỮ LIỆU TỪ DATABASE):\n"
        f"{products_context}\n\n"
        "QUY TẮC TƯ VẤN BẮT BUỘC:\n"
        "1. Luôn ưu tiên giới thiệu các sản phẩm CÓ TRONG DANH SÁCH DATABASE ở trên. Trích dẫn chính xác tên sản phẩm, hãng (Logitech, Razer, Akko, ASUS ROG, IETS), giá bán (VND) và các thông số kỹ thuật thực tế.\n"
        "2. Phân tích ưu nhược điểm phù hợp với nhu cầu của khách (bắn game FPS như Valorant/CS2, gõ văn bản/code, nghe nhạc, làm mát laptop nóng...).\n"
        "3. Trình bày sáng sủa, đẹp mắt bằng Markdown, gạch đầu dòng rõ ràng.\n"
        "4. Giọng văn nhiệt tình, thân thiện, xưng là 'mình' hoặc 'TechGear Store' và gọi khách là 'bạn'.\n"
    )

    # 3. Kiểm tra xem có GEMINI_API_KEY không
    gemini_key = settings.GEMINI_API_KEY

    if gemini_key and gemini_key.strip():
        try:
            # Chuẩn bị tin nhắn hội thoại gửi tới Gemini API
            gemini_contents = []

            # Thêm lịch sử đối thoại nếu có
            if req.history:
                for msg in req.history[-4:]:  # Lấy 4 tin nhắn gần nhất để giữ context
                    role_gemini = "user" if msg.role == "user" else "model"
                    gemini_contents.append({"role": role_gemini, "parts": [{"text": msg.content}]})

            # Tin nhắn hiện tại của khách kèm ngữ cảnh hệ thống
            prompt_with_context = f"[SYSTEM CONTEXT]\n{system_instruction}\n\n[KHÁCH HÀNG HỎI]:\n{req.message}"
            gemini_contents.append({"role": "user", "parts": [{"text": prompt_with_context}]})

            model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key.strip()}"

            payload = {
                "contents": gemini_contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 1000,
                },
            }

            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(gemini_url, json=payload)

            if res.status_code == 200:
                data = res.json()
                reply_text = data["candidates"][0]["content"]["parts"][0]["text"]
                suggested = _find_matching_products(reply_text + " " + req.message, products)
                return ChatResponse(
                    reply=reply_text,
                    suggested_products=suggested,
                    provider=f"Google Gemini ({model_name})",
                )
            else:
                print(f"Gemini API returned status {res.status_code}: {res.text}. Using smart advisor fallback.")
        except Exception as e:
            print(f"Error calling Gemini API: {e}. Falling back to Smart TechGear Engine.")

    # 4. Fallback thông minh dựa trên Database
    fallback_reply, suggested = _smart_advisor_fallback(req.message, products)
    return ChatResponse(
        reply=fallback_reply,
        suggested_products=suggested,
        provider="TechGear Smart AI Engine (Database Powered)",
    )

