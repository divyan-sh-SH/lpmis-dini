from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from db.session import get_db
from models.db_models import Journal
from models.request_models import JournalCreate, JournalResponse, JournalUpdate
from anthropic_chat import chat_completion

journal_router = APIRouter(prefix="/journal", tags=["journal"])


class RewriteRequest(BaseModel):
    content: str
    instruction: str


class RewriteResponse(BaseModel):
    rewritten: str


@journal_router.get("/user/{user_id}", response_model=List[JournalResponse])
def get_journal_entries(user_id: int, db: Session = Depends(get_db)):
    entries = (
        db.query(Journal)
        .filter(Journal.user_id == user_id)
        .order_by(Journal.date.desc())
        .all()
    )
    return entries


@journal_router.get("/user/{user_id}/date/{date}", response_model=JournalResponse)
def get_journal_entry(user_id: int, date: str, db: Session = Depends(get_db)):
    entry = db.query(Journal).filter(Journal.user_id == user_id, Journal.date == date).first()
    if not entry:
        raise HTTPException(status_code=404, detail="No journal entry for this date")
    return entry


@journal_router.post("", response_model=JournalResponse)
def create_journal_entry(req: JournalCreate, db: Session = Depends(get_db)):
    existing = db.query(Journal).filter(Journal.user_id == req.user_id, Journal.date == req.date).first()
    if existing:
        raise HTTPException(status_code=409, detail="Journal entry already exists for this date")
    entry = Journal(user_id=req.user_id, date=req.date, content=req.content)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@journal_router.put("/{journal_id}", response_model=JournalResponse)
def update_journal_entry(journal_id: str, req: JournalUpdate, db: Session = Depends(get_db)):
    entry = db.query(Journal).filter(Journal.journal_id == journal_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    entry.content = req.content
    db.commit()
    db.refresh(entry)
    return entry


@journal_router.delete("/{journal_id}", status_code=204)
def delete_journal_entry(journal_id: str, db: Session = Depends(get_db)):
    entry = db.query(Journal).filter(Journal.journal_id == journal_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    db.delete(entry)
    db.commit()


@journal_router.post("/rewrite", response_model=RewriteResponse)
def rewrite_journal(req: RewriteRequest):
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Content is empty")
    system = (
        "You are a skilled writing assistant. The user will give you a journal entry and a one-line instruction. "
        "Rewrite the journal entry exactly following the instruction. "
        "Return ONLY the rewritten journal text — no preamble, no explanation, no extra commentary."
    )
    messages = [
        {
            "role": "user",
            "content": f"Journal entry:\n\n{req.content}\n\nInstruction: {req.instruction}",
        }
    ]
    try:
        result = chat_completion(messages, system=system)
        return RewriteResponse(rewritten=result.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
