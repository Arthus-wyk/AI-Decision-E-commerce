from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session, joinedload

from api.routes.user import current_user
from db.product_database import Order, Product, User, get_product_db
from schemas.admin import (
    AdminOrderList,
    AdminOrderRead,
    AdminOrderUpdate,
    AdminOverview,
    AdminProductCreate,
    AdminProductList,
    AdminProductUpdate,
    AdminUserList,
    AdminUserUpdate,
)
from schemas.commerce import OrderRead, UserRead
from schemas.product import ProductRead

router = APIRouter()


def require_superadmin(user: User | None = Depends(current_user)) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required.")
    if not user.is_superadmin:
        raise HTTPException(status_code=403, detail="Superadmin access required.")
    return user


@router.get("/overview", response_model=AdminOverview)
def overview(
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_product_db),
) -> AdminOverview:
    revenue = db.query(func.coalesce(func.sum(Order.subtotal), 0)).scalar() or 0
    return AdminOverview(
        product_count=db.query(Product).count(),
        active_product_count=db.query(Product).filter(Product.is_active.is_(True)).count(),
        user_count=db.query(User).count(),
        active_user_count=db.query(User).filter(User.is_active.is_(True)).count(),
        order_count=db.query(Order).count(),
        revenue_subtotal=float(revenue),
    )


@router.get("/products", response_model=AdminProductList)
def list_products(
    q: str | None = Query(default=None),
    active: bool | None = Query(default=None),
    sort: Literal["newest", "name_asc", "price_asc", "price_desc", "stock_asc", "stock_desc"] = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_product_db),
) -> AdminProductList:
    query = db.query(Product)
    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(keyword),
                Product.slug.ilike(keyword),
                Product.brand.ilike(keyword),
                Product.category.ilike(keyword),
            )
        )
    if active is not None:
        query = query.filter(Product.is_active.is_(active))
    total = query.count()
    if sort == "name_asc":
        query = query.order_by(asc(func.lower(Product.name)), desc(Product.id))
    elif sort == "price_asc":
        query = query.order_by(asc(Product.price), desc(Product.id))
    elif sort == "price_desc":
        query = query.order_by(desc(Product.price), desc(Product.id))
    elif sort == "stock_asc":
        query = query.order_by(asc(Product.stock_quantity), desc(Product.id))
    elif sort == "stock_desc":
        query = query.order_by(desc(Product.stock_quantity), desc(Product.id))
    else:
        query = query.order_by(desc(Product.created_at), desc(Product.id))
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return AdminProductList(items=items, total=total, page=page, page_size=page_size)


def _ensure_unique_slug(db: Session, slug: str, product_id: int | None = None) -> None:
    query = db.query(Product).filter(Product.slug == slug)
    if product_id is not None:
        query = query.filter(Product.id != product_id)
    if query.first() is not None:
        raise HTTPException(status_code=409, detail="A product with this slug already exists.")


@router.post("/products", response_model=ProductRead)
def create_product(
    payload: AdminProductCreate,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_product_db),
) -> Product:
    _ensure_unique_slug(db, payload.slug)
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: AdminProductUpdate,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_product_db),
) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    updates = payload.model_dump(exclude_unset=True)
    if "slug" in updates:
        _ensure_unique_slug(db, updates["slug"], product_id=product.id)
    for key, value in updates.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}/active", response_model=ProductRead)
def set_product_active(
    product_id: int,
    payload: AdminProductUpdate,
    admin: User = Depends(require_superadmin),
    db: Session = Depends(get_product_db),
) -> Product:
    if payload.is_active is None:
        raise HTTPException(status_code=422, detail="is_active is required.")
    return update_product(product_id, AdminProductUpdate(is_active=payload.is_active), admin, db)


@router.get("/users", response_model=AdminUserList)
def list_users(
    q: str | None = Query(default=None),
    active: bool | None = Query(default=None),
    role: Literal["all", "superadmin", "customer"] = Query(default="all"),
    sort: Literal["newest", "email_asc", "email_desc"] = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_product_db),
) -> AdminUserList:
    query = db.query(User)
    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(or_(User.email.ilike(keyword), User.name.ilike(keyword)))
    if active is not None:
        query = query.filter(User.is_active.is_(active))
    if role == "superadmin":
        query = query.filter(User.is_superadmin.is_(True))
    elif role == "customer":
        query = query.filter(User.is_superadmin.is_(False))
    total = query.count()
    if sort == "email_asc":
        query = query.order_by(asc(func.lower(User.email)), desc(User.id))
    elif sort == "email_desc":
        query = query.order_by(desc(func.lower(User.email)), desc(User.id))
    else:
        query = query.order_by(desc(User.created_at), desc(User.id))
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return AdminUserList(items=items, total=total, page=page, page_size=page_size)


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    admin: User = Depends(require_superadmin),
    db: Session = Depends(get_product_db),
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    updates = payload.model_dump(exclude_unset=True)
    if user.id == admin.id and updates.get("is_superadmin") is False:
        raise HTTPException(status_code=400, detail="You cannot demote your own superadmin account.")
    if user.id == admin.id and updates.get("is_active") is False:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")
    for key, value in updates.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/orders", response_model=AdminOrderList)
def list_orders(
    q: str | None = Query(default=None),
    status: Literal["all", "demo_created", "processing", "shipped", "cancelled"] = Query(default="all"),
    sort: Literal["newest", "oldest", "subtotal_asc", "subtotal_desc"] = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_product_db),
) -> AdminOrderList:
    query = db.query(Order).options(joinedload(Order.items))
    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Order.email.ilike(keyword),
                Order.full_name.ilike(keyword),
                Order.status.ilike(keyword),
                Order.city.ilike(keyword),
                Order.country.ilike(keyword),
            )
        )
    if status != "all":
        query = query.filter(Order.status == status)
    total = query.count()
    if sort == "oldest":
        query = query.order_by(asc(Order.created_at), asc(Order.id))
    elif sort == "subtotal_asc":
        query = query.order_by(asc(Order.subtotal), desc(Order.id))
    elif sort == "subtotal_desc":
        query = query.order_by(desc(Order.subtotal), desc(Order.id))
    else:
        query = query.order_by(desc(Order.created_at), desc(Order.id))
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return AdminOrderList(items=items, total=total, page=page, page_size=page_size)


@router.get("/orders/{order_id}", response_model=AdminOrderRead)
def get_order(
    order_id: int,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_product_db),
) -> Order:
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order


@router.patch("/orders/{order_id}", response_model=OrderRead)
def update_order(
    order_id: int,
    payload: AdminOrderUpdate,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_product_db),
) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order
