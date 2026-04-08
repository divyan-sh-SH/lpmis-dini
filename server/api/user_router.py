from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session
from db.session import get_db
from typing import List
from models.db_models import User
from models.request_models import UserCreate, UserResponse, UserUpdate, UserValidate

user_router = APIRouter(prefix="/users", tags=["users"])

@user_router.post("/validate-user", response_model=UserResponse)
def validate_user(user_data: UserValidate, db: Session = Depends(get_db)):
    """Validate user credentials (for login)"""
    user = db.query(User).filter(User.user_id == user_data.user_id).first()
    if not user or user.otp != user_data.otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    return user

# GET all users
@user_router.get("", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Retrieve all users"""
    users = db.query(User).all()
    return users

# GET user by ID
@user_router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific user by ID"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

# POST create new user
@user_router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    # Check if user_id already exists
    existing = db.query(User).filter(User.user_id == user_data.user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID already exists"
        )
    new_user = User(
        user_id=user_data.user_id,
        username=user_data.username,
        role=user_data.role,
        otp=user_data.otp
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# PUT update user
@user_router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    """Update a user"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    for key, value in user_data.dict(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

# DELETE user
@user_router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}