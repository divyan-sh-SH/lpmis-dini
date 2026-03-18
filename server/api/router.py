from fastapi import APIRouter, HTTPException
from models.request_models import TransactionCreate, TransactionResponse, CartItemCreate, CartItemResponse, BuyCartBody
from db.session import get_conn
from typing import Optional
from datetime import date
from api.controller import HomeDashController

app_router = APIRouter(prefix="/homedash")  
controller = HomeDashController()

@app_router.get("/summary")
def get_summary():
    start, next_start = controller.current_month_range()
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


@app_router.get("/transactions", response_model=list[TransactionResponse])
def list_transactions():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, date, type, amount, description FROM transactions ORDER BY date DESC, id DESC"
            )
            rows = cur.fetchall()
        return [controller.row_to_transaction(r) for r in rows]
    finally:
        conn.close()


@app_router.post("/transactions", response_model=TransactionResponse, status_code=201)
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
        return controller.row_to_transaction(row)
    finally:
        conn.close()


@app_router.get("/carts", response_model=list[CartItemResponse])
def list_carts():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, item_name, store, cost, notes FROM carts ORDER BY id DESC"
            )
            rows = cur.fetchall()
        return [controller.row_to_cart(r) for r in rows]
    finally:
        conn.close()


@app_router.post("/carts", response_model=CartItemResponse, status_code=201)
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
        return controller.row_to_cart(row)
    finally:
        conn.close()


@app_router.delete("/carts/{cart_id}", status_code=204)
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


@app_router.post("/carts/{cart_id}/buy", status_code=201)
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
        return {"transaction": controller.row_to_transaction(tx_row)}
    finally:
        conn.close()

