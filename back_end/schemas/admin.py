from typing import Literal

from pydantic import BaseModel, ConfigDict

from schemas.commerce import OrderRead, UserRead
from schemas.product import ProductCreate, ProductListResponse, ProductUpdate


OrderStatus = Literal["demo_created", "processing", "shipped", "cancelled"]


class AdminOverview(BaseModel):
    product_count: int
    active_product_count: int
    user_count: int
    active_user_count: int
    order_count: int
    revenue_subtotal: float


class AdminProductList(ProductListResponse):
    pass


class AdminProductCreate(ProductCreate):
    pass


class AdminProductUpdate(ProductUpdate):
    pass


class AdminUserList(BaseModel):
    items: list[UserRead]
    total: int
    page: int
    page_size: int


class AdminUserUpdate(BaseModel):
    is_superadmin: bool | None = None
    is_active: bool | None = None


class AdminOrderList(BaseModel):
    items: list[OrderRead]
    total: int
    page: int
    page_size: int


class AdminOrderUpdate(BaseModel):
    status: OrderStatus


class AdminOrderRead(OrderRead):
    user_id: int | None = None

    model_config = ConfigDict(from_attributes=True)
