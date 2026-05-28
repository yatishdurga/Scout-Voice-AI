from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class League(Base):
    __tablename__ = "leagues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    country = Column(String, nullable=False)
    region = Column(String)
    level = Column(String)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    teams = relationship("Team", back_populates="league", cascade="all, delete-orphan")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    name = Column(String, nullable=False)
    city = Column(String)
    country = Column(String)
    play_style = Column(String)
    last_verified = Column(DateTime)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    league = relationship("League", back_populates="teams")
    coaches = relationship("Coach", back_populates="team", cascade="all, delete-orphan")


class Coach(Base):
    __tablename__ = "coaches"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    name = Column(String, nullable=False)
    role = Column(String)
    phone = Column(String)
    email = Column(String)
    verification_status = Column(String, default="unverified")
    last_verified = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    team = relationship("Team", back_populates="coaches")
    call_logs = relationship("CallLog", back_populates="coach")


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False)
    conversation_id = Column(String, unique=True, index=True)
    status = Column(String, default="queued")
    duration = Column(Integer)
    recording_url = Column(String)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    coach = relationship("Coach", back_populates="call_logs")
    transcript = relationship("Transcript", back_populates="call", uselist=False)
    extracted_update = relationship("ExtractedUpdate", back_populates="call", uselist=False)


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("call_logs.id"), nullable=False)
    full_text = Column(Text)
    created_at = Column(DateTime, default=utcnow)

    call = relationship("CallLog", back_populates="transcript")


class ExtractedUpdate(Base):
    __tablename__ = "extracted_updates"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("call_logs.id"), nullable=False)
    json_data = Column(Text)
    confidence_score = Column(Float)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    call = relationship("CallLog", back_populates="extracted_update")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=False)
    field_name = Column(String, nullable=False)
    old_value = Column(String)
    new_value = Column(String)
    approved_by = Column(String, default="system")
    action = Column(String, nullable=False)
    timestamp = Column(DateTime, default=utcnow)
