from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from db.session import get_db
from models.db_models import CalendarEvent
from models.request_models import CalendarEventCreate, CalendarEventResponse, CalendarEventUpdate

calendar_router = APIRouter(prefix="/calendar", tags=["calendar"])


@calendar_router.get("/user/{user_id}", response_model=List[CalendarEventResponse])
def get_user_events(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(CalendarEvent)
        .filter(CalendarEvent.user_id == user_id)
        .order_by(CalendarEvent.date.asc(), CalendarEvent.time_start.asc())
        .all()
    )


@calendar_router.get("/group/{group_id}", response_model=List[CalendarEventResponse])
def get_group_events(group_id: str, db: Session = Depends(get_db)):
    try:
        gid = UUID(group_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid group_id")
    return (
        db.query(CalendarEvent)
        .filter(CalendarEvent.group_id == gid)
        .order_by(CalendarEvent.date.asc(), CalendarEvent.time_start.asc())
        .all()
    )


@calendar_router.post("", response_model=CalendarEventResponse)
def create_event(req: CalendarEventCreate, db: Session = Depends(get_db)):
    if req.user_id is None and req.group_id is None:
        raise HTTPException(status_code=400, detail="Either user_id or group_id must be provided")
    if req.user_id is not None and req.group_id is not None:
        raise HTTPException(status_code=400, detail="Provide either user_id or group_id, not both")

    event = CalendarEvent(
        title=req.title,
        description=req.description,
        date=req.date,
        time_start=req.time_start,
        time_end=req.time_end,
        user_id=req.user_id,
        group_id=req.group_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@calendar_router.put("/{event_id}", response_model=CalendarEventResponse)
def update_event(event_id: str, req: CalendarEventUpdate, db: Session = Depends(get_db)):
    try:
        eid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event_id")
    event = db.query(CalendarEvent).filter(CalendarEvent.event_id == eid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(event, field, val)
    db.commit()
    db.refresh(event)
    return event


@calendar_router.delete("/{event_id}", status_code=204)
def delete_event(event_id: str, db: Session = Depends(get_db)):
    try:
        eid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event_id")
    event = db.query(CalendarEvent).filter(CalendarEvent.event_id == eid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
