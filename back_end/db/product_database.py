from collections.abc import Generator

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime


SQLALCHEMY_DATABASE_URL = "sqlite:///./ecommerce.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    short_description = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    brand = Column(String, nullable=True, index=True)
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    rating = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_product_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_product_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
