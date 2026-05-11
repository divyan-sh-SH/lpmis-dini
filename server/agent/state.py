from typing import TypedDict, Optional


class AgentState(TypedDict):
    # --- Input (sent from client) ---
    messages: list[dict]          # [{role: user|assistant, content: str}]
    user_id: int
    available_groups: list[dict]  # [{group_id: str, group_name: str}]

    # --- Resolved during graph execution ---
    inferred_context: Optional[str]    # 'personal' | 'group' | 'generic' | 'unclear'
    inferred_group_id: Optional[str]   # UUID string if group context resolved
    inferred_group_name: Optional[str] # matched group name for display
    intent: Optional[str]              # see Intent values below
    entity: Optional[str]              # 'transaction' | 'stock' | 'cart' | None
    fetched_data: Optional[dict]       # DB results packaged for the LLM

    # --- Output ---
    response: str
    action_suggestions: list[dict]   # parsed ACTION_SUGGESTIONS cards
    cart_suggestions: list[str]      # parsed CART_SUGGESTIONS items
    needs_clarification: bool
    clarification_reason: Optional[str]


# Intent values (used as string constants)
class Intent:
    QUERY_DATA     = "query_data"
    ACTION_ADD     = "action_add"
    ACTION_UPDATE  = "action_update"
    ACTION_REMOVE  = "action_remove"
    GENERAL_ADVICE = "general_advice"
    CLARIFY        = "clarify"
