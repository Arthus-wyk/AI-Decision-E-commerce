from fastapi import APIRouter, HTTPException
from uuid import uuid4
from db.product_database import SessionLocal
from db.sqlite_store import (
    add_product_to_session,
    create_session_record,
    delete_session,
    get_latest_compare_result,
    get_session,
    get_session_messages,
    remove_products_from_session,
    save_compare_log,
    save_session_message,
    get_sessions_list,
    set_session_summary, get_compare_log,
)
from schemas.ai import AddProductRequest, ChatRequest, CompareRequest, RemoveProductRequest, Session, \
    SessionMessageCreate, SammaryRequest, SessionLogRequest
from service.ai.graph import build_compare_graph
from service.ai.llm import LLMClient
from service.ai.sammary import summary
from service.product.product_service import get_product_byId

router = APIRouter()

llm_client = LLMClient()
compare_graph = build_compare_graph(llm_client)


def _run_compare(
        session_id: str,
        user_query: str,
        user_profile: dict,
        products: list,
        chat_history: list | None = None,
        latest_compare_result: dict | None = None,
        force_recompare: bool = False,
):
    products_list = []
    db = SessionLocal()
    try:
        for product in products:
            res = get_product_byId(db, product)
            products_list.append(res)
    finally:
        db.close()

    initial_state = {
        "session_id": session_id,
        "user_query": user_query,
        "user_profile": user_profile,
        "raw_products": products_list,
        "chat_history": chat_history or [],
        "latest_compare_result": latest_compare_result or {},
        "force_recompare": force_recompare,
    }
    result_state = compare_graph.invoke(initial_state)
    final_result = result_state.get("final_result")
    if final_result is None:
        raise HTTPException(status_code=500, detail="Compare graph did not return final_result.")
    return final_result


@router.post("/create_session")
def create_session(payload: Session):
    session_id = str(uuid4())
    try:
        create_session_record(
            session_id=session_id,
            user_id=payload.user_id,
            products=payload.products,
            count=1,
            name=payload.name
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Create session failed: {exc}")

    return {
        "message": "session saved",
        "session_id": session_id,
    }


@router.get("/sessions")
def get_sessions(user_id: str):
    try:
        sessions = get_sessions_list(user_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"get sessions failed: {exc}")

    return {
        "user_id": user_id,
        "sessions": sessions
    }


@router.post("/add_product")
def add_product(payload: AddProductRequest):
    try:
        if get_session(payload.session_id) is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        added_count = add_product_to_session(payload.session_id, payload.product_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Add product failed: {exc}")

    return {
        "message": "products added",
        "session_id": payload.session_id,
        "added_count": added_count,
    }


@router.post("/remove_product")
def remove_product(payload: RemoveProductRequest):
    try:
        if get_session(payload.session_id) is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        removed_count = remove_products_from_session(payload.session_id, payload.product_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Remove product failed: {exc}")

    return {
        "message": "products removed",
        "session_id": payload.session_id,
        "removed_count": removed_count,
    }


@router.post("/messages")
def create_message(payload: SessionMessageCreate):
    try:
        if get_session(payload.session_id) is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        save_session_message(
            session_id=payload.session_id,
            role=payload.role,
            content=payload.content,
            extra=payload.extra,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Create message failed: {exc}")
    return {"message": "saved"}


@router.get("/sessions/{session_id}")
def get_session_details(session_id: str):
    try:
        session = get_session(session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"List messages failed: {exc}")
    return {"session": session}


@router.delete("/sessions/{session_id}")
def delete_session_api(session_id: str):
    try:
        if get_session(session_id) is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        deleted = delete_session(session_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Delete session failed: {exc}")

    return {
        "message": "session deleted",
        "session_id": session_id,
        **deleted,
    }


@router.get("/sessions/{session_id}/messages")
def list_messages(session_id: str):
    try:
        if get_session(session_id) is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        messages = get_session_messages(session_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"List messages failed: {exc}")
    return {"session_id": session_id, "messages": messages}

@router.post("/session_logs")
def logs(payload:SessionLogRequest):
    try:
        current_log = get_compare_log(payload.session_id)
        if current_log is None:
            raise HTTPException(status_code=404, detail="Log not found.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"List messages failed: {exc}")
    return {"session_id": payload.session_id, "logs": current_log}

@router.post("/chat")
def chat(payload: ChatRequest):
    try:
        current_session = get_session(payload.session_id)
        if current_session is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        current_products = current_session.get("products", []) or []
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Session preparation failed: {exc}")

    try:
        save_session_message(
            session_id=payload.session_id,
            role="user",
            content=payload.message,
            extra={"user_profile": payload.user_profile},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Save user message failed: {exc}")

    try:
        chat_history = get_session_messages(payload.session_id)
        latest_compare_result = get_latest_compare_result(payload.session_id) or {}
        final_result = _run_compare(
            session_id=payload.session_id,
            user_query=payload.message,
            user_profile=payload.user_profile,
            products=current_products,
            chat_history=chat_history,
            latest_compare_result=latest_compare_result,
            force_recompare=False,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Compare graph execution failed: {exc}")

    try:
        if final_result.get("mode") != "qa":
            save_compare_log(
                session_id=payload.session_id,
                user_query=payload.message,
                user_profile=payload.user_profile,
                products=current_products,
                final_result=final_result,
            )
        save_session_message(
            session_id=payload.session_id,
            role="assistant",
            content=final_result.get("message", "") or "comparison completed",
            extra={"final_result": final_result},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Save chat result failed: {exc}")

    return {
        "session_id": payload.session_id,
        "reply": final_result,
    }


@router.post("/compare")
def products_compare(payload: CompareRequest):
    try:
        if get_session(payload.session_id) is None:
            raise HTTPException(status_code=500, detail=f"Session not found")

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Session preparation failed: {exc}")

    try:
        final_result = _run_compare(
            session_id=payload.session_id,
            user_query=payload.user_query,
            user_profile=payload.user_profile,
            products=payload.products,
            force_recompare=True,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Compare graph execution failed: {exc}")

    try:
        save_compare_log(
            session_id=payload.session_id,
            user_query=payload.user_query,
            user_profile=payload.user_profile,
            products=payload.products,
            final_result=final_result,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Compare log save failed: {exc}")

    return final_result


@router.post("/summary")
def get_product_summary(payload:SammaryRequest):
    try:
        current_session = get_session(payload.session_id)
        if current_session is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        current_summary = (current_session.get("summary") or "").strip()
        if current_summary != "":
            return {"data": current_summary}
        current_products = current_session.get("products", []) or []
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Session preparation failed: {exc}")

    try:
        res = summary(current_products)
        try:
            set_session_summary(payload.session_id, res)
        except Exception:
            pass
        return {"data": res}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Compare graph execution failed: {exc}")
