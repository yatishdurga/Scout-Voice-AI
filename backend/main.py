from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from database import engine, get_db, Base
import models
import schemas
from routers import leagues, teams, coaches, calls, webhooks, approvals, audit

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Scout Voice AI",
    description="AI-powered basketball scouting verification platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leagues.router)
app.include_router(teams.router)
app.include_router(coaches.router)
app.include_router(calls.router)
app.include_router(webhooks.router)
app.include_router(approvals.router)
app.include_router(audit.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "Scout Voice AI"}


@app.get("/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)

    return schemas.DashboardStats(
        total_coaches=db.query(models.Coach).count(),
        verified_coaches=db.query(models.Coach).filter(
            models.Coach.verification_status == "verified"
        ).count(),
        pending_approvals=db.query(models.ExtractedUpdate).filter(
            models.ExtractedUpdate.status.in_(["pending", "needs_review"])
        ).count(),
        calls_today=db.query(models.CallLog).filter(
            models.CallLog.created_at >= today_start
        ).count(),
        calls_this_week=db.query(models.CallLog).filter(
            models.CallLog.created_at >= week_start
        ).count(),
        total_leagues=db.query(models.League).count(),
        total_teams=db.query(models.Team).count(),
    )
