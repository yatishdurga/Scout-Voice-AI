from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


# --- League ---

class LeagueBase(BaseModel):
    name: str
    country: str
    region: Optional[str] = None
    level: Optional[str] = None


class LeagueCreate(LeagueBase):
    pass


class LeagueUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    level: Optional[str] = None


class League(LeagueBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


# --- Team ---

class TeamBase(BaseModel):
    name: str
    city: Optional[str] = None
    country: Optional[str] = None
    play_style: Optional[str] = None
    league_id: int


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    play_style: Optional[str] = None


class Team(TeamBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    last_verified: Optional[datetime] = None
    created_at: datetime


class TeamWithLeague(Team):
    league: Optional[League] = None


# --- Coach ---

class CoachBase(BaseModel):
    name: str
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    team_id: int
    notes: Optional[str] = None


class CoachCreate(CoachBase):
    pass


class CoachUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    verification_status: Optional[str] = None


class Coach(CoachBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    verification_status: str
    last_verified: Optional[datetime] = None
    created_at: datetime


class CoachWithTeam(Coach):
    team: Optional[TeamWithLeague] = None


# --- CallLog ---

class CallLogBase(BaseModel):
    coach_id: int


class CallTrigger(BaseModel):
    coach_id: int
    custom_intro: Optional[str] = None


class CallLog(CallLogBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    conversation_id: Optional[str] = None
    status: str
    duration: Optional[int] = None
    recording_url: Optional[str] = None
    created_at: datetime


class CallLogDetail(CallLog):
    coach: Optional[CoachWithTeam] = None


# --- Transcript ---

class TranscriptBase(BaseModel):
    full_text: str
    call_id: int


class Transcript(TranscriptBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# --- ExtractedUpdate ---

class ExtractedUpdateBase(BaseModel):
    json_data: str
    confidence_score: float
    call_id: int


class ExtractedUpdate(ExtractedUpdateBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    created_at: datetime


class ApprovalAction(BaseModel):
    action: str  # approved | rejected | needs_review
    approved_by: Optional[str] = "scout_admin"
    notes: Optional[str] = None


# --- AuditLog ---

class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: int
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    approved_by: str
    action: str
    timestamp: datetime


# --- Webhook payload ---

class ElevenLabsWebhook(BaseModel):
    conversation_id: str
    status: str
    duration: Optional[int] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    metadata: Optional[dict] = None


# --- Stats ---

class DashboardStats(BaseModel):
    total_coaches: int
    verified_coaches: int
    pending_approvals: int
    calls_today: int
    calls_this_week: int
    total_leagues: int
    total_teams: int
