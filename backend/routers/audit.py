from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/", response_model=List[schemas.AuditLogEntry])
def list_audit_logs(
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    action: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(models.AuditLog)
    if entity_type:
        q = q.filter(models.AuditLog.entity_type == entity_type)
    if entity_id:
        q = q.filter(models.AuditLog.entity_id == entity_id)
    if action:
        q = q.filter(models.AuditLog.action == action)
    return q.order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
