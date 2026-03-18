from fastapi import APIRouter, Depends, HTTPException
from models.request_models import TransactionCreate, TransactionResponse, CartItemCreate, CartItemResponse, BuyCartBody
from db.session import get_db
from typing import Optional
from datetime import date
from api.controller import HomeDashController
from sqlalchemy import text
from sqlalchemy.orm import Session

app_router = APIRouter(prefix="/homedash")  
controller = HomeDashController()

@app_router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    start, next_start = controller.current_month_range()
    rows = (
        db.execute(
            text(
                """
                SELECT type, SUM(amount) AS total
                FROM transactions
                WHERE date >= :start AND date < :next_start
                GROUP BY type
                """
            ),
            {"start": start, "next_start": next_start},
        )
        .mappings()
        .all()
    )

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


@app_router.get("/transactions", response_model=list[TransactionResponse])
def list_transactions(db: Session = Depends(get_db)):
    rows = (
        db.execute(
            text(
                "SELECT id, date, type, amount, description FROM transactions ORDER BY date DESC, id DESC"
            )
        )
        .mappings()
        .all()
    )
    return [controller.row_to_transaction(r) for r in rows]


@app_router.post("/transactions", response_model=TransactionResponse, status_code=201)
def create_transaction(body: TransactionCreate, db: Session = Depends(get_db)):
    row = (
        db.execute(
            text(
                """
                INSERT INTO transactions (date, type, amount, description)
                VALUES (:date, :type, :amount, :description)
                RETURNING id, date, type, amount, description
                """
            ),
            {
                "date": body.date,
                "type": body.type,
                "amount": body.amount,
                "description": body.description,
            },
        )
        .mappings()
        .one()
    )
    db.commit()
    return controller.row_to_transaction(row)


@app_router.get("/carts", response_model=list[CartItemResponse])
def list_carts(db: Session = Depends(get_db)):
    rows = (
        db.execute(text("SELECT id, item_name, store, cost, notes FROM carts ORDER BY id DESC"))
        .mappings()
        .all()
    )
    return [controller.row_to_cart(r) for r in rows]


@app_router.post("/carts", response_model=CartItemResponse, status_code=201)
def create_cart(body: CartItemCreate, db: Session = Depends(get_db)):
    row = (
        db.execute(
            text(
                """
                INSERT INTO carts (item_name, store, cost, notes)
                VALUES (:item_name, :store, :cost, :notes)
                RETURNING id, item_name, store, cost, notes
                """
            ),
            {
                "item_name": body.itemName,
                "store": body.store,
                "cost": body.cost,
                "notes": body.notes,
            },
        )
        .mappings()
        .one()
    )
    db.commit()
    return controller.row_to_cart(row)


@app_router.delete("/carts/{cart_id}", status_code=204)
def delete_cart(cart_id: int, db: Session = Depends(get_db)):
    result = db.execute(text("DELETE FROM carts WHERE id = :id"), {"id": cart_id})
    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.commit()


@app_router.post("/carts/{cart_id}/buy", status_code=201)
def buy_cart(cart_id: int, body: Optional[BuyCartBody] = None, db: Session = Depends(get_db)):
    row = (
        db.execute(
            text("SELECT id, item_name, store, cost FROM carts WHERE id = :id"),
            {"id": cart_id},
        )
        .mappings()
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Cart item not found")

    tx_date = body.date if body and body.date else date.today().isoformat()
    desc = (
        (body.description if body and body.description else None)
        or f"Bought {row['item_name']}"
        + (f" from {row['store']}" if row["store"] else "")
    )

    tx_row = (
        db.execute(
            text(
                """
                INSERT INTO transactions (date, type, amount, description)
                VALUES (:date, 'expense', :amount, :description)
                RETURNING id, date, type, amount, description
                """
            ),
            {"date": tx_date, "amount": float(row["cost"]), "description": desc},
        )
        .mappings()
        .one()
    )
    db.execute(text("DELETE FROM carts WHERE id = :id"), {"id": cart_id})
    db.commit()
    return {"transaction": controller.row_to_transaction(tx_row)}

