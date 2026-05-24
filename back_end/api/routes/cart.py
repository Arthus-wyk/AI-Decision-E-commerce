from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.routes.user import current_user
from db.product_database import Cart, Favorite, Product, User, get_product_db
from schemas.commerce import BulkCartRequest, CartItemRequest, CartQuantityRequest, CartRead, GuestRequest
from schemas.product import ProductRead
from service.commerce_service import add_cart_item, cart_to_payload, clear_cart, find_cart, set_cart_quantity

router = APIRouter()


@router.get("", response_model=CartRead)
def get_cart(
    guest_id: str | None = None,
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
) -> dict:
    return cart_to_payload(find_cart(db, user=user, guest_id=guest_id))


@router.post("/items", response_model=CartRead)
def add_item(
    payload: CartItemRequest,
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
) -> dict:
    cart = add_cart_item(
        db,
        user=user,
        guest_id=None if user else payload.guest_id,
        product_id=payload.product_id,
        quantity=payload.quantity,
    )
    return cart_to_payload(cart)


@router.post("/items/bulk", response_model=CartRead)
def add_items(
    payload: BulkCartRequest,
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
) -> dict:
    cart = None
    for item in payload.items:
        cart = add_cart_item(
            db,
            user=user,
            guest_id=None if user else payload.guest_id,
            product_id=item.product_id,
            quantity=item.quantity,
        )
    return cart_to_payload(cart)


@router.patch("/items/{product_id}", response_model=CartRead)
def update_item(
    product_id: int,
    payload: CartQuantityRequest,
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
) -> dict:
    cart = set_cart_quantity(
        db,
        user=user,
        guest_id=None if user else payload.guest_id,
        product_id=product_id,
        quantity=payload.quantity,
    )
    return cart_to_payload(cart)


@router.delete("/items/{product_id}", response_model=CartRead)
def remove_item(
    product_id: int,
    guest_id: str | None = None,
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
) -> dict:
    cart = set_cart_quantity(db, user=user, guest_id=None if user else guest_id, product_id=product_id, quantity=0)
    return cart_to_payload(cart)


@router.delete("", response_model=CartRead)
def delete_cart(
    payload: GuestRequest | None = None,
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
) -> dict:
    guest_id = payload.guest_id if payload else None
    cart = find_cart(db, user=user, guest_id=None if user else guest_id)
    clear_cart(db, cart)
    return cart_to_payload(cart)


@router.get("/favorites", response_model=list[ProductRead])
def list_favorites(
    user: User | None = Depends(current_user),
    db: Session = Depends(get_product_db),
) -> list[Product]:
    if user is None:
        return []
    rows = db.query(Favorite).filter(Favorite.user_id == user.id).all()
    return [row.product for row in rows if row.product and row.product.is_active]
