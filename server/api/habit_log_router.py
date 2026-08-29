from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from typing import List
from uuid import UUID

from db.session import get_db
from models.db_models import HabitLog
from models.request_models import HabitLogUpsert, HabitLogResponse

habit_log_router = APIRouter(prefix="/habit-logs", tags=["habit-logs"])


@habit_log_router.get("/user/{user_id}/date/{date}", response_model=List[HabitLogResponse])
def get_user_habit_logs_by_date(user_id: int, date: str, db: Session = Depends(get_db)):
    from models.db_models import Habit
    habit_ids = [h.habit_id for h in db.query(Habit.habit_id).filter(Habit.user_id == user_id).all()]
    if not habit_ids:
        return []
    return db.query(HabitLog).filter(HabitLog.habit_id.in_(habit_ids), HabitLog.date == date).all()


@habit_log_router.get("/user/{user_id}/range", response_model=List[HabitLogResponse])
def get_user_habit_logs_range(user_id: int, start: str, end: str, db: Session = Depends(get_db)):
    from models.db_models import Habit
    habit_ids = [h.habit_id for h in db.query(Habit.habit_id).filter(Habit.user_id == user_id).all()]
    if not habit_ids:
        return []
    return (
        db.query(HabitLog)
        .filter(HabitLog.habit_id.in_(habit_ids), HabitLog.date >= start, HabitLog.date <= end)
        .order_by(HabitLog.date.asc())
        .all()
    )


@habit_log_router.get("/group/{group_id}/date/{date}", response_model=List[HabitLogResponse])
def get_group_habit_logs_by_date(group_id: str, date: str, db: Session = Depends(get_db)):
    try:
        gid = UUID(group_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid group_id")
    from models.db_models import Habit
    habit_ids = [h.habit_id for h in db.query(Habit.habit_id).filter(Habit.group_id == gid).all()]
    if not habit_ids:
        return []
    return db.query(HabitLog).filter(HabitLog.habit_id.in_(habit_ids), HabitLog.date == date).all()


@habit_log_router.get("/group/{group_id}/range", response_model=List[HabitLogResponse])
def get_group_habit_logs_range(group_id: str, start: str, end: str, db: Session = Depends(get_db)):
    try:
        gid = UUID(group_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid group_id")
    from models.db_models import Habit
    habit_ids = [h.habit_id for h in db.query(Habit.habit_id).filter(Habit.group_id == gid).all()]
    if not habit_ids:
        return []
    return (
        db.query(HabitLog)
        .filter(HabitLog.habit_id.in_(habit_ids), HabitLog.date >= start, HabitLog.date <= end)
        .order_by(HabitLog.date.asc())
        .all()
    )


@habit_log_router.post("/upsert", response_model=HabitLogResponse)
def upsert_habit_log(req: HabitLogUpsert, db: Session = Depends(get_db)):
    stmt = (
        pg_insert(HabitLog)
        .values(
            habit_id=req.habit_id,
            date=req.date,
            completed=req.completed,
            value=req.value,
        )
        .on_conflict_do_update(
            constraint="uq_habit_log_habit_date",
            set_={"completed": req.completed, "value": req.value},
        )
        .returning(HabitLog)
    )
    result = db.execute(stmt)
    db.commit()
    row = result.fetchone()
    if row is None:
        raise HTTPException(status_code=500, detail="Upsert failed")
    return db.query(HabitLog).filter(
        HabitLog.habit_id == req.habit_id, HabitLog.date == req.date
    ).first()
