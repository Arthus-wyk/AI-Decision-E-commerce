from langgraph.graph import StateGraph, START, END

from service.ai.grapg_routes import route_after_validation, route_by_comparability, route_by_intent
from service.ai.graph_nodes import CompareState, prepare_product_context, validate_input, judge_comparability, \
    build_not_comparable_result, analyze_user_needs, compare_and_recommend, validate_output, classify_intent, \
    answer_question
from service.ai.llm import LLMClient


def build_compare_graph(llm: LLMClient):
    builder = StateGraph(CompareState)

    builder.add_node("classify_intent", lambda state: classify_intent(state, llm))
    builder.add_node("answer_question", lambda state: answer_question(state, llm))
    builder.add_node("validate_input", validate_input)
    builder.add_node("prepare_product_context", prepare_product_context)
    builder.add_node("judge_comparability", lambda state: judge_comparability(state, llm))
    builder.add_node("build_not_comparable_result", build_not_comparable_result)
    builder.add_node("analyze_user_needs", lambda state: analyze_user_needs(state, llm))
    builder.add_node("compare_and_recommend", lambda state: compare_and_recommend(state, llm))
    builder.add_node("validate_output", validate_output)


    builder.add_edge(START, "classify_intent")
    builder.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "answer_question": "answer_question",
            "validate_input": "validate_input",
        },
    )
    builder.add_conditional_edges(
        "validate_input",
        route_after_validation,
        {
            "build_not_comparable_result": "build_not_comparable_result",
            "prepare_product_context": "prepare_product_context",
        },
    )
    builder.add_edge("prepare_product_context", "judge_comparability")
    builder.add_conditional_edges(
        "judge_comparability",
        route_by_comparability,
        {
            "build_not_comparable_result": "build_not_comparable_result",
            "analyze_user_needs": "analyze_user_needs",
        },
    )

    builder.add_edge("analyze_user_needs", "compare_and_recommend")
    builder.add_edge("compare_and_recommend", "validate_output")

    builder.add_edge("validate_output", END)
    builder.add_edge("build_not_comparable_result", END)
    builder.add_edge("answer_question", END)

    return builder.compile()
