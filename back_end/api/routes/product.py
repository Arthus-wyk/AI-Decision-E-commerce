from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.product_database import get_product_db
from schemas.product import ProductListResponse, ProductRead
from service.product import product_service


router = APIRouter()


@router.get("", response_model=ProductListResponse)
def list_products(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    brand: str | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    in_stock: bool | None = Query(default=None),
    sort: Literal["newest", "price_asc", "price_desc", "rating_desc"] | None = Query(
        default="newest"
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    db: Session = Depends(get_product_db),
) -> ProductListResponse:
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=422,
            detail="min_price must be less than or equal to max_price",
        )

    items, total = product_service.get_products(
        db,
        q=q,
        category=category,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return ProductListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/meta/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_product_db)) -> list[str]:
    return product_service.get_categories(db)


@router.get("/meta/brands", response_model=list[str])
def list_brands(db: Session = Depends(get_product_db)) -> list[str]:
    return product_service.get_brands(db)


@router.get("/byId/{id}", response_model=ProductRead)
def product_details_by_id(id: int, db: Session = Depends(get_product_db)) -> ProductRead:
    product = product_service.get_product_byId(db, id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/{slug}", response_model=ProductRead)
def product_details(slug: str, db: Session = Depends(get_product_db)) -> ProductRead:
    product = product_service.get_product_by_slug(db, slug)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
