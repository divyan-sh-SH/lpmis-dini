from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_db
from models.db_models import Transaction
from models.request_models import TransactionCreate, TransactionResponse, TransactionUpdate
from typing import List
from uuid import UUID

transaction_router = APIRouter(prefix="/transactions", tags=["transactions"])

# GET all transactions
@transaction_router.get("", response_model=List[TransactionResponse])
def get_all_transactions(db: Session = Depends(get_db)):
    """Retrieve all transactions"""
    transactions = db.query(Transaction).all()
    return transactions

# GET transaction by ID
@transaction_router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: UUID, db: Session = Depends(get_db)):
    """Retrieve a specific transaction by ID"""
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction

# GET transactions by user ID
@transaction_router.get("/user/{user_id}", response_model=List[TransactionResponse])
def get_user_transactions(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all transactions for a specific user"""
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    return transactions

# GET transactions by group ID
@transaction_router.get("/group/{group_id}", response_model=List[TransactionResponse])
def get_group_transactions(group_id: UUID, db: Session = Depends(get_db)):
    """Retrieve all transactions for a specific group"""
    transactions = db.query(Transaction).filter(Transaction.group_id == group_id).all()
    return transactions

# POST create new transaction
@transaction_router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction_data: TransactionCreate, db: Session = Depends(get_db)):
    """Create a new transaction"""
    new_transaction = Transaction(
        amount=transaction_data.amount,
        description=transaction_data.description,
        user_id=transaction_data.user_id,
        group_id=transaction_data.group_id,
        date=transaction_data.date,
        type=transaction_data.type
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction

# PUT update transaction
@transaction_router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: UUID, transaction_data: TransactionUpdate, db: Session = Depends(get_db)):
    """Update a transaction"""
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    for key, value in transaction_data.dict(exclude_unset=True).items():
        setattr(transaction, key, value)
    db.commit()
    db.refresh(transaction)
    return transaction

# DELETE transaction
@transaction_router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: UUID, db: Session = Depends(get_db)):
    """Delete a transaction"""
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    db.delete(transaction)
    db.commit()
    return {"detail": "Transaction deleted"}
