from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
import models
import schemas

router = APIRouter(prefix="/coaches", tags=["coaches"])


@router.get("/", response_model=List[schemas.CoachWithTeam])
def list_coaches(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    team_id: Optional[int] = None,
    verification_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = (
        db.query(models.Coach)
        .options(
            joinedload(models.Coach.team).joinedload(models.Team.league)
        )
    )
    if search:
        q = q.filter(
            (models.Coach.name.ilike(f"%{search}%"))
            | (models.Coach.email.ilike(f"%{search}%"))
        )
    if team_id:
        q = q.filter(models.Coach.team_id == team_id)
    if verification_status:
        q = q.filter(models.Coach.verification_status == verification_status)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.Coach, status_code=201)
def create_coach(data: schemas.CoachCreate, db: Session = Depends(get_db)):
    coach = models.Coach(**data.model_dump())
    db.add(coach)
    db.commit()
    db.refresh(coach)
    return coach


@router.get("/{coach_id}", response_model=schemas.CoachWithTeam)
def get_coach(coach_id: int, db: Session = Depends(get_db)):
    coach = (
        db.query(models.Coach)
        .options(joinedload(models.Coach.team).joinedload(models.Team.league))
        .filter(models.Coach.id == coach_id)
        .first()
    )
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    return coach


@router.patch("/{coach_id}", response_model=schemas.Coach)
def update_coach(coach_id: int, data: schemas.CoachUpdate, db: Session = Depends(get_db)):
    coach = db.query(models.Coach).filter(models.Coach.id == coach_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(coach, key, val)
    db.commit()
    db.refresh(coach)
    return coach


@router.delete("/{coach_id}", status_code=204)
def delete_coach(coach_id: int, db: Session = Depends(get_db)):
    coach = db.query(models.Coach).filter(models.Coach.id == coach_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    db.delete(coach)
    db.commit()
