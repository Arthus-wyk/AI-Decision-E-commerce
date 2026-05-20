from typing import Any, Dict, List

from pydantic import BaseModel, Field


class Session(BaseModel):
    user_id: str
    products: List[str]
    name:str


class CompareRequest(BaseModel):
    session_id: str = "default_session"
    user_query: str = ""
    user_profile: Dict[str, Any] = Field(default_factory=dict)
    products: List[Dict[str, Any]] = Field(default_factory=list)

class SessionLogRequest(BaseModel):
    session_id: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: str = "unknown"
    user_profile: Dict[str, Any] = Field(default_factory=dict)


class SessionMessageCreate(BaseModel):
    session_id: str
    role: str
    content: str
    extra: Dict[str, Any] = Field(default_factory=dict)


class AddProductRequest(BaseModel):
    session_id: str
    user_id:str
    product_id: str


class RemoveProductRequest(BaseModel):
    session_id: str
    product_id: str

class SammaryRequest(BaseModel):
    session_id: str