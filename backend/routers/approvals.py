import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone
from database import get_db
import models
import schemas

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("/", response_model=List[dict])
def list_approvals(
    status: Optional[str] = "pending",
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(models.ExtractedUpdate).options(
        joinedload(models.ExtractedUpdate.call).joinedload(models.CallLog.coach).joinedload(models.Coach.team)
    )
    if status and status != "all":
        q = q.filter(models.ExtractedUpdate.status == status)
    updates = q.order_by(models.ExtractedUpdate.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for u in updates:
        parsed = json.loads(u.json_data) if u.json_data else {}
        call = u.call
        coach = call.coach if call else None
        team = coach.team if coach else None

        result.append({
            "id": u.id,
            "call_id": u.call_id,
            "status": u.status,
            "confidence_score": u.confidence_score,
            "created_at": u.created_at.isoformat(),
            "changes": parsed.get("changes", []),
            "extracted": parsed.get("extracted", {}),
            "coach": {
                "id": coach.id if coach else None,
                "name": coach.name if coach else None,
                "role": coach.role if coach else None,
            } if coach else None,
            "team": {
                "id": team.id if team else None,
                "name": team.name if team else None,
            } if team else None,
        })

    return result


@router.post("/{update_id}/action", response_model=dict)
def process_approval(
    update_id: int,
    action: schemas.ApprovalAction,
    db: Session = Depends(get_db),
):
    update = (
        db.query(models.ExtractedUpdate)
        .options(
            joinedload(models.ExtractedUpdate.call).joinedload(models.CallLog.coach).joinedload(models.Coach.team)
        )
        .filter(models.ExtractedUpdate.id == update_id)
        .first()
    )
    if not update:
        raise HTTPException(status_code=404, detail="Update not found")

    if update.status not in ("pending", "needs_review"):
        raise HTTPException(status_code=400, detail=f"Update is already {update.status}")

    parsed = json.loads(update.json_data) if update.json_data else {}
    changes = parsed.get("changes", [])
    coach = update.call.coach if update.call else None
    team = coach.team if coach else None

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if action.action == "approved" and coach:
        for change in changes:
            field = change["field"]
            new_val = change["new_value"]

            audit = models.AuditLog(
                entity_type=change.get("entity", "coach"),
                entity_id=coach.id,
                field_name=field,
                old_value=change.get("old_value"),
                new_value=new_val,
                approved_by=action.approved_by or "scout_admin",
                action="approved",
                timestamp=now,
            )
            db.add(audit)

            if field == "verified_email" and coach:
                coach.email = new_val
            elif field == "coach_name" and coach:
                coach.name = new_val
            elif field == "team_style" and team:
                team.play_style = new_val

        if coach:
            coach.verification_status = "verified"
            coach.last_verified = now
        if team:
            team.last_verified = now

    elif action.action == "rejected":
        audit = models.AuditLog(
            entity_type="extracted_update",
            entity_id=update.id,
            field_name="all",
            old_value=None,
            new_value=None,
            approved_by=action.approved_by or "scout_admin",
            action="rejected",
            timestamp=now,
        )
        db.add(audit)

        if coach:
            coach.verification_status = "unverified"

    elif action.action == "needs_review":
        update.status = "needs_review"
        db.commit()
        return {"status": "needs_review", "update_id": update_id}

    update.status = action.action
    update.updated_at = now
    db.commit()

    return {"status": action.action, "update_id": update_id, "changes_applied": len(changes)}
