from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from db.session import get_db
from agent.graph import homie_graph
from agent.state import AgentState

chat_router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class AvailableGroup(BaseModel):
    group_id: str
    group_name: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    user_id: int
    available_groups: list[AvailableGroup] = []


class ChatResponse(BaseModel):
    response: str
    cart_suggestions: list[str] = []
    action_suggestions: list[dict] = []
    clarification: Optional[str] = None
    inferred_context: Optional[str] = None
    inferred_group_id: Optional[str] = None


@chat_router.post("", response_model=ChatResponse)
async def chat_with_homie(request: ChatRequest, db: Session = Depends(get_db)):
    initial_state: AgentState = {
        "messages": [{"role": m.role, "content": m.content} for m in request.messages],
        "user_id": request.user_id,
        "available_groups": [
            {"group_id": g.group_id, "group_name": g.group_name}
            for g in request.available_groups
        ],
        # Fields resolved during execution (initialised as None)
        "inferred_context": None,
        "inferred_group_id": None,
        "inferred_group_name": None,
        "intent": None,
        "entity": None,
        "fetched_data": None,
        # Output defaults
        "response": "",
        "action_suggestions": [],
        "cart_suggestions": [],
        "needs_clarification": False,
        "clarification_reason": None,
    }

    try:
        result = homie_graph.invoke(
            initial_state,
            config={"configurable": {"db": db}},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    return ChatResponse(
        response=result.get("response", ""),
        cart_suggestions=result.get("cart_suggestions") or [],
        action_suggestions=result.get("action_suggestions") or [],
        clarification=(
            result.get("clarification_reason")
            if result.get("needs_clarification")
            else None
        ),
        inferred_context=result.get("inferred_context"),
        inferred_group_id=result.get("inferred_group_id"),
    )
