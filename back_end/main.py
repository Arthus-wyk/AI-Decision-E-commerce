import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.ai import router as ai_router
from api.routes.admin import router as admin_router
from api.routes.cart import router as cart_router
from api.routes.order import router as order_router
from api.routes.product import router as product_router
from api.routes.user import router as user_router
from db.product_database import init_product_db
from db.sqlite_store import init_db


app = FastAPI(title="AI Decision E-commerce Backend")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3003")
frontend_origin = frontend_url.rstrip("/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_origin,
        frontend_origin.replace("localhost", "127.0.0.1"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)
app.include_router(product_router, prefix="/products", tags=["products"])
app.include_router(user_router, prefix="/users", tags=["users"])
app.include_router(cart_router, prefix="/cart", tags=["cart"])
app.include_router(order_router, tags=["orders"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])


@app.on_event("startup")
def startup_event():
    init_db()
    init_product_db()


@app.get("/")
def read_root():
    return {"message": "Backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
