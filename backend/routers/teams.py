from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
import models
import schemas

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/", response_model=List[schemas.TeamWithLeague])
def list_teams(
    skip: int = 0,
    limit: int = 100,
    league_id: Optional[int] = None,
    country: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Team).options(joinedload(models.Team.league))
    if league_id:
        q = q.filter(models.Team.league_id == league_id)
    if country:
        q = q.filter(models.Team.country.ilike(f"%{country}%"))
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.Team, status_code=201)
def create_team(data: schemas.TeamCreate, db: Session = Depends(get_db)):
    team = models.Team(**data.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.get("/{team_id}", response_model=schemas.TeamWithLeague)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = (
        db.query(models.Team)
        .options(joinedload(models.Team.league))
        .filter(models.Team.id == team_id)
        .first()
    )
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.patch("/{team_id}", response_model=schemas.Team)
def update_team(team_id: int, data: schemas.TeamUpdate, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(team, key, val)
    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
