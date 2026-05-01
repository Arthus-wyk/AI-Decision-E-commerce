
from typing import Any, Dict, List, Optional, TypedDict

from service.ai.llm import LLMClient
from service.ai.utils import _safe_product_name, _safe_product_id, _normalize_product_for_llm, _product_ids


class CompareState(TypedDict, total=False):
    # input
    session_id: str
    user_query: str
    user_profile: Dict[str, Any]
    raw_products: List[Dict[str, Any]]
    chat_history: List[Dict[str, Any]]
    latest_compare_result: Dict[str, Any]
    force_recompare: bool

    # intermediate
    intent_result: Dict[str, Any]
    validated_products: List[Dict[str, Any]]
    prepared_products: List[Dict[str, Any]]

    comparability_result: Dict[str, Any]
    user_need_analysis: Dict[str, Any]
    recommendation_result: Dict[str, Any]

    warnings: List[str]
    errors: List[str]

    # output
    final_result: Dict[str, Any]


INTENT_SYSTEM_PROMPT = """
You are an intent router for shopping assistant chat.

Decide whether the user message should:
1) "qa": answer based on existing comparison context, no re-comparison.
2) "recompare": run a fresh comparison/recommendation flow.

Rules:
- Choose "qa" for explanation, follow-up questions, clarifications, details about existing result.
- Choose "recompare" when user changes constraints/preferences/decision goals,
  asks to compare again, asks for a new recommendation, or product set changed.
- If no previous comparison exists, prefer "recompare".
- Return JSON only.

Return format:
{
  "action": "qa",
  "reason": "short reason"
}
"""


def classify_intent(state: CompareState, llm: LLMClient) -> Dict[str, Any]:
    if bool(state.get("force_recompare", False)):
        return {"intent_result": {"action": "recompare", "reason": "forced by caller"}}

    latest_compare_result = state.get("latest_compare_result", {}) or {}
    if not latest_compare_result:
        return {"intent_result": {"action": "recompare", "reason": "no previous compare result"}}

    payload = {
        "user_query": state.get("user_query", "") or "",
        "user_profile": state.get("user_profile", {}) or {},
        "has_products": len(state.get("raw_products", []) or []) > 0,
        "has_previous_compare": True,
        "latest_compare_summary": latest_compare_result.get("summary", ""),
        "recent_chat": (state.get("chat_history", []) or [])[-6:],
    }

    result = llm.invoke_json(INTENT_SYSTEM_PROMPT, payload)
    action = str(result.get("action", "") or "").lower()
    if action not in {"qa", "recompare"}:
        action = "recompare"

    return {
        "intent_result": {
            "action": action,
            "reason": str(result.get("reason", "") or ""),
        }
    }


QA_SYSTEM_PROMPT = """
You are a shopping assistant in a multi-turn chat.

Answer the user's question using existing comparison context.
Do NOT create a fresh comparison in this step.
Be concise and practical.
Return JSON only.

Return format:
{
  "answer": "direct helpful answer"
}
"""


def answer_question(state: CompareState, llm: LLMClient) -> Dict[str, Any]:
    latest_compare_result = state.get("latest_compare_result", {}) or {}
    if not latest_compare_result:
        return {
            "final_result": {
                "mode": "qa",
                "summary": "I do not have a previous comparison result yet. Please run a comparison first.",
                "answer": "I do not have a previous comparison result yet. Please run a comparison first.",
                "winner": None,
                "warnings": state.get("warnings", []) or [],
                "errors": state.get("errors", []) or [],
            }
        }

    payload = {
        "user_query": state.get("user_query", "") or "",
        "user_profile": state.get("user_profile", {}) or {},
        "latest_compare_result": latest_compare_result,
        "recent_chat": (state.get("chat_history", []) or [])[-8:],
    }
    result = llm.invoke_json(QA_SYSTEM_PROMPT, payload)
    answer = str(result.get("answer", "") or "").strip()
    if not answer:
        answer = "Based on the previous comparison, the current winner still looks most suitable."

    return {
        "final_result": {
            "mode": "qa",
            "summary": answer,
            "answer": answer,
            "winner": latest_compare_result.get("winner"),
            "reference": latest_compare_result,
            "warnings": state.get("warnings", []) or [],
            "errors": state.get("errors", []) or [],
        }
    }



def validate_input(state: CompareState) -> Dict[str, Any]:
    raw_products = state.get("raw_products", []) or []
    warnings: List[str] = list(state.get("warnings", []))
    errors: List[str] = []

    if not isinstance(raw_products, list):
        return {
            "validated_products": [],
            "warnings": warnings,
            "errors": ["raw_products must be a list of product dicts."]
        }

    validated_products: List[Dict[str, Any]] = []

    for idx, product in enumerate(raw_products, start=1):
        if not isinstance(product, dict) or not product:
            warnings.append(f"Product at index {idx} is empty or invalid and was skipped.")
            continue

        normalized = dict(product)
        normalized["product_id"] = _safe_product_id(product, idx)
        normalized["name"] = _safe_product_name(product, idx)

        validated_products.append(normalized)

    if len(validated_products) < 2:
        errors.append("At least 2 valid products are required for comparison.")

    return {
        "validated_products": validated_products,
        "warnings": warnings,
        "errors": errors,
    }

def prepare_product_context(state: CompareState) -> Dict[str, Any]:
    products = state.get("validated_products", []) or []
    warnings: List[str] = list(state.get("warnings", []))

    prepared_products: List[Dict[str, Any]] = []

    for idx, product in enumerate(products, start=1):
        prepared = _normalize_product_for_llm(product, idx)
        prepared_products.append(prepared)

        if len(prepared["attributes"]) == 0:
            warnings.append(
                f"{prepared['name']} has no usable attribute fields after cleanup."
            )

    return {
        "prepared_products": prepared_products,
        "warnings": warnings,
    }

COMPARABILITY_SYSTEM_PROMPT = """
You are a strict product-comparison judge.

Your task is to determine whether a set of products can be compared fairly and meaningfully.

Rules:
1. Only mark products as comparable if they are in the same or a closely related category,
   and they share enough functional purpose and meaningful attributes for comparison.
2. If the products are from clearly different categories, uses, or decision contexts,
   mark them as not comparable.
3. Be conservative. If comparison quality is weak, prefer not_comparable or low-confidence comparable.
4. Do not invent missing fields. Base your judgment only on the given product data.
5. Return JSON only.

Return format:
{
  "is_comparable": true,
  "confidence": 0.0,
  "reason": "short explanation",
  "common_aspects": ["..."],
  "comparison_risks": ["..."]
}
"""

def judge_comparability(state: CompareState, llm: LLMClient) -> Dict[str, Any]:
    prepared_products = state.get("prepared_products", []) or []
    warnings: List[str] = list(state.get("warnings", []))

    if len(prepared_products) < 2:
        return {
            "comparability_result": {
                "is_comparable": False,
                "confidence": 1.0,
                "reason": "Less than 2 products available for comparison.",
                "common_aspects": [],
                "comparison_risks": ["Insufficient product count."]
            },
            "warnings": warnings,
        }

    payload = {
        "products": prepared_products
    }

    result = llm.invoke_json(COMPARABILITY_SYSTEM_PROMPT, payload)

    # 基础兜底
    comparability_result = {
        "is_comparable": bool(result.get("is_comparable", False)),
        "confidence": float(result.get("confidence", 0.0) or 0.0),
        "reason": str(result.get("reason", "") or ""),
        "common_aspects": result.get("common_aspects", []) or [],
        "comparison_risks": result.get("comparison_risks", []) or [],
    }

    if not isinstance(comparability_result["common_aspects"], list):
        comparability_result["common_aspects"] = []
    if not isinstance(comparability_result["comparison_risks"], list):
        comparability_result["comparison_risks"] = []

    return {
        "comparability_result": comparability_result,
        "warnings": warnings,
    }

def build_not_comparable_result(state: CompareState) -> Dict[str, Any]:
    comparability_result = state.get("comparability_result", {}) or {}
    warnings = state.get("warnings", []) or []
    errors = state.get("errors", []) or []

    final_result = {
        "comparable": False,
        "message": "These products are too different to compare fairly.",
        "reason": comparability_result.get("reason", ""),
        "common_aspects": comparability_result.get("common_aspects", []),
        "comparison_risks": comparability_result.get("comparison_risks", []),
        "winner": None,
        "recommendation_reason": [],
        "differences": [],
        "persona_fit": {},
        "warnings": warnings,
        "errors": errors,
    }

    return {"final_result": final_result}

USER_NEEDS_SYSTEM_PROMPT = """
You are a shopping decision assistant.

Your task is to analyze user needs for product comparison and recommendation.

Rules:
1. Infer the user's constraints, preferences, and decision focus from the provided query and profile.
2. Be faithful to the input. Do not invent very specific preferences that are not implied.
3. Keep the output compact and structured.
4. Return JSON only.

Return format:
{
  "user_intent": "short summary",
  "constraints": ["..."],
  "preferences": ["..."],
  "decision_focus": ["..."],
  "uncertainties": ["..."]
}
"""

def analyze_user_needs(state: CompareState, llm: LLMClient) -> Dict[str, Any]:
    user_query = state.get("user_query", "") or ""
    user_profile = state.get("user_profile", {}) or {}

    payload = {
        "user_query": user_query,
        "user_profile": user_profile,
    }

    result = llm.invoke_json(USER_NEEDS_SYSTEM_PROMPT, payload)

    user_need_analysis = {
        "user_intent": str(result.get("user_intent", "") or ""),
        "constraints": result.get("constraints", []) or [],
        "preferences": result.get("preferences", []) or [],
        "decision_focus": result.get("decision_focus", []) or [],
        "uncertainties": result.get("uncertainties", []) or [],
    }

    if not isinstance(user_need_analysis["constraints"], list):
        user_need_analysis["constraints"] = []
    if not isinstance(user_need_analysis["preferences"], list):
        user_need_analysis["preferences"] = []
    if not isinstance(user_need_analysis["decision_focus"], list):
        user_need_analysis["decision_focus"] = []
    if not isinstance(user_need_analysis["uncertainties"], list):
        user_need_analysis["uncertainties"] = []

    return {"user_need_analysis": user_need_analysis}

RECOMMENDATION_SYSTEM_PROMPT = """
You are a careful shopping comparison and recommendation assistant.

Your task:
1. Compare the given products only if they are already judged comparable.
2. Use the product attributes and the analyzed user needs to decide which product is the best fit.
3. Focus on meaningful trade-offs relevant to the user's constraints and preferences.
4. Do not invent attributes that are not present.
5. If evidence is weak or partially missing, mention uncertainty explicitly.
6. Return JSON only.

Return format:
{
  "best_product_id": "product id",
  "summary": "short recommendation summary",
  "why": ["..."],
  "differences": [
    {
      "aspect": "aspect name",
      "description": "difference description"
    }
  ],
  "persona_fit": {
    "product_id_1": "who this suits",
    "product_id_2": "who this suits"
  },
  "uncertainty": ["..."]
}
"""

def compare_and_recommend(state: CompareState, llm: LLMClient) -> Dict[str, Any]:
    prepared_products = state.get("prepared_products", []) or []
    comparability_result = state.get("comparability_result", {}) or {}
    user_need_analysis = state.get("user_need_analysis", {}) or {}
    warnings: List[str] = list(state.get("warnings", []))

    payload = {
        "comparability_result": comparability_result,
        "user_need_analysis": user_need_analysis,
        "products": prepared_products,
    }

    result = llm.invoke_json(RECOMMENDATION_SYSTEM_PROMPT, payload)

    recommendation_result = {
        "best_product_id": str(result.get("best_product_id", "") or ""),
        "summary": str(result.get("summary", "") or ""),
        "why": result.get("why", []) or [],
        "differences": result.get("differences", []) or [],
        "persona_fit": result.get("persona_fit", {}) or {},
        "uncertainty": result.get("uncertainty", []) or [],
    }

    if not isinstance(recommendation_result["why"], list):
        recommendation_result["why"] = []
    if not isinstance(recommendation_result["differences"], list):
        recommendation_result["differences"] = []
    if not isinstance(recommendation_result["persona_fit"], dict):
        recommendation_result["persona_fit"] = {}
    if not isinstance(recommendation_result["uncertainty"], list):
        recommendation_result["uncertainty"] = []

    return {
        "recommendation_result": recommendation_result,
        "warnings": warnings,
    }

def validate_output(state: CompareState) -> Dict[str, Any]:
    prepared_products = state.get("prepared_products", []) or []
    comparability_result = state.get("comparability_result", {}) or {}
    user_need_analysis = state.get("user_need_analysis", {}) or {}
    recommendation_result = state.get("recommendation_result", {}) or {}
    warnings: List[str] = list(state.get("warnings", []))
    errors: List[str] = list(state.get("errors", []))

    product_ids = set(_product_ids(prepared_products))
    comparable = bool(comparability_result.get("is_comparable", False))

    best_product_id = recommendation_result.get("best_product_id")
    if best_product_id and best_product_id not in product_ids:
        warnings.append(
            f"Recommended product_id '{best_product_id}' is not in the input products."
        )
        best_product_id = None

    if not comparable:
        best_product_id = None
        recommendation_result["why"] = []
        recommendation_result["differences"] = []
        recommendation_result["persona_fit"] = {}

    final_result = {
        "comparable": comparable,
        "comparability": comparability_result,
        "user_need_analysis": user_need_analysis,
        "winner": best_product_id,
        "summary": recommendation_result.get("summary", ""),
        "recommendation_reason": recommendation_result.get("why", []),
        "differences": recommendation_result.get("differences", []),
        "persona_fit": recommendation_result.get("persona_fit", {}),
        "uncertainty": recommendation_result.get("uncertainty", []),
        "warnings": warnings,
        "errors": errors,
    }

    return {
        "final_result": final_result,
        "warnings": warnings,
        "errors": errors,
    }
