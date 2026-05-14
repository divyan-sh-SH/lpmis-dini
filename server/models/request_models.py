from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID

from constants import UserRole

# --- USER MODELS ---
class UserCreate(BaseModel):
    user_id: int = Field(..., ge=1000000000, le=9999999999)
    username: str = Field(..., max_length=50)
    role: UserRole
    otp: int = Field(..., ge=1000, le=9999)

class UserValidate(BaseModel):
    user_id: int = Field(..., ge=1000000000, le=9999999999)
    otp: int = Field(..., ge=1000, le=9999)

class UserResponse(BaseModel):
    user_id: int
    username: str
    role: UserRole
    otp: int

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, max_length=50)
    role: Optional[UserRole] = None
    otp: Optional[int] = Field(None, ge=1000, le=9999)

# --- GROUP MODELS ---
class GroupCreate(BaseModel):
    users: List[int]  # Array of user IDs
    created_by: int   # User ID creating the group
    name: str

class GroupResponse(BaseModel):
    group_id: UUID
    group_name: str
    users: List[int]
    created_on: datetime
    created_by: int

    class Config:
        from_attributes = True

# --- STOCK MODELS ---
class StockCreate(BaseModel):
    stock_item: str
    quantity: Optional[str] = None
    category: Optional[str] = None
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None

class StockResponse(BaseModel):
    stock_id: UUID
    stock_item: str
    quantity: Optional[str] = None
    category: Optional[str] = None
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class StockUpdate(BaseModel):
    stock_item: Optional[str] = None
    quantity: Optional[str] = None
    category: Optional[str] = None

# --- CART MODELS ---
class CartItemCreate(BaseModel):
    stock_item: str
    store_name: Optional[str] = None
    quantity: Optional[str] = None
    cost: int
    description: Optional[str] = None
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None

class CartItemResponse(BaseModel):
    cart_id: UUID
    stock_item: str
    store_name: Optional[str] = None
    quantity: Optional[str] = None
    cost: int
    description: Optional[str] = None
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class CartItemUpdate(BaseModel):
    stock_item: Optional[str] = None
    store_name: Optional[str] = None
    quantity: Optional[str] = None
    cost: Optional[int] = None
    description: Optional[str] = None

# --- TRANSACTION MODELS ---
class TransactionCreate(BaseModel):
    amount: float
    description: Optional[str] = None
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None
    date: Optional[datetime] = None
    type: Optional[str] = None

class TransactionResponse(BaseModel):
    transaction_id: UUID
    amount: float
    description: Optional[str] = None
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None
    date: datetime
    type: str

    class Config:
        from_attributes = True

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    type: Optional[str] = None

# --- NOTES MODELS ---
class NoteCreate(BaseModel):
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None
    date: str  # YYYY-MM-DD
    content: str = ""

class NoteResponse(BaseModel):
    note_id: UUID
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None
    date: str
    content: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NoteUpdate(BaseModel):
    content: str

