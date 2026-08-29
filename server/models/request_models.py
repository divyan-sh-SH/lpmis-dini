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


# --- HABIT MODELS ---
class HabitCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    frequency: str  # daily|weekdays|weekends|weekly
    target_value: Optional[int] = None
    unit: Optional[str] = Field(None, max_length=30)
    is_active: bool = True
    sort_order: int = 0
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None

class HabitResponse(BaseModel):
    habit_id: UUID
    name: str
    description: Optional[str] = None
    frequency: str
    target_value: Optional[int] = None
    unit: Optional[str] = None
    is_active: bool
    sort_order: int
    created_at: datetime
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class HabitUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    frequency: Optional[str] = None
    target_value: Optional[int] = None
    unit: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


# --- HABIT LOG MODELS ---
class HabitLogUpsert(BaseModel):
    habit_id: UUID
    date: str  # YYYY-MM-DD
    completed: bool = False
    value: Optional[int] = None

class HabitLogResponse(BaseModel):
    log_id: UUID
    habit_id: UUID
    date: str
    completed: bool
    value: Optional[int] = None
    logged_at: datetime

    class Config:
        from_attributes = True


# --- TODO MODELS ---
class TodoCreate(BaseModel):
    title: str = Field(..., max_length=300)
    description: Optional[str] = None
    due_date: Optional[str] = None  # YYYY-MM-DD
    priority: str = "medium"  # low|medium|high
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None

class TodoResponse(BaseModel):
    todo_id: UUID
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: str
    completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None


# --- CALENDAR EVENT MODELS ---
class CalendarEventCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    date: str  # YYYY-MM-DD
    time_start: Optional[str] = None  # HH:MM
    time_end: Optional[str] = None  # HH:MM
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None

class CalendarEventResponse(BaseModel):
    event_id: UUID
    title: str
    description: Optional[str] = None
    date: str
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    created_at: datetime
    user_id: Optional[int] = None
    group_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    date: Optional[str] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None

