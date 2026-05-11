from langgraph.graph import StateGraph, END

from agent.state import AgentState
from agent.nodes import (
    classify_intent,
    resolve_context,
    fetch_data,
    generate_response,
    build_action_cards,
    ask_clarification,
    general_response,
)


def _route_after_classify(state: AgentState) -> str:
    if state.get("needs_clarification"):
        return "ask_clarification"
    context = state.get("inferred_context", "generic")
    if context == "generic":
        return "general_response"
    if context == "unclear":
        return "ask_clarification"
    # personal or group — proceed to resolve + fetch
    return "resolve_context"


def _route_after_resolve(state: AgentState) -> str:
    if state.get("needs_clarification"):
        return "ask_clarification"
    return "fetch_data"


def _build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("classify_intent", classify_intent)
    graph.add_node("resolve_context", resolve_context)
    graph.add_node("fetch_data", fetch_data)
    graph.add_node("generate_response", generate_response)
    graph.add_node("build_action_cards", build_action_cards)
    graph.add_node("ask_clarification", ask_clarification)
    graph.add_node("general_response", general_response)

    graph.set_entry_point("classify_intent")

    graph.add_conditional_edges(
        "classify_intent",
        _route_after_classify,
        {
            "resolve_context": "resolve_context",
            "ask_clarification": "ask_clarification",
            "general_response": "general_response",
        },
    )

    graph.add_conditional_edges(
        "resolve_context",
        _route_after_resolve,
        {
            "fetch_data": "fetch_data",
            "ask_clarification": "ask_clarification",
        },
    )

    graph.add_edge("fetch_data", "generate_response")
    graph.add_edge("generate_response", "build_action_cards")
    graph.add_edge("build_action_cards", END)
    graph.add_edge("ask_clarification", END)
    graph.add_edge("general_response", END)

    return graph.compile()


homie_graph = _build_graph()
