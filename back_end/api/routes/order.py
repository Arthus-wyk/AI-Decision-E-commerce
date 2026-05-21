from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.routes.user import current_user
from db.product_database import Favorite, Product, User, get_product_db
from schemas.commerce import CheckoutRequest, OrderRead
from schemas.product import ProductRead
from service.commerce_service import create_order_from_cart

router = APIRouter()


@router.get("/favorites", response_model=list[ProductRead])
def list_favorites(
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
) -> list[Product]:
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to view favorites.")
    rows = db.query(Favorite).filter(Favorite.user_id == user.id).all()
    return [row.product for row in rows if row.product and row.product.is_active]


@router.post("/favorites/{product_id}", response_model=list[ProductRead])
def add_favorite(
    product_id: int,
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
) -> list[Product]:
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to save favorites.")
    product = db.query(Product).filter(Product.id == product_id, Product.is_active.is_(True)).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    existing = db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.product_id == product_id).first()
    if existing is None:
        db.add(Favorite(user_id=user.id, product_id=product_id))
        db.commit()
    return list_favorites(user, db)


@router.delete("/favorites/{product_id}", response_model=list[ProductRead])
def remove_favorite(
    product_id: int,
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
) -> list[Product]:
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to manage favorites.")
    db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.product_id == product_id).delete()
    db.commit()
    return list_favorites(user, db)


@router.post("/orders", response_model=OrderRead)
def create_order(
    payload: CheckoutRequest,
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
):
    return create_order_from_cart(db, user=user, guest_id=None if user else payload.guest_id, data=payload)


@router.get("/orders", response_model=list[OrderRead])
def list_orders(
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
):
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to view orders.")
    return user.orders
