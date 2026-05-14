from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from uuid import UUID

from db.session import get_db
from models.db_models import Note
from models.request_models import NoteCreate, NoteResponse, NoteUpdate
from anthropic_chat import chat_completion

notes_router = APIRouter(prefix="/notes", tags=["notes"])


class RewriteRequest(BaseModel):
    content: str
    instruction: str


class RewriteResponse(BaseModel):
    rewritten: str


# ── Personal notes ────────────────────────────────────────────────────────────

@notes_router.get("/user/{user_id}", response_model=List[NoteResponse])
def get_user_notes(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Note)
        .filter(Note.user_id == user_id)
        .order_by(Note.date.desc())
        .all()
    )


@notes_router.get("/user/{user_id}/date/{date}", response_model=NoteResponse)
def get_user_note_by_date(user_id: int, date: str, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.user_id == user_id, Note.date == date).first()
    if not note:
        raise HTTPException(status_code=404, detail="No note for this date")
    return note


# ── Group notes ───────────────────────────────────────────────────────────────

@notes_router.get("/group/{group_id}", response_model=List[NoteResponse])
def get_group_notes(group_id: str, db: Session = Depends(get_db)):
    try:
        gid = UUID(group_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid group_id")
    return (
        db.query(Note)
        .filter(Note.group_id == gid)
        .order_by(Note.date.desc())
        .all()
    )


@notes_router.get("/group/{group_id}/date/{date}", response_model=NoteResponse)
def get_group_note_by_date(group_id: str, date: str, db: Session = Depends(get_db)):
    try:
        gid = UUID(group_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid group_id")
    note = db.query(Note).filter(Note.group_id == gid, Note.date == date).first()
    if not note:
        raise HTTPException(status_code=404, detail="No note for this date")
    return note


# ── CRUD ──────────────────────────────────────────────────────────────────────

@notes_router.post("", response_model=NoteResponse)
def create_note(req: NoteCreate, db: Session = Depends(get_db)):
    if req.user_id is None and req.group_id is None:
        raise HTTPException(status_code=400, detail="Either user_id or group_id must be provided")
    if req.user_id is not None and req.group_id is not None:
        raise HTTPException(status_code=400, detail="Provide either user_id or group_id, not both")

    note = Note(
        user_id=req.user_id,
        group_id=req.group_id,
        date=req.date,
        content=req.content,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@notes_router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, req: NoteUpdate, db: Session = Depends(get_db)):
    try:
        nid = UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid note_id")
    note = db.query(Note).filter(Note.note_id == nid).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.content = req.content
    db.commit()
    db.refresh(note)
    return note


@notes_router.delete("/{note_id}", status_code=204)
def delete_note(note_id: str, db: Session = Depends(get_db)):
    try:
        nid = UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid note_id")
    note = db.query(Note).filter(Note.note_id == nid).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()


# ── AI Rewrite ────────────────────────────────────────────────────────────────

@notes_router.post("/rewrite", response_model=RewriteResponse)
def rewrite_note(req: RewriteRequest):
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Content is empty")
    system = (
        "You are a skilled writing assistant. The user will give you a note and a one-line instruction. "
        "Rewrite the note exactly following the instruction. "
        "Return ONLY the rewritten text — no preamble, no explanation, no extra commentary."
    )
    messages = [
        {
            "role": "user",
            "content": f"Note:\n\n{req.content}\n\nInstruction: {req.instruction}",
        }
    ]
    try:
        result = chat_completion(messages, system=system)
        return RewriteResponse(rewritten=result.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
