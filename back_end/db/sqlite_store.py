import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                products_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                summary TEXT 
            )
            """
        )
        # Backward-compatible migration: older DBs may not have the `summary` column.
        columns = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(sessions)").fetchall()
        }
        if "summary" not in columns:
            conn.execute("ALTER TABLE sessions ADD COLUMN summary TEXT")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS compare_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_query TEXT NOT NULL,
                user_profile_json TEXT NOT NULL,
                products_json TEXT NOT NULL,
                final_result_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_compare_logs_session_id
            ON compare_logs(session_id)
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS session_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                extra_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_session_messages_session_id
            ON session_messages(session_id)
            """
        )

        conn.commit()


def create_session_record(session_id: str, user_id: str, products: List[Dict[str, Any]]) -> None:
    products_json = json.dumps(products, ensure_ascii=False)
    with _get_conn() as conn:
        conn.execute(
            """
            INSERT INTO sessions (session_id, user_id, products_json)
            VALUES (?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                user_id = excluded.user_id,
                products_json = excluded.products_json,
                summary = NULL
            """,
            (session_id, user_id, products_json),
        )
        conn.commit()


def _product_key(product: Dict[str, Any]) -> Optional[str]:
    for key in ("product_id", "id", "sku", "item_id"):
        value = product.get(key)
        if value not in (None, ""):
            return f"{key}:{value}"
    return None


def _product_identity_values(product: Dict[str, Any]) -> List[str]:
    values: List[str] = []
    for key in ("product_id", "id", "sku", "item_id"):
        value = product.get(key)
        if value not in (None, ""):
            values.append(str(value))
    return values


def add_products_to_session(session_id: str, products: List[Dict[str, Any]]) -> int:
    if not products:
        return 0

    current_session = get_session(session_id)
    if current_session is None:
        return 0

    existing_products = list(current_session.get("products", []) or [])
    merged_products = list(existing_products)
    added_count = 0

    existing_keys = {k for k in (_product_key(p) for p in existing_products) if k}
    for product in products:
        if not isinstance(product, dict) or not product:
            continue

        key = _product_key(product)
        if key and key in existing_keys:
            continue
        if key:
            existing_keys.add(key)
        merged_products.append(product)
        added_count += 1

    create_session_record(
        session_id=session_id,
        user_id=current_session.get("user_id", "unknown"),
        products=merged_products,
    )
    return added_count


def remove_products_from_session(session_id: str, product_ids: List[str]) -> int:
    target_ids = {str(pid) for pid in product_ids if str(pid).strip()}
    if not target_ids:
        return 0

    current_session = get_session(session_id)
    if current_session is None:
        return 0

    existing_products = list(current_session.get("products", []) or [])
    kept_products: List[Dict[str, Any]] = []
    removed_count = 0

    for product in existing_products:
        if not isinstance(product, dict):
            kept_products.append(product)
            continue

        identities = set(_product_identity_values(product))
        if identities.intersection(target_ids):
            removed_count += 1
            continue
        kept_products.append(product)

    if removed_count > 0:
        create_session_record(
            session_id=session_id,
            user_id=current_session.get("user_id", "unknown"),
            products=kept_products,
        )

    return removed_count


def get_sessions_list(user_id: str) -> List[Dict[str, Any]]:
    with _get_conn() as conn:
        rows = conn.execute(
            """
            SELECT session_id, user_id, products_json, created_at, summary
            FROM sessions
            WHERE user_id = ?
            """,
            (user_id,),
        ).fetchall()
        return [
            {
                "session_id": row["session_id"],
                "user_id": row["user_id"],
                "products": json.loads(row["products_json"]),
                "created_at": row["created_at"],
                "summary": row["summary"],
            }
            for row in rows
        ]


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    with _get_conn() as conn:
        row = conn.execute(
            """
            SELECT session_id, user_id, products_json, created_at, summary
            FROM sessions
            WHERE session_id = ?
            """,
            (session_id,),
        ).fetchone()
        if row is None:
            return None
        return {
            "session_id": row["session_id"],
            "user_id": row["user_id"],
            "products": json.loads(row["products_json"]),
            "created_at": row["created_at"],
            "summary": row["summary"],
        }


def set_session_summary(session_id: str, summary: str) -> bool:
    with _get_conn() as conn:
        rowcount = conn.execute(
            """
            UPDATE sessions
            SET summary = ?
            WHERE session_id = ?
            """,
            (summary, session_id),
        ).rowcount
        conn.commit()
        return bool(rowcount)


def save_compare_log(
        session_id: str,
        user_query: str,
        user_profile: Dict[str, Any],
        products: List[Dict[str, Any]],
        final_result: Dict[str, Any],
) -> None:
    with _get_conn() as conn:
        conn.execute(
            """
            INSERT INTO compare_logs (
                session_id,
                user_query,
                user_profile_json,
                products_json,
                final_result_json
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                session_id,
                user_query,
                json.dumps(user_profile, ensure_ascii=False),
                json.dumps(products, ensure_ascii=False),
                json.dumps(final_result, ensure_ascii=False),
            ),
        )
        conn.commit()
def get_compare_log(session_id: str) -> dict | None:
    with _get_conn() as conn:
        cursor = conn.execute(
            """
            SELECT
                session_id,
                user_query,
                user_profile_json,
                products_json,
                final_result_json
            FROM compare_logs
            WHERE session_id = ?
            """,
            (session_id,)
        )

        row = cursor.fetchone()

        if not row:
            return None

        return {
            "session_id": row[0],
            "user_query": row[1],
            "user_profile": json.loads(row[2]),
            "products": json.loads(row[3]),
            "final_result": json.loads(row[4]),
        }

def get_latest_compare_result(session_id: str) -> Optional[Dict[str, Any]]:
    with _get_conn() as conn:
        row = conn.execute(
            """
            SELECT final_result_json
            FROM compare_logs
            WHERE session_id = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (session_id,),
        ).fetchone()
        if row is None:
            return None
        return json.loads(row["final_result_json"])


def save_session_message(
        session_id: str,
        role: str,
        content: str,
        extra: Optional[Dict[str, Any]] = None,
) -> None:
    with _get_conn() as conn:
        conn.execute(
            """
            INSERT INTO session_messages (session_id, role, content, extra_json)
            VALUES (?, ?, ?, ?)
            """,
            (
                session_id,
                role,
                content,
                json.dumps(extra or {}, ensure_ascii=False),
            ),
        )
        conn.commit()


def get_session_messages(session_id: str) -> List[Dict[str, Any]]:
    with _get_conn() as conn:
        rows = conn.execute(
            """
            SELECT id, session_id, role, content, extra_json, created_at
            FROM session_messages
            WHERE session_id = ?
            ORDER BY id ASC
            """,
            (session_id,),
        ).fetchall()
        return [
            {
                "id": row["id"],
                "session_id": row["session_id"],
                "role": row["role"],
                "content": row["content"],
                "extra": json.loads(row["extra_json"]),
                "created_at": row["created_at"],
            }
            for row in rows
        ]


def delete_session(session_id: str) -> Dict[str, int]:
    with _get_conn() as conn:
        compare_deleted = conn.execute(
            """
            DELETE FROM compare_logs
            WHERE session_id = ?
            """,
            (session_id,),
        ).rowcount
        messages_deleted = conn.execute(
            """
            DELETE FROM session_messages
            WHERE session_id = ?
            """,
            (session_id,),
        ).rowcount
        session_deleted = conn.execute(
            """
            DELETE FROM sessions
            WHERE session_id = ?
            """,
            (session_id,),
        ).rowcount
        conn.commit()

    return {
        "session_deleted": int(session_deleted or 0),
        "messages_deleted": int(messages_deleted or 0),
        "compare_logs_deleted": int(compare_deleted or 0),
    }
