"""
FastAPI backend for My Money Dashboard.
Uses Supabase (PostgreSQL) via SUPABASE_URL from environment.
"""
import os
from contextlib import asynccontextmanager
from datetime import date
from typing import Literal, Optional

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor

load_dotenv()

# Supabase connection URL (e.g. postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres)
SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    # Fallback to individual vars if set (user, password, host, port, dbname)
    user = os.getenv("user")
    password = os.getenv("password")
    host = os.getenv("host")
    port = os.getenv("port")
    dbname = os.getenv("dbname")
    if all([user, password, host, port, dbname]):
        SUPABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"


def get_conn():
    if not SUPABASE_URL:
        raise RuntimeError(
            "Missing SUPABASE_URL (or user, password, host, port, dbname) in environment"
        )
    return psycopg2.connect(SUPABASE_URL, cursor_factory=RealDictCursor)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="My Money Dashboard API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


def row_to_transaction(row: dict) -> dict:
    return {
        "id": row["id"],
        "date": row["date"],
        "type": row["type"],
        "amount": float(row["amount"]),
        "description": row["description"],
    }


def row_to_cart(row: dict) -> dict:
    return {
        "id": row["id"],
        "itemName": row["item_name"],
        "store": row["store"],
        "cost": float(row["cost"]),
        "notes": row["notes"],
    }


def current_month_range():
    today = date.today()
    start = date(today.year, today.month, 1)
    if today.month == 12:
        next_month = date(today.year + 1, 1, 1)
    else:
        next_month = date(today.year, today.month + 1, 1)
    return start.isoformat(), next_month.isoformat()


# --- Routes ---
@app.get("/api/summary")
def get_summary():
    start, next_start = current_month_range()
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT type, SUM(amount) AS total
                FROM transactions
                WHERE date >= %s AND date < %s
                GROUP BY type
                """,
                (start, next_start),
            )
            rows = cur.fetchall()
        income = expense = 0.0
        for row in rows:
            if row["type"] == "income":
                income = float(row["total"] or 0)
            elif row["type"] == "expense":
                expense = float(row["total"] or 0)
        remaining = income - expense
        return {
            "monthStart": start,
            "monthEnd": next_start,
            "income": income,
            "expense": expense,
            "remaining": remaining,
        }
    finally:
        conn.close()


@app.get("/api/transactions", response_model=list[TransactionResponse])
def list_transactions():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, date, type, amount, description FROM transactions ORDER BY date DESC, id DESC"
            )
            rows = cur.fetchall()
        return [row_to_transaction(r) for r in rows]
    finally:
        conn.close()


@app.post("/api/transactions", response_model=TransactionResponse, status_code=201)
def create_transaction(body: TransactionCreate):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO transactions (date, type, amount, description)
                VALUES (%s, %s, %s, %s)
                RETURNING id, date, type, amount, description
                """,
                (body.date, body.type, body.amount, body.description),
            )
            row = cur.fetchone()
        conn.commit()
        return row_to_transaction(row)
    finally:
        conn.close()


@app.get("/api/carts", response_model=list[CartItemResponse])
def list_carts():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, item_name, store, cost, notes FROM carts ORDER BY id DESC"
            )
            rows = cur.fetchall()
        return [row_to_cart(r) for r in rows]
    finally:
        conn.close()


@app.post("/api/carts", response_model=CartItemResponse, status_code=201)
def create_cart(body: CartItemCreate):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO carts (item_name, store, cost, notes)
                VALUES (%s, %s, %s, %s)
                RETURNING id, item_name, store, cost, notes
                """,
                (body.itemName, body.store, body.cost, body.notes),
            )
            row = cur.fetchone()
        conn.commit()
        return row_to_cart(row)
    finally:
        conn.close()


@app.delete("/api/carts/{cart_id}", status_code=204)
def delete_cart(cart_id: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM carts WHERE id = %s", (cart_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Cart item not found")
        conn.commit()
    finally:
        conn.close()


@app.post("/api/carts/{cart_id}/buy", status_code=201)
def buy_cart(cart_id: int, body: Optional[BuyCartBody] = None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, item_name, store, cost FROM carts WHERE id = %s",
                (cart_id,),
            )
            row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Cart item not found")

        tx_date = (
            (body.date if body and body.date else date.today().isoformat())
        )
        desc = (
            (body.description if body and body.description else None)
            or f"Bought {row['item_name']}"
            + (f" from {row['store']}" if row["store"] else "")
        )

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO transactions (date, type, amount, description)
                VALUES (%s, 'expense', %s, %s)
                RETURNING id, date, type, amount, description
                """,
                (tx_date, float(row["cost"]), desc),
            )
            tx_row = cur.fetchone()
            cur.execute("DELETE FROM carts WHERE id = %s", (cart_id,))
        conn.commit()
        return {"transaction": row_to_transaction(tx_row)}
    finally:
        conn.close()


# For Vercel, the entrypoint is api/index.py which defines a class handler(BaseHTTPRequestHandler).
# For local ASGI (e.g. uvicorn), run: uvicorn api.main:app
