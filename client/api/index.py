"""
My Money Dashboard API – single entrypoint.
FastAPI app + Supabase (PostgreSQL). Vercel uses class handler(BaseHTTPRequestHandler).
Local: uvicorn api.index:app
"""
import asyncio
import json
import os
from contextlib import asynccontextmanager
from datetime import date
from http.server import BaseHTTPRequestHandler
from typing import Literal, Optional
from urllib.parse import parse_qs, urlparse

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor

load_dotenv()

# Supabase connection URL
SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
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

        tx_date = body.date if body and body.date else date.today().isoformat()
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


# --- Vercel: class handler expected by Python runtime ---
try:
    from mangum import Mangum
    _mangum = Mangum(app, lifespan="off")
except ImportError:
    _mangum = None


def _build_event(handler_self: BaseHTTPRequestHandler) -> dict:
    parsed = urlparse(handler_self.path)
    path = parsed.path or "/"
    query = parse_qs(parsed.query) if parsed.query else {}
    query_string_params = {k: v[0] if len(v) == 1 else v for k, v in query.items()}

    content_length = int(handler_self.headers.get("Content-Length", 0))
    body = None
    if content_length:
        raw = handler_self.rfile.read(content_length)
        try:
            body = raw.decode("utf-8")
        except Exception:
            body = raw.hex()

    headers = {k.lower(): v for k, v in handler_self.headers.items()}

    return {
        "httpMethod": handler_self.command,
        "path": path,
        "headers": headers,
        "body": body,
        "queryStringParameters": query_string_params or None,
        "requestContext": {},
        "isBase64Encoded": False,
    }


class handler(BaseHTTPRequestHandler):
    """Vercel expects this class. Bridges request to FastAPI via Mangum."""

    def do_GET(self):
        self._dispatch()

    def do_POST(self):
        self._dispatch()

    def do_DELETE(self):
        self._dispatch()

    def do_PUT(self):
        self._dispatch()

    def do_OPTIONS(self):
        self._dispatch()

    def _dispatch(self):
        if not _mangum:
            self.send_response(503)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"detail":"Mangum not installed"}')
            return

        event = _build_event(self)
        try:
            response = asyncio.run(_mangum(event, {}))
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"detail": str(e)}).encode("utf-8"))
            return

        status = response.get("statusCode", 500)
        self.send_response(status)

        resp_headers = response.get("headers") or response.get("multiValueHeaders")
        if resp_headers and isinstance(resp_headers, dict):
            for k, v in resp_headers.items():
                val = v[0] if isinstance(v, list) else v
                self.send_header(k, val)
        self.end_headers()

        body = response.get("body") or ""
        if isinstance(body, dict):
            body = json.dumps(body)
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass
