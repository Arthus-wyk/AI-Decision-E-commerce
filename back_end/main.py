from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.ai import router as ai_router
from api.routes.product import router as product_router
from db.product_database import init_product_db
from db.sqlite_store import init_db


app = FastAPI(title="AI Decision E-commerce Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)
app.include_router(product_router, prefix="/products", tags=["products"])


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
