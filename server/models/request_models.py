from typing import Literal, Optional
from pydantic import BaseModel

# --- Pydantic models ---
class TransactionCreate(BaseModel):
    date: str
    type: Literal["income", "expense"]
    amount: float
    description: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    date: str
    type: str
    amount: float
    description: Optional[str] = None


class CartItemCreate(BaseModel):
    itemName: str
    store: Optional[str] = None
    cost: float
    notes: Optional[str] = None


class CartItemResponse(BaseModel):
    id: int
    itemName: str
    store: Optional[str] = None
    cost: float
    notes: Optional[str] = None


class BuyCartBody(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None