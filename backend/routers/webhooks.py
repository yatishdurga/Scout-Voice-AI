import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from database import get_db
import models
import schemas
from services.llm_extraction import extract_from_transcript
from services.diff_detection import detect_changes

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/elevenlabs/post-call")
async def elevenlabs_post_call(payload: schemas.ElevenLabsWebhook, db: Session = Depends(get_db)):
    call = (
        db.query(models.CallLog)
        .filter(models.CallLog.conversation_id == payload.conversation_id)
        .first()
    )
    if not call:
        raise HTTPException(status_code=404, detail="Call not found for conversation_id")

    call.status = payload.status
    if payload.duration:
        call.duration = payload.duration
    if payload.recording_url:
        call.recording_url = payload.recording_url
    call.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()

    if payload.transcript and payload.status == "completed":
        transcript_record = db.query(models.Transcript).filter(
            models.Transcript.call_id == call.id
        ).first()

        if not transcript_record:
            transcript_record = models.Transcript(
                call_id=call.id,
                full_text=payload.transcript,
            )
            db.add(transcript_record)
            db.commit()

        coach = (
            db.query(models.Coach)
            .options(joinedload(models.Coach.team))
            .filter(models.Coach.id == call.coach_id)
            .first()
        )

        extracted = await extract_from_transcript(
            payload.transcript, getattr(coach, "name", None)
        )

        changes = detect_changes(extracted, coach, getattr(coach, "team", None))

        existing = db.query(models.ExtractedUpdate).filter(
            models.ExtractedUpdate.call_id == call.id
        ).first()

        if not existing:
            extracted_record = models.ExtractedUpdate(
                call_id=call.id,
                json_data=json.dumps({"extracted": extracted, "changes": changes}),
                confidence_score=extracted.get("confidence_score", 0.85),
                status="pending",
            )
            db.add(extracted_record)

            if coach:
                coach.verification_status = "pending"

            db.commit()

    return {"status": "ok", "call_id": call.id}
