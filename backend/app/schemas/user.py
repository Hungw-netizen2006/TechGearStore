from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Email đăng nhập của khách hàng")
    full_name: str = Field(..., min_length=2, max_length=100, description="Họ và tên đầy đủ")
    phone: Optional[str] = Field(None, max_length=20, description="Số điện thoại liên hệ")
    address: Optional[str] = Field(None, max_length=255, description="Địa chỉ giao hàng mặc định")


class UserRegister(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="Mật khẩu tối thiểu 6 ký tự")


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Email tài khoản")
    password: str = Field(..., min_length=1, description="Mật khẩu")


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=255)
    current_password: Optional[str] = Field(None, description="Mật khẩu hiện tại (nếu muốn đổi mật khẩu)")
    new_password: Optional[str] = Field(None, min_length=6, max_length=100, description="Mật khẩu mới")


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: UserResponse
