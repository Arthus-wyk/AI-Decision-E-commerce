import hashlib
import hmac
import secrets

from fastapi import HTTPException
from sqlalchemy.orm import Session

from db.product_database import AuthSession, Cart, CartItem, Favorite, Order, OrderItem, Product, User


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, expected = password_hash.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return hmac.compare_digest(digest, expected)


def normalize_email(email: str) -> str:
    value = email.strip().lower()
    if "@" not in value:
        raise HTTPException(status_code=422, detail="A valid email address is required.")
    return value


def create_session(db: Session, user: User) -> AuthSession:
    auth_session = AuthSession(token=secrets.token_urlsafe(32), user_id=user.id)
    db.add(auth_session)
    db.commit()
    db.refresh(auth_session)
    return auth_session


def get_user_by_token(db: Session, token: str | None) -> User | None:
    if not token:
        return None
    auth_session = db.query(AuthSession).filter(AuthSession.token == token).first()
    if auth_session is None:
        return None
    return auth_session.user


def delete_session(db: Session, token: str | None) -> None:
    if not token:
        return
    db.query(AuthSession).filter(AuthSession.token == token).delete()
    db.commit()


def get_or_create_cart(db: Session, *, user: User | None, guest_id: str | None) -> Cart:
    cart = None
    if user is not None:
        cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    elif guest_id:
        cart = db.query(Cart).filter(Cart.guest_id == guest_id).first()
    if cart is None:
        cart = Cart(user_id=user.id if user else None, guest_id=None if user else guest_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def cart_to_payload(cart: Cart | None) -> dict:
    if cart is None:
        return {"items": [], "subtotal": 0, "count": 0}
    items = []
    subtotal = 0.0
    count = 0
    for item in cart.items:
        if item.product is None or not item.product.is_active:
            continue
        quantity = int(item.quantity)
        line_total = float(item.product.price) * quantity
        subtotal += line_total
        count += quantity
        items.append({"product": item.product, "quantity": quantity, "line_total": line_total})
    return {"items": items, "subtotal": subtotal, "count": count}


def find_cart(db: Session, *, user: User | None, guest_id: str | None) -> Cart | None:
    if user is not None:
        return db.query(Cart).filter(Cart.user_id == user.id).first()
    if guest_id:
        return db.query(Cart).filter(Cart.guest_id == guest_id).first()
    return None


def merge_guest_cart(db: Session, *, user: User, guest_id: str | None) -> None:
    if not guest_id:
        return
    guest_cart = db.query(Cart).filter(Cart.guest_id == guest_id).first()
    if guest_cart is None:
        return
    user_cart = get_or_create_cart(db, user=user, guest_id=None)
    for guest_item in list(guest_cart.items):
        target = (
            db.query(CartItem)
            .filter(CartItem.cart_id == user_cart.id, CartItem.product_id == guest_item.product_id)
            .first()
        )
        if target:
            target.quantity = min(99, target.quantity + guest_item.quantity)
        else:
            db.add(CartItem(cart_id=user_cart.id, product_id=guest_item.product_id, quantity=guest_item.quantity))
    db.delete(guest_cart)
    db.commit()


def add_cart_item(db: Session, *, user: User | None, guest_id: str | None, product_id: int, quantity: int) -> Cart:
    product = db.query(Product).filter(Product.id == product_id, Product.is_active.is_(True)).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    if product.stock_quantity <= 0:
        raise HTTPException(status_code=409, detail="Product is out of stock.")
    cart = get_or_create_cart(db, user=user, guest_id=guest_id)
    item = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.product_id == product_id).first()
    next_quantity = min(product.stock_quantity, quantity + (item.quantity if item else 0), 99)
    if item:
        item.quantity = next_quantity
    else:
        db.add(CartItem(cart_id=cart.id, product_id=product_id, quantity=next_quantity))
    db.commit()
    db.refresh(cart)
    return cart


def set_cart_quantity(db: Session, *, user: User | None, guest_id: str | None, product_id: int, quantity: int) -> Cart:
    cart = get_or_create_cart(db, user=user, guest_id=guest_id)
    item = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.product_id == product_id).first()
    if item is None:
        return cart
    if quantity <= 0:
        db.delete(item)
    else:
        stock = item.product.stock_quantity if item.product else quantity
        item.quantity = min(quantity, stock, 99)
    db.commit()
    db.refresh(cart)
    return cart


def clear_cart(db: Session, cart: Cart | None) -> None:
    if cart is None:
        return
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()


def create_order_from_cart(db: Session, *, user: User | None, guest_id: str | None, data) -> Order:
    cart = find_cart(db, user=user, guest_id=guest_id)
    payload = cart_to_payload(cart)
    if not payload["items"]:
        raise HTTPException(status_code=409, detail="Cart is empty.")

    stock_updates: list[tuple[Product, int]] = []
    for item in payload["items"]:
        product = db.query(Product).filter(Product.id == item["product"].id, Product.is_active.is_(True)).first()
        quantity = int(item["quantity"])
        if product is None:
            raise HTTPException(status_code=404, detail=f"{item['product'].name} is no longer available.")
        if product.stock_quantity < quantity:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Only {product.stock_quantity} unit"
                    f"{'' if product.stock_quantity == 1 else 's'} of {product.name} available."
                ),
            )
        stock_updates.append((product, quantity))

    order = Order(
        user_id=user.id if user else None,
        guest_id=None if user else guest_id,
        email=normalize_email(data.email),
        full_name=data.full_name.strip(),
        address=data.address.strip(),
        city=data.city.strip(),
        country=data.country.strip(),
        phone=(data.phone or "").strip() or None,
        subtotal=payload["subtotal"],
    )
    db.add(order)
    db.flush()
    for product, quantity in stock_updates:
        product.stock_quantity -= quantity
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=product.price,
                quantity=quantity,
            )
        )
    if cart is not None:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(order)
    return order
