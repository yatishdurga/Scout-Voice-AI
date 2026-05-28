export type VerificationStatus = "verified" | "pending" | "unverified";
export type CallStatus = "queued" | "ringing" | "answered" | "voicemail" | "completed" | "failed";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_review";

export interface League {
  id: number;
  name: string;
  country: string;
  region: string | null;
  level: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  play_style: string | null;
  league_id: number;
  last_verified: string | null;
  created_at: string;
  league?: League;
}

export interface Coach {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  team_id: number;
  verification_status: VerificationStatus;
  last_verified: string | null;
  notes: string | null;
  created_at: string;
  team?: Team & { league?: League };
}

export interface CallLog {
  id: number;
  coach_id: number;
  conversation_id: string | null;
  status: CallStatus;
  duration: number | null;
  recording_url: string | null;
  created_at: string;
  coach?: Coach & { team?: Team & { league?: League } };
}

export interface Change {
  field: string;
  display_name: string;
  old_value: string;
  new_value: string;
  entity: string;
  confidence: "high" | "medium" | "low";
}

export interface Approval {
  id: number;
  call_id: number;
  status: ApprovalStatus;
  confidence_score: number;
  created_at: string;
  changes: Change[];
  extracted: Record<string, string | number | null>;
  coach: { id: number; name: string; role: string } | null;
  team: { id: number; name: string } | null;
}

export interface AuditLogEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  approved_by: string;
  action: string;
  timestamp: string;
}

export interface DashboardStats {
  total_coaches: number;
  verified_coaches: number;
  pending_approvals: number;
  calls_today: number;
  calls_this_week: number;
  total_leagues: number;
  total_teams: number;
}
