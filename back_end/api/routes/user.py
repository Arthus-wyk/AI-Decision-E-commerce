from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from db.product_database import User, get_product_db
from schemas.commerce import AuthRequest, AuthResponse, UserRead
from service.commerce_service import (
    create_session,
    delete_session,
    apply_superadmin_bootstrap,
    get_user_by_token,
    hash_password,
    merge_guest_cart,
    normalize_email,
    verify_password,
)

router = APIRouter()


def current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_product_db),
) -> User | None:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    user = get_user_by_token(db, token)
    if user is not None:
        return apply_superadmin_bootstrap(db, user)
    return None


@router.post("/signup", response_model=AuthResponse)
def signup(payload: AuthRequest, db: Session = Depends(get_product_db)) -> AuthResponse:
    email = normalize_email(payload.email)
    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(email=email, name=(payload.name or "").strip() or None, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    user = apply_superadmin_bootstrap(db, user)
    merge_guest_cart(db, user=user, guest_id=payload.guest_id)
    auth_session = create_session(db, user)
    return AuthResponse(user=user, session_token=auth_session.token)


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthRequest, db: Session = Depends(get_product_db)) -> AuthResponse:
    email = normalize_email(payload.email)
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")
    user = apply_superadmin_bootstrap(db, user)
    merge_guest_cart(db, user=user, guest_id=payload.guest_id)
    auth_session = create_session(db, user)
    return AuthResponse(user=user, session_token=auth_session.token)


@router.post("/logout")
def logout(authorization: str | None = Header(default=None), db: Session = Depends(get_product_db)) -> dict:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    delete_session(db, token)
    return {"message": "logged out"}


@router.get("/me", response_model=UserRead | None)
def me(user: User | None = Depends(current_user)) -> User | None:
    return user
