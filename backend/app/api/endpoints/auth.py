from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, UserUpdate, Token

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Đăng ký tài khoản khách hàng mới",
)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Đăng ký tài khoản khách hàng mới:
    - Kiểm tra email chưa tồn tại trong hệ thống.
    - Mã hóa mật khẩu an toàn với Bcrypt.
    - Gán quyền mặc định là 'customer'.
    """
    # 1. Kiểm tra email trùng lặp
    existing_user = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{user_in.email}' đã được đăng ký trên TechGear Store. Vui lòng đăng nhập hoặc sử dụng email khác.",
        )

    # 2. Tạo bản ghi User mới
    new_user = User(
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        phone=user_in.phone.strip() if user_in.phone else None,
        address=user_in.address.strip() if user_in.address else None,
        role="customer",
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post(
    "/login",
    response_model=Token,
    summary="Đăng nhập tài khoản và nhận JWT Access Token",
)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Đăng nhập hệ thống:
    - Xác thực email và mật khẩu.
    - Kiểm tra trạng thái kích hoạt tài khoản.
    - Trả về JWT Access Token cùng thông tin khách hàng.
    """
    user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ bộ phận hỗ trợ khách hàng TechGear.",
        )

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role},
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=user,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Lấy thông tin tài khoản đang đăng nhập",
)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Lấy thông tin cá nhân của khách hàng hiện tại dựa trên Bearer Token.
    """
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Cập nhật thông tin cá nhân hoặc đổi mật khẩu",
)
def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cập nhật họ tên, số điện thoại, địa chỉ nhận hàng hoặc đổi mật khẩu tài khoản.
    """
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name.strip()
    if user_update.phone is not None:
        current_user.phone = user_update.phone.strip()
    if user_update.address is not None:
        current_user.address = user_update.address.strip()

    # Xử lý đổi mật khẩu
    if user_update.new_password:
        if not user_update.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vui lòng nhập mật khẩu hiện tại để xác nhận đổi mật khẩu mới.",
            )
        if not verify_password(user_update.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu hiện tại không chính xác.",
            )
        current_user.hashed_password = get_password_hash(user_update.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user
