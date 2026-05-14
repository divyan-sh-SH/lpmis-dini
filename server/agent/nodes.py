import json
import os
import re
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel

from agent.state import AgentState
from agent.prompts import (
    CLASSIFY_SYSTEM,
    GENERATE_SYSTEM_TEMPLATE,
    GENERAL_RESPONSE_SYSTEM,
    GREETING_SYSTEM,
    ACTION_PROTOCOL,
)
from models.db_models import Stock, Cart, Transaction, Note


_llm = ChatAnthropic(
    model="claude-haiku-4-5-20251001",
    api_key=os.environ.get("ANTHROPIC_API_KEY", ""),
    max_tokens=1500,
)


class Classification(BaseModel):
    inferred_context: str
    intent: str
    entity: Optional[str] = None
    needs_clarification: bool = False
    clarification_reason: Optional[str] = None
    inferred_group_name: Optional[str] = None
    inferred_group_id: Optional[str] = None


_classifier = _llm.with_structured_output(Classification)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_PERSONAL_WORDS = {
    "personal", "mydash", "my dash", "mine", "my own", "my personal",
    "personal dash", "myself", "my data",
}

_CLARIFICATION_TRIGGERS = [
    "personal mydash", "personal or", "or group", "which group",
    "are you asking about", "mydash or", "home group",
]


def _was_asking_clarification(assistant_content: str) -> bool:
    low = assistant_content.lower()
    return any(t in low for t in _CLARIFICATION_TRIGGERS)


def _try_resolve_clarification(state: AgentState) -> Optional[dict]:
    """
    Short-circuit: if the last assistant turn was a clarification request
    and the user's reply unambiguously resolves it, return the resolved
    classification dict without calling the LLM.
    """
    messages = state.get("messages", [])
    groups = state.get("available_groups", [])

    last_user = next((m for m in reversed(messages) if m["role"] == "user"), None)
    last_asst = next((m for m in reversed(messages) if m["role"] == "assistant"), None)

    if not last_user or not last_asst:
        return None
    if not _was_asking_clarification(last_asst["content"]):
        return None

    user_lower = last_user["content"].lower().strip()

    # Personal
    if user_lower in _PERSONAL_WORDS or any(p in user_lower for p in _PERSONAL_WORDS):
        return {
            "inferred_context": "personal",
            "intent": "query_data",
            "entity": None,
            "needs_clarification": False,
            "clarification_reason": None,
            "inferred_group_name": None,
            "inferred_group_id": None,
        }

    # Group by name match
    for g in groups:
        g_low = g["group_name"].lower()
        if g_low in user_lower or user_lower in g_low:
            return {
                "inferred_context": "group",
                "intent": "query_data",
                "entity": None,
                "needs_clarification": False,
                "clarification_reason": None,
                "inferred_group_name": g["group_name"],
                "inferred_group_id": g["group_id"],
            }

    return None


# ---------------------------------------------------------------------------
# Node: classify_intent
# ---------------------------------------------------------------------------

def classify_intent(state: AgentState) -> dict:
    # Fast path: clarification follow-up resolved without LLM
    shortcut = _try_resolve_clarification(state)
    if shortcut:
        return shortcut

    last_user_msg = next(
        (m for m in reversed(state["messages"]) if m["role"] == "user"),
        None,
    )
    if not last_user_msg:
        return {
            "inferred_context": "generic",
            "intent": "general_advice",
            "entity": None,
            "needs_clarification": False,
            "clarification_reason": None,
            "inferred_group_name": None,
            "inferred_group_id": None,
        }

    groups_info = (
        "\n".join(f"- {g['group_name']}" for g in state["available_groups"])
        if state["available_groups"]
        else "No groups available."
    )

    # Pass last 6 messages for context (enough to see clarification exchanges)
    recent = state["messages"][-6:]
    context_str = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in recent
    )

    system = CLASSIFY_SYSTEM.format(groups=groups_info)

    try:
        result: Classification = _classifier.invoke([
            SystemMessage(content=system),
            HumanMessage(
                content=f"Recent conversation:\n{context_str}\n\nClassify the last user message."
            ),
        ])
        return {
            "inferred_context": result.inferred_context,
            "intent": result.intent,
            "entity": result.entity,
            "needs_clarification": result.needs_clarification,
            "clarification_reason": result.clarification_reason,
            "inferred_group_name": result.inferred_group_name,
            "inferred_group_id": result.inferred_group_id,
        }
    except Exception:
        return {
            "inferred_context": "generic",
            "intent": "general_advice",
            "entity": None,
            "needs_clarification": False,
            "clarification_reason": None,
            "inferred_group_name": None,
            "inferred_group_id": None,
        }


# ---------------------------------------------------------------------------
# Node: resolve_context
# ---------------------------------------------------------------------------

def resolve_context(state: AgentState) -> dict:
    if state.get("inferred_context") != "group":
        return {}

    # Already resolved (classifier shortcut or LLM returned an id)
    if state.get("inferred_group_id"):
        return {}

    groups = state.get("available_groups") or []

    if not groups:
        return {
            "needs_clarification": True,
            "clarification_reason": "no_groups",
        }

    if len(groups) == 1:
        return {
            "inferred_group_id": groups[0]["group_id"],
            "inferred_group_name": groups[0]["group_name"],
        }

    # Multiple groups — try to match by inferred name
    inferred_name = (state.get("inferred_group_name") or "").lower().strip()
    if inferred_name:
        for g in groups:
            g_low = g["group_name"].lower()
            if inferred_name in g_low or g_low in inferred_name:
                return {
                    "inferred_group_id": g["group_id"],
                    "inferred_group_name": g["group_name"],
                }

    return {
        "needs_clarification": True,
        "clarification_reason": "multiple_groups",
    }


# ---------------------------------------------------------------------------
# Node: fetch_data
# ---------------------------------------------------------------------------

def fetch_data(state: AgentState, config: RunnableConfig) -> dict:
    db = config["configurable"]["db"]
    entity = state.get("entity")
    intent = state.get("intent")
    context = state.get("inferred_context", "personal")
    user_id = state["user_id"]
    group_id_str = state.get("inferred_group_id")

    cutoff = datetime.utcnow() - timedelta(days=15)
    fetched: dict = {}

    is_notes_query = entity == "note" or intent == "extract_todos"

    def _group_uuid() -> Optional[UUID]:
        try:
            return UUID(group_id_str) if group_id_str else None
        except (ValueError, TypeError):
            return None

    if context == "personal":
        if is_notes_query:
            notes = (
                db.query(Note)
                .filter(Note.user_id == user_id)
                .order_by(Note.date.desc())
                .limit(30)
                .all()
            )
            fetched["notes"] = _format_notes(notes)
        else:
            if entity in ("transaction", None):
                txs = (
                    db.query(Transaction)
                    .filter(Transaction.user_id == user_id, Transaction.date >= cutoff)
                    .order_by(Transaction.date.desc())
                    .all()
                )
                fetched["transactions"] = _format_transactions(txs)

            if entity in ("stock", None):
                stocks = db.query(Stock).filter(Stock.user_id == user_id).all()
                fetched["stocks"] = _format_stocks(stocks)

            if entity in ("cart", None):
                carts = db.query(Cart).filter(Cart.user_id == user_id).all()
                fetched["cart"] = _format_carts(carts)

    elif context == "group":
        group_uuid = _group_uuid()
        if not group_uuid:
            return {"fetched_data": {}}

        if is_notes_query:
            notes = (
                db.query(Note)
                .filter(Note.group_id == group_uuid)
                .order_by(Note.date.desc())
                .limit(30)
                .all()
            )
            fetched["notes"] = _format_notes(notes)
        else:
            if entity in ("transaction", None):
                txs = (
                    db.query(Transaction)
                    .filter(Transaction.group_id == group_uuid, Transaction.date >= cutoff)
                    .order_by(Transaction.date.desc())
                    .all()
                )
                fetched["transactions"] = _format_transactions(txs)

            if entity in ("stock", None):
                stocks = db.query(Stock).filter(Stock.group_id == group_uuid).all()
                fetched["stocks"] = _format_stocks(stocks)

            if entity in ("cart", None):
                carts = db.query(Cart).filter(Cart.group_id == group_uuid).all()
                fetched["cart"] = _format_carts(carts)

    return {"fetched_data": fetched}


def _format_transactions(txs) -> list[dict]:
    return [
        {
            "transaction_id": str(t.transaction_id),
            "date": t.date.strftime("%Y-%m-%d") if t.date else "",
            "type": t.type,
            "amount": t.amount,
            "description": t.description or "",
        }
        for t in txs
    ]


def _format_stocks(stocks) -> list[dict]:
    return [
        {
            "stock_id": str(s.stock_id),
            "item": s.stock_item,
            "quantity": s.quantity or "",
        }
        for s in stocks
    ]


def _format_carts(carts) -> list[dict]:
    return [
        {
            "cart_id": str(c.cart_id),
            "item": c.stock_item,
            "cost": c.cost,
            "store": c.store_name or "",
        }
        for c in carts
    ]


def _format_notes(notes) -> list[dict]:
    return [
        {
            "note_id": str(n.note_id),
            "date": n.date,
            "content": (n.content or "")[:800],  # cap very long notes
        }
        for n in notes
        if n.content
    ]


# ---------------------------------------------------------------------------
# Node: generate_response
# ---------------------------------------------------------------------------

def generate_response(state: AgentState) -> dict:
    fetched = state.get("fetched_data") or {}
    context = state.get("inferred_context", "personal")
    group_name = state.get("inferred_group_name") or ""
    intent = state.get("intent", "query_data")

    stocks = fetched.get("stocks", [])
    carts = fetched.get("cart", [])
    txs = fetched.get("transactions", [])
    notes = fetched.get("notes", [])

    stock_block = (
        "\n".join(
            f"- {s['item']}: {s['quantity'] or 'some'} (id: {s['stock_id']})"
            for s in stocks
        )
        if stocks
        else "No stocks recorded."
    )
    cart_block = (
        "\n".join(
            f"- {c['item']} @ Rs.{c['cost']} | store: {c['store'] or 'unknown'} (id: {c['cart_id']})"
            for c in carts
        )
        if carts
        else "No items in cart."
    )
    tx_block = (
        "\n".join(
            f"- [{t['date']}] {t['type'].upper()} Rs.{t['amount']} — {t['description']} (id: {t['transaction_id']})"
            for t in txs
        )
        if txs
        else "No transactions in the last 15 days."
    )
    notes_block = (
        "\n".join(
            f"[{n['date']}] {n['content']}"
            for n in notes
        )
        if notes
        else "No notes available."
    )

    context_label = f"Group: {group_name}" if context == "group" else "Personal (MyDash)"
    is_action = intent in ("action_add", "action_update", "action_remove")

    system = GENERATE_SYSTEM_TEMPLATE.format(
        context_label=context_label,
        stock_block=stock_block,
        cart_block=cart_block,
        tx_block=tx_block,
        notes_block=notes_block,
        action_protocol=ACTION_PROTOCOL if is_action else "",
    )

    lc_msgs: list = [SystemMessage(content=system)]
    for m in state["messages"]:
        if m["role"] == "user":
            lc_msgs.append(HumanMessage(content=m["content"]))
        elif m["role"] == "assistant":
            lc_msgs.append(AIMessage(content=m["content"]))

    try:
        resp = _llm.invoke(lc_msgs)
        return {"response": resp.content}
    except Exception as e:
        return {"response": f"Sorry, I couldn't generate a response right now. ({e})"}


# ---------------------------------------------------------------------------
# Node: build_action_cards
# ---------------------------------------------------------------------------

def build_action_cards(state: AgentState) -> dict:
    raw = state.get("response", "")
    user_id = state.get("user_id")
    context = state.get("inferred_context", "personal")
    group_id = state.get("inferred_group_id")

    # --- Parse CART_SUGGESTIONS ---
    cart_match = re.search(r"\nCART_SUGGESTIONS:([^\n]+)$", raw, re.MULTILINE)
    cart_suggestions: list[str] = []
    if cart_match:
        cart_suggestions = [
            s.strip() for s in cart_match.group(1).split(",") if s.strip()
        ]
        raw = raw[: cart_match.start()].strip()

    # --- Parse ACTION_SUGGESTIONS ---
    action_match = re.search(r"\nACTION_SUGGESTIONS:\s*(\[[\s\S]*?\])\s*$", raw)
    action_suggestions: list[dict] = []
    if action_match:
        try:
            parsed = json.loads(action_match.group(1))
            if isinstance(parsed, list):
                for card in parsed:
                    if isinstance(card, dict) and card.get("type") == "add":
                        data = card.get("data", {})
                        if context == "personal" and user_id:
                            data["user_id"] = user_id
                            data.pop("group_id", None)
                        elif context == "group" and group_id:
                            data["group_id"] = group_id
                            data.pop("user_id", None)
                        card["data"] = data
                action_suggestions = parsed
        except (json.JSONDecodeError, ValueError):
            action_suggestions = []
        raw = raw[: action_match.start()].strip()

    return {
        "response": raw.strip(),
        "action_suggestions": action_suggestions,
        "cart_suggestions": cart_suggestions,
    }


# ---------------------------------------------------------------------------
# Node: ask_clarification
# ---------------------------------------------------------------------------

def ask_clarification(state: AgentState) -> dict:
    reason = state.get("clarification_reason") or ""
    groups = state.get("available_groups") or []

    if reason == "no_groups":
        msg = (
            "You don't have any home groups yet. "
            "You can create one in MyHomeDash. "
            "Were you asking about your personal MyDash instead?"
        )
    elif reason == "multiple_groups":
        names = " or ".join(f"**{g['group_name']}**" for g in groups)
        msg = f"Which group did you mean — {names}?"
    else:
        if groups:
            names = " or ".join(f"**{g['group_name']}**" for g in groups)
            msg = f"Are you asking about your personal **MyDash** or one of your home groups ({names})?"
        else:
            msg = "Are you asking about your personal **MyDash** or a home group?"

    return {
        "response": msg,
        "action_suggestions": [],
        "cart_suggestions": [],
        "needs_clarification": True,
    }


# ---------------------------------------------------------------------------
# Node: general_response
# ---------------------------------------------------------------------------

def general_response(state: AgentState) -> dict:
    system = GENERAL_RESPONSE_SYSTEM
    lc_msgs: list = [SystemMessage(content=system)]
    for m in state["messages"]:
        if m["role"] == "user":
            lc_msgs.append(HumanMessage(content=m["content"]))
        elif m["role"] == "assistant":
            lc_msgs.append(AIMessage(content=m["content"]))

    try:
        resp = _llm.invoke(lc_msgs)
        raw = resp.content

        cart_match = re.search(r"\nCART_SUGGESTIONS:([^\n]+)$", raw, re.MULTILINE)
        cart_suggestions: list[str] = []
        if cart_match:
            cart_suggestions = [
                s.strip() for s in cart_match.group(1).split(",") if s.strip()
            ]
            raw = raw[: cart_match.start()].strip()

        return {
            "response": raw.strip(),
            "action_suggestions": [],
            "cart_suggestions": cart_suggestions,
        }
    except Exception as e:
        return {
            "response": f"Sorry, I couldn't respond right now. ({e})",
            "action_suggestions": [],
            "cart_suggestions": [],
        }


# ---------------------------------------------------------------------------
# Node: greeting_node
# ---------------------------------------------------------------------------

def greeting_node(state: AgentState) -> dict:
    lc_msgs: list = [SystemMessage(content=GREETING_SYSTEM)]
    last_user = next(
        (m for m in reversed(state["messages"]) if m["role"] == "user"),
        None,
    )
    if last_user:
        lc_msgs.append(HumanMessage(content=last_user["content"]))

    try:
        resp = _llm.invoke(lc_msgs)
        return {
            "response": resp.content,
            "action_suggestions": [],
            "cart_suggestions": [],
        }
    except Exception:
        return {
            "response": (
                "Hey there! I'm HomieAgent, your household management assistant. "
                "I can help you track finances, manage stocks, organise your cart, "
                "extract todos from notes, and more. What would you like to do?"
            ),
            "action_suggestions": [],
            "cart_suggestions": [],
        }
