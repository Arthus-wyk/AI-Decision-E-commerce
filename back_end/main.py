from fastapi import FastAPI
from api.routes.ai import router as ai_router
from db.sqlite_store import init_db

app = FastAPI()
app.include_router(ai_router)


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def read_root():
    return {"message": "Backend is running"}
