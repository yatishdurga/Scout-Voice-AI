import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone
from database import get_db
import models
import schemas
from services.elevenlabs import trigger_outbound_call, get_mock_transcript
from services.llm_extraction import extract_from_transcript
from services.diff_detection import detect_changes

router = APIRouter(prefix="/calls", tags=["calls"])


async def _simulate_call_completion(call_id: int, coach_id: int, db_session_factory):
    """Background task: simulate ElevenLabs completing a call in mock mode."""
    import asyncio
    await asyncio.sleep(3)

    db = db_session_factory()
    try:
        call = db.query(models.CallLog).filter(models.CallLog.id == call_id).first()
        if not call:
            return

        coach = (
            db.query(models.Coach)
            .options(joinedload(models.Coach.team))
            .filter(models.Coach.id == coach_id)
            .first()
        )

        mock_text = get_mock_transcript(call_id % 3)

        call.status = "completed"
        call.duration = 127 + (call_id * 11) % 90
        call.recording_url = f"https://mock-recordings.scoutai.dev/{call.conversation_id}.mp3"
        call.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()

        transcript = models.Transcript(call_id=call_id, full_text=mock_text)
        db.add(transcript)
        db.commit()

        extracted = await extract_from_transcript(mock_text, getattr(coach, "name", None))

        coach_team = getattr(coach, "team", None)
        changes = detect_changes(extracted, coach, coach_team)

        import json
        extracted_record = models.ExtractedUpdate(
            call_id=call_id,
            json_data=json.dumps({
                "extracted": extracted,
                "changes": changes,
            }),
            confidence_score=extracted.get("confidence_score", 0.85),
            status="pending",
        )
        db.add(extracted_record)

        if coach:
            coach.verification_status = "pending"
        db.commit()
    finally:
        db.close()


@router.get("/", response_model=List[schemas.CallLogDetail])
def list_calls(
    skip: int = 0,
    limit: int = 50,
    coach_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.CallLog).options(
        joinedload(models.CallLog.coach).joinedload(models.Coach.team).joinedload(models.Team.league)
    )
    if coach_id:
        q = q.filter(models.CallLog.coach_id == coach_id)
    if status:
        q = q.filter(models.CallLog.status == status)
    return q.order_by(models.CallLog.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/trigger", response_model=schemas.CallLog, status_code=201)
async def trigger_call(
    data: schemas.CallTrigger,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    coach = db.query(models.Coach).filter(models.Coach.id == data.coach_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")

    phone = coach.phone or "+10000000000"
    result = await trigger_outbound_call(data.coach_id, phone, coach.name)

    call = models.CallLog(
        coach_id=data.coach_id,
        conversation_id=result["conversation_id"],
        status=result["status"],
    )
    db.add(call)
    db.commit()
    db.refresh(call)

    import os
    from database import SessionLocal

    if os.getenv("MOCK_MODE", "true").lower() == "true":
        background_tasks.add_task(
            _simulate_call_completion, call.id, data.coach_id, SessionLocal
        )

    return call


@router.get("/{call_id}", response_model=schemas.CallLogDetail)
def get_call(call_id: int, db: Session = Depends(get_db)):
    call = (
        db.query(models.CallLog)
        .options(
            joinedload(models.CallLog.coach).joinedload(models.Coach.team).joinedload(models.Team.league)
        )
        .filter(models.CallLog.id == call_id)
        .first()
    )
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@router.get("/{call_id}/transcript")
def get_transcript(call_id: int, db: Session = Depends(get_db)):
    transcript = db.query(models.Transcript).filter(models.Transcript.call_id == call_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not available yet")
    return {"call_id": call_id, "full_text": transcript.full_text, "created_at": transcript.created_at}
