from __future__ import annotations
import math
import re
from typing import Any, Dict, List, Optional, TypedDict


DEFAULT_WEIGHTS = {
    "price": 0.30,
    "battery_life": 0.25,
    "weight": 0.20,
    "performance": 0.15,
    "brand": 0.10,
}



from typing import Any, Dict, List, Optional


def _safe_str(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _safe_product_id(product: Dict[str, Any], idx: int) -> str:
    for key in ("product_id", "id", "sku", "item_id"):
        if key in product and product[key] not in (None, ""):
            return str(product[key])
    return f"product_{idx}"


def _safe_product_name(product: Dict[str, Any], idx: int) -> str:
    for key in ("name", "title", "product_name", "item_name"):
        if key in product and product[key] not in (None, ""):
            return str(product[key])
    return f"Product {idx}"


def _trim_large_values(product: Dict[str, Any], max_value_len: int = 300) -> Dict[str, Any]:
    """
    避免把超长 HTML / description / blob 直接塞给 LLM
    """
    cleaned: Dict[str, Any] = {}
    for k, v in product.items():
        if v is None:
            continue

        if isinstance(v, (dict, list)):
            text = str(v)
            if len(text) <= max_value_len:
                cleaned[k] = v
            else:
                cleaned[k] = text[:max_value_len] + "...[truncated]"
            continue

        text = str(v)
        if len(text) <= max_value_len:
            cleaned[k] = v
        else:
            cleaned[k] = text[:max_value_len] + "...[truncated]"

    return cleaned


def _drop_noisy_fields(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    丢掉明显不适合比较、且容易污染 prompt 的字段
    """
    noisy_keys = {
        "html",
        "description_html",
        "raw_html",
        "embedding",
        "vector",
        "image_blob",
        "binary",
        "base64",
        "cookie",
        "session",
        "tracking_data",
        "internal_debug",
    }
    return {k: v for k, v in product.items() if k not in noisy_keys}


def _normalize_product_for_llm(product: Dict[str, Any], idx: int) -> Dict[str, Any]:
    """
    不做固定字段映射，只做轻量清洗和包装
    """
    p = _drop_noisy_fields(product)
    p = _trim_large_values(p)

    product_id = p['product_id']
    name = p['name']

    attributes = dict(p)
    attributes.pop("product_id", None)
    attributes.pop("id", None)
    attributes.pop("sku", None)
    attributes.pop("item_id", None)
    attributes.pop("name", None)
    attributes.pop("title", None)
    attributes.pop("product_name", None)
    attributes.pop("item_name", None)

    return {
        "product_id": product_id,
        "name": name,
        "attributes": attributes,
    }


def _product_ids(products: List[Dict[str, Any]]) -> List[str]:
    return [str(p["product_id"]) for p in products if "product_id" in p]


def _product_map(products: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    return {str(p["product_id"]): p for p in products}