from fastapi import APIRouter

from db.product_database import SessionLocal
from schemas.commerce import CartDraft, ShopAssistantRequest, ShopAssistantResponse
from service.product import product_service
from service.product.product_service import get_product_byId


router = APIRouter()


@router.post("/shop", response_model=ShopAssistantResponse)
def shop_assistant(payload: ShopAssistantRequest):
    query = payload.message.strip()
    db = SessionLocal()
    try:
        product = None
        if payload.product_id is not None:
            product = get_product_byId(db, payload.product_id)

        products, _ = product_service.get_products(db, q=query, page=1, page_size=4, sort="rating_desc")
        if product is None and products:
            product = products[0]

        lower_query = query.lower()
        wants_cart = any(word in lower_query for word in ["add", "buy", "cart", "order"])
        draft = None
        if wants_cart and product is not None and product.stock_quantity > 0:
            draft = CartDraft(
                product_id=product.id,
                quantity=1,
                rationale=f"{product.name} matches your request and is currently in stock.",
            )

        if product is not None:
            message = (
                f"{product.name} is a {product.brand or 'featured'} {product.category or 'product'} "
                f"priced at ${product.price:.2f}. Stock: {product.stock_quantity}. "
                f"{product.short_description or product.description or ''}"
            ).strip()
            if draft is not None:
                message += " I can prepare this as a cart draft for you to confirm."
        elif products:
            names = ", ".join(item.name for item in products)
            message = f"I found a few relevant products: {names}."
        else:
            message = "I could not find a matching product yet. Try a brand, category, or feature."

        return ShopAssistantResponse(message=message, cart_draft=draft)
    finally:
        db.close()
