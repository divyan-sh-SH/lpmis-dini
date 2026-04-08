from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session
from db.session import get_db
from models.db_models import Cart
from typing import List
from models.request_models import CartItemCreate, CartItemResponse, CartItemUpdate
from uuid import UUID

cart_router = APIRouter(prefix="/carts", tags=["carts"])

# GET all cart items
@cart_router.get("", response_model=List[CartItemResponse])
def get_all_cart_items(db: Session = Depends(get_db)):
    """Retrieve all cart items"""
    items = db.query(Cart).all()
    return items

# GET cart item by ID
@cart_router.get("/{cart_id}", response_model=CartItemResponse)
def get_cart_item(cart_id: UUID, db: Session = Depends(get_db)):
    """Retrieve a specific cart item by ID"""
    item = db.query(Cart).filter(Cart.cart_id == cart_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    return item

@cart_router.get("/user/{user_id}", response_model=List[CartItemResponse])
def get_cart_items_for_user(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all cart items for a specific user"""
    items = db.query(Cart).filter(Cart.user_id == user_id).all()
    return items

@cart_router.get("/group/{group_id}", response_model=List[CartItemResponse])
def get_cart_items_for_group(group_id: UUID, db: Session = Depends(get_db)):
    """Retrieve all cart items for a specific group"""
    items = db.query(Cart).filter(Cart.group_id == group_id).all()
    return items

# POST create new cart item
@cart_router.post("", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
def create_cart_item(item_data: CartItemCreate, db: Session = Depends(get_db)):
    """Create a new cart item"""
    new_item = Cart(
        stock_item=item_data.stock_item,
        store_name=item_data.store_name,
        quantity=item_data.quantity,
        cost=item_data.cost,
        description=item_data.description,
        user_id=item_data.user_id,
        group_id=item_data.group_id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

# PUT update cart item
@cart_router.put("/{cart_id}", response_model=CartItemResponse)
def update_cart_item(cart_id: UUID, item_data: CartItemUpdate, db: Session = Depends(get_db)):
    """Update a cart item"""
    item = db.query(Cart).filter(Cart.cart_id == cart_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    for key, value in item_data.dict(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

# DELETE cart item
@cart_router.delete("/{cart_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart_item(cart_id: UUID, db: Session = Depends(get_db)):
    """Delete a cart item"""
    item = db.query(Cart).filter(Cart.cart_id == cart_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    db.delete(item)
    db.commit()
    return {"detail": "Cart item deleted"}