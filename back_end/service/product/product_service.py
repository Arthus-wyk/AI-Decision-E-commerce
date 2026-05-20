from typing import Literal

from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Query, Session

from db.product_database import Product


SortValue = Literal["newest", "price_asc", "price_desc", "rating_desc"]


def _active_products(db: Session) -> Query:
    return db.query(Product).filter(Product.is_active.is_(True))


def get_products(
    db: Session,
    *,
    q: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    in_stock: bool | None = None,
    sort: SortValue | None = None,
    page: int = 1,
    page_size: int = 12,
) -> tuple[list[Product], int]:
    query = _active_products(db)

    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(keyword),
                Product.description.ilike(keyword),
                Product.brand.ilike(keyword),
                Product.category.ilike(keyword),
            )
        )

    if category:
        query = query.filter(Product.category == category)

    if brand:
        query = query.filter(Product.brand == brand)

    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if in_stock is True:
        query = query.filter(Product.stock_quantity > 0)
    elif in_stock is False:
        query = query.filter(Product.stock_quantity <= 0)

    total = query.count()

    if sort == "price_asc":
        query = query.order_by(asc(Product.price), desc(Product.created_at))
    elif sort == "price_desc":
        query = query.order_by(desc(Product.price), desc(Product.created_at))
    elif sort == "rating_desc":
        query = query.order_by(desc(Product.rating), desc(Product.created_at))
    else:
        query = query.order_by(desc(Product.created_at), desc(Product.id))

    offset = (page - 1) * page_size
    return query.offset(offset).limit(page_size).all(), total


def get_product_by_slug(db: Session, slug: str) -> Product | None:
    return (
        db.query(Product)
        .filter(Product.slug == slug, Product.is_active.is_(True))
        .first()
    )
def get_product_byId(db: Session, id: int) -> Product | None:
    return (
        db.query(Product)
        .filter(Product.id == id, Product.is_active.is_(True))
        .first()
    )


def get_categories(db: Session) -> list[str]:
    rows = (
        _active_products(db)
        .filter(Product.category.is_not(None), Product.category != "")
        .with_entities(Product.category)
        .distinct()
        .order_by(func.lower(Product.category))
        .all()
    )
    return [row[0] for row in rows]


def get_brands(db: Session) -> list[str]:
    rows = (
        _active_products(db)
        .filter(Product.brand.is_not(None), Product.brand != "")
        .with_entities(Product.brand)
        .distinct()
        .order_by(func.lower(Product.brand))
        .all()
    )
    return [row[0] for row in rows]
