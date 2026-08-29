from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from db.session import get_db
from models.db_models import Todo
from models.request_models import TodoCreate, TodoResponse, TodoUpdate

todo_router = APIRouter(prefix="/todos", tags=["todos"])


@todo_router.get("/user/{user_id}", response_model=List[TodoResponse])
def get_user_todos(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Todo)
        .filter(Todo.user_id == user_id)
        .order_by(Todo.completed.asc(), Todo.created_at.desc())
        .all()
    )


@todo_router.get("/group/{group_id}", response_model=List[TodoResponse])
def get_group_todos(group_id: str, db: Session = Depends(get_db)):
    try:
        gid = UUID(group_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid group_id")
    return (
        db.query(Todo)
        .filter(Todo.group_id == gid)
        .order_by(Todo.completed.asc(), Todo.created_at.desc())
        .all()
    )


@todo_router.post("", response_model=TodoResponse)
def create_todo(req: TodoCreate, db: Session = Depends(get_db)):
    if req.user_id is None and req.group_id is None:
        raise HTTPException(status_code=400, detail="Either user_id or group_id must be provided")
    if req.user_id is not None and req.group_id is not None:
        raise HTTPException(status_code=400, detail="Provide either user_id or group_id, not both")

    todo = Todo(
        title=req.title,
        description=req.description,
        due_date=req.due_date,
        priority=req.priority,
        user_id=req.user_id,
        group_id=req.group_id,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@todo_router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: str, req: TodoUpdate, db: Session = Depends(get_db)):
    try:
        tid = UUID(todo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid todo_id")
    todo = db.query(Todo).filter(Todo.todo_id == tid).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(todo, field, val)
    db.commit()
    db.refresh(todo)
    return todo


@todo_router.patch("/{todo_id}/complete", response_model=TodoResponse)
def toggle_todo_complete(todo_id: str, db: Session = Depends(get_db)):
    try:
        tid = UUID(todo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid todo_id")
    todo = db.query(Todo).filter(Todo.todo_id == tid).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.completed = not todo.completed
    todo.completed_at = datetime.utcnow() if todo.completed else None
    db.commit()
    db.refresh(todo)
    return todo


@todo_router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: str, db: Session = Depends(get_db)):
    try:
        tid = UUID(todo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid todo_id")
    todo = db.query(Todo).filter(Todo.todo_id == tid).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
