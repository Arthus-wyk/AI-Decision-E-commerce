from service.ai.graph_nodes import CompareState


def route_by_intent(state: CompareState) -> str:
    intent_result = state.get("intent_result", {}) or {}
    action = str(intent_result.get("action", "") or "").lower()
    if action == "qa":
        return "answer_question"
    return "validate_input"


def route_after_validation(state: CompareState) -> str:
    errors = state.get("errors", []) or []
    validated_products = state.get("validated_products", []) or []
    if errors or len(validated_products) < 2:
        return "build_not_comparable_result"
    return "prepare_product_context"


def route_by_comparability(state: CompareState) -> str:
    comparability_result = state.get("comparability_result", {}) or {}
    if comparability_result.get("is_comparable", False):
        return "analyze_user_needs"
    return "build_not_comparable_result"
