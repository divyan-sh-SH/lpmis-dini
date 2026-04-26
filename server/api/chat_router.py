from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from db.session import get_db
from models.db_models import Stock, Cart
from anthropic_chat import chat_completion

chat_router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: str  # 'personal' or 'group'
    user_id: Optional[int] = None
    group_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str


@chat_router.post("", response_model=ChatResponse)
async def chat_with_homie(request: ChatRequest, db: Session = Depends(get_db)):
    stocks = []
    cart_items = []

    if request.context == "personal" and request.user_id:
        stocks = db.query(Stock).filter(Stock.user_id == request.user_id).all()
        cart_items = db.query(Cart).filter(Cart.user_id == request.user_id).all()
    elif request.context == "group" and request.group_id:
        try:
            group_uuid = UUID(request.group_id)
            stocks = db.query(Stock).filter(Stock.group_id == group_uuid).all()
            cart_items = db.query(Cart).filter(Cart.group_id == group_uuid).all()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid group_id format")

    context_label = "personal household" if request.context == "personal" else "group/shared household"
    stock_lines = (
        "\n".join([f"- {s.stock_item}: {s.quantity or 'some'}" for s in stocks])
        if stocks
        else "No stocks recorded yet."
    )
    cart_lines = (
        "\n".join([f"- {c.stock_item} (Rs. {c.cost})" for c in cart_items])
        if cart_items
        else "No items in cart."
    )

    system = f"""You are HomieAgent, a friendly AI assistant for the HomeDash household management app. Help users with meal planning, grocery shopping, and home management.

Context: {context_label}

Current stocks available:
{stock_lines}

Shopping cart:
{cart_lines}

When users ask about meals or cooking, suggest options based on what's in stock. Be concise, practical, and friendly. Use simple formatting."""

    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    try:
        response_text = chat_completion(messages, system=system)
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
