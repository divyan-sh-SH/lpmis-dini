from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from db.session import get_db
from models.db_models import Habit
from models.request_models import HabitCreate, HabitResponse, HabitUpdate

habit_router = APIRouter(prefix="/habits", tags=["habits"])


@habit_router.get("/user/{user_id}", response_model=List[HabitResponse])
def get_user_habits(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Habit)
        .filter(Habit.user_id == user_id, Habit.is_active == True)
        .order_by(Habit.sort_order.asc(), Habit.created_at.asc())
        .all()
    )


@habit_router.get("/user/{user_id}/all", response_model=List[HabitResponse])
def get_all_user_habits(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Habit)
        .filter(Habit.user_id == user_id)
        .order_by(Habit.is_active.desc(), Habit.sort_order.asc())
        .all()
    )


@habit_router.get("/group/{group_id}", response_model=List[HabitResponse])
def get_group_habits(group_id: str, db: Session = Depends(get_db)):
    try:
        gid = UUID(group_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid group_id")
    return (
        db.query(Habit)
        .filter(Habit.group_id == gid, Habit.is_active == True)
        .order_by(Habit.sort_order.asc(), Habit.created_at.asc())
        .all()
    )


@habit_router.get("/group/{group_id}/all", response_model=List[HabitResponse])
def get_all_group_habits(group_id: str, db: Session = Depends(get_db)):
    try:
        gid = UUID(group_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid group_id")
    return (
        db.query(Habit)
        .filter(Habit.group_id == gid)
        .order_by(Habit.is_active.desc(), Habit.sort_order.asc())
        .all()
    )


@habit_router.post("", response_model=HabitResponse)
def create_habit(req: HabitCreate, db: Session = Depends(get_db)):
    if req.user_id is None and req.group_id is None:
        raise HTTPException(status_code=400, detail="Either user_id or group_id must be provided")
    if req.user_id is not None and req.group_id is not None:
        raise HTTPException(status_code=400, detail="Provide either user_id or group_id, not both")

    habit = Habit(
        name=req.name,
        description=req.description,
        frequency=req.frequency,
        target_value=req.target_value,
        unit=req.unit,
        is_active=req.is_active,
        sort_order=req.sort_order,
        user_id=req.user_id,
        group_id=req.group_id,
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


@habit_router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(habit_id: str, req: HabitUpdate, db: Session = Depends(get_db)):
    try:
        hid = UUID(habit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid habit_id")
    habit = db.query(Habit).filter(Habit.habit_id == hid).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(habit, field, val)
    db.commit()
    db.refresh(habit)
    return habit


@habit_router.patch("/{habit_id}/archive", response_model=HabitResponse)
def archive_habit(habit_id: str, db: Session = Depends(get_db)):
    try:
        hid = UUID(habit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid habit_id")
    habit = db.query(Habit).filter(Habit.habit_id == hid).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit.is_active = False
    db.commit()
    db.refresh(habit)
    return habit


@habit_router.delete("/{habit_id}", status_code=204)
def delete_habit(habit_id: str, db: Session = Depends(get_db)):
    try:
        hid = UUID(habit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid habit_id")
    habit = db.query(Habit).filter(Habit.habit_id == hid).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()
