from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' hoặc 'assistant'")
    content: str = Field(..., description="Nội dung tin nhắn")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Tin nhắn câu hỏi của khách hàng")
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Lịch sử đối thoại trước đó")


class ChatSuggestedProduct(BaseModel):
    id: int
    name: str
    brand: str
    price: float
    original_price: Optional[float] = None
    image_url: str
    slug: str
    specs: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Nội dung tư vấn từ AI Assistant")
    suggested_products: List[ChatSuggestedProduct] = Field(
        default_factory=list,
        description="Danh sách sản phẩm phù hợp được AI gợi ý dựa trên dữ liệu database",
    )
    provider: str = Field("Google Gemini", description="Mô hình AI xử lý (Google Gemini hoặc Smart TechGear Engine)")

