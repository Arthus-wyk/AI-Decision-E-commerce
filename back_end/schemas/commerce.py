from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from schemas.product import ProductRead


class UserRead(BaseModel):
    id: int
    email: str
    name: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AuthRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    name: str | None = None
    guest_id: str | None = None


class AuthResponse(BaseModel):
    user: UserRead
    session_token: str


class CartItemRead(BaseModel):
    product: ProductRead
    quantity: int
    line_total: float


class CartRead(BaseModel):
    items: list[CartItemRead]
    subtotal: float
    count: int


class CartItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=99)
    guest_id: str | None = None


class CartQuantityRequest(BaseModel):
    quantity: int = Field(..., ge=0, le=99)
    guest_id: str | None = None


class GuestRequest(BaseModel):
    guest_id: str | None = None


class CheckoutRequest(BaseModel):
    email: str
    full_name: str = Field(..., min_length=1)
    address: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1)
    country: str = Field(..., min_length=1)
    phone: str | None = None
    guest_id: str | None = None


class OrderItemRead(BaseModel):
    product_id: int
    product_name: str
    unit_price: float
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class OrderRead(BaseModel):
    id: int
    email: str
    full_name: str
    address: str
    city: str
    country: str
    phone: str | None = None
    status: str
    subtotal: float
    created_at: datetime | None = None
    items: list[OrderItemRead]

    model_config = ConfigDict(from_attributes=True)


class ShopAssistantRequest(BaseModel):
    message: str = Field(..., min_length=1)
    product_id: int | None = None


class CartDraft(BaseModel):
    product_id: int
    quantity: int
    rationale: str


class ShopAssistantResponse(BaseModel):
    message: str
    cart_draft: CartDraft | None = None
