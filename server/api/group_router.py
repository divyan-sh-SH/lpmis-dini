from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_db
from models.db_models import Group
from models.request_models import GroupCreate, GroupResponse
from datetime import datetime
from uuid import UUID

group_router = APIRouter(prefix="/groups", tags=["groups"])

# GET all groups
@group_router.get("", response_model=list[GroupResponse])
def get_all_groups(db: Session = Depends(get_db)):
    """Retrieve all groups"""
    groups = db.query(Group).all()
    return groups

# GET group by ID
@group_router.get("/{group_id}", response_model=GroupResponse)
def get_group(group_id: UUID, db: Session = Depends(get_db)):
    """Retrieve a specific group by ID"""
    group = db.query(Group).filter(Group.group_id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    return group

# POST create new group
@group_router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(group_data: GroupCreate, db: Session = Depends(get_db)):
    """Create a new group"""
    new_group = Group(
        users=group_data.users,
        created_by=group_data.created_by,
        group_name=group_data.name
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@group_router.get("/user/{user_id}", response_model=list[GroupResponse])
def get_groups_for_user(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all groups for a specific user"""
    groups = db.query(Group).all()
    print(f"All groups: {[group for group in groups if user_id in group.users]}")  # Debug print to check group users
    groups = [group for group in groups if user_id in group.users]
    return groups