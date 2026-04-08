from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_db
from models.db_models import Stock
from models.request_models import StockCreate, StockResponse, StockUpdate
from typing import List
from uuid import UUID

stock_router = APIRouter(prefix="/stocks", tags=["stocks"])

# GET all stocks
@stock_router.get("", response_model=List[StockResponse])
def get_all_stocks(db: Session = Depends(get_db)):
    """Retrieve all stocks"""
    stocks = db.query(Stock).all()
    return stocks

# GET stock by ID
@stock_router.get("/{stock_id}", response_model=StockResponse)
def get_stock(stock_id: UUID, db: Session = Depends(get_db)):
    """Retrieve a specific stock by ID"""
    stock = db.query(Stock).filter(Stock.stock_id == stock_id).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )
    return stock

# GET stocks by user ID
@stock_router.get("/user/{user_id}", response_model=List[StockResponse])
def get_user_stocks(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all stocks for a specific user"""
    stocks = db.query(Stock).filter(Stock.user_id == user_id).all()
    return stocks

# GET stocks by group ID
@stock_router.get("/group/{group_id}", response_model=List[StockResponse])
def get_group_stocks(group_id: UUID, db: Session = Depends(get_db)):
    """Retrieve all stocks for a specific group"""
    stocks = db.query(Stock).filter(Stock.group_id == group_id).all()
    return stocks

# POST create new stock
@stock_router.post("", response_model=StockResponse, status_code=status.HTTP_201_CREATED)
def create_stock(stock_data: StockCreate, db: Session = Depends(get_db)):
    """Create a new stock item"""
    new_stock = Stock(
        stock_item=stock_data.stock_item,
        quantity=stock_data.quantity,
        description=stock_data.description,
        user_id=stock_data.user_id,
        group_id=stock_data.group_id
    )
    db.add(new_stock)
    db.commit()
    db.refresh(new_stock)
    return new_stock

# PUT update stock
@stock_router.put("/{stock_id}", response_model=StockResponse)
def update_stock(stock_id: UUID, stock_data: StockUpdate, db: Session = Depends(get_db)):
    """Update a stock item"""
    stock = db.query(Stock).filter(Stock.stock_id == stock_id).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )
    for key, value in stock_data.dict(exclude_unset=True).items():
        setattr(stock, key, value)
    db.commit()
    db.refresh(stock)
    return stock

# DELETE stock
@stock_router.delete("/{stock_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stock(stock_id: UUID, db: Session = Depends(get_db)):
    """Delete a stock item"""
    stock = db.query(Stock).filter(Stock.stock_id == stock_id).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )
    db.delete(stock)
    db.commit()
    return {"detail": "Stock deleted"}
