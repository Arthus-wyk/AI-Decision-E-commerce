from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    description: str | None = None
    short_description: str | None = None
    category: str | None = None
    brand: str | None = None
    price: float = Field(..., ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    image_url: str | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    is_active: bool = True

    @field_validator("name", "slug")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Value cannot be empty")
        return stripped


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    slug: str | None = Field(default=None, min_length=1)
    description: str | None = None
    short_description: str | None = None
    category: str | None = None
    brand: str | None = None
    price: float | None = Field(default=None, ge=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    image_url: str | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    is_active: bool | None = None

    @field_validator("name", "slug")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("Value cannot be empty")
        return stripped


class ProductRead(ProductBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: list[ProductRead]
    total: int
    page: int
    page_size: int
