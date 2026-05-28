from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/leagues", tags=["leagues"])


@router.get("/", response_model=List[schemas.League])
def list_leagues(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.League).offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.League, status_code=201)
def create_league(data: schemas.LeagueCreate, db: Session = Depends(get_db)):
    league = models.League(**data.model_dump())
    db.add(league)
    db.commit()
    db.refresh(league)
    return league


@router.get("/{league_id}", response_model=schemas.League)
def get_league(league_id: int, db: Session = Depends(get_db)):
    league = db.query(models.League).filter(models.League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    return league


@router.patch("/{league_id}", response_model=schemas.League)
def update_league(league_id: int, data: schemas.LeagueUpdate, db: Session = Depends(get_db)):
    league = db.query(models.League).filter(models.League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(league, key, val)
    db.commit()
    db.refresh(league)
    return league


@router.delete("/{league_id}", status_code=204)
def delete_league(league_id: int, db: Session = Depends(get_db)):
    league = db.query(models.League).filter(models.League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    db.delete(league)
    db.commit()
