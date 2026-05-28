const BASE = "/api";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Stats
export const getStats = () => req<import("./types").DashboardStats>("/stats");

// Leagues
export const getLeagues = () => req<import("./types").League[]>("/leagues/");

// Teams
export const getTeams = (params?: { league_id?: number; country?: string }) => {
  const qs = new URLSearchParams();
  if (params?.league_id) qs.set("league_id", String(params.league_id));
  if (params?.country) qs.set("country", params.country);
  return req<import("./types").Team[]>(`/teams/?${qs}`);
};

// Coaches
export const getCoaches = (params?: {
  search?: string;
  team_id?: number;
  verification_status?: string;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.team_id) qs.set("team_id", String(params.team_id));
  if (params?.verification_status) qs.set("verification_status", params.verification_status);
  if (params?.limit) qs.set("limit", String(params.limit));
  return req<import("./types").Coach[]>(`/coaches/?${qs}`);
};

export const getCoach = (id: number) =>
  req<import("./types").Coach>(`/coaches/${id}`);

export const updateCoach = (id: number, data: Partial<import("./types").Coach>) =>
  req<import("./types").Coach>(`/coaches/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteCoach = (id: number) =>
  req<void>(`/coaches/${id}`, { method: "DELETE" });

// Calls
export const getCalls = (params?: { coach_id?: number; status?: string; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.coach_id) qs.set("coach_id", String(params.coach_id));
  if (params?.status) qs.set("status", params.status);
  if (params?.limit) qs.set("limit", String(params.limit));
  return req<import("./types").CallLog[]>(`/calls/?${qs}`);
};

export const getCall = (id: number) =>
  req<import("./types").CallLog>(`/calls/${id}`);

export const triggerCall = (coach_id: number) =>
  req<import("./types").CallLog>("/calls/trigger", {
    method: "POST",
    body: JSON.stringify({ coach_id }),
  });

export const getTranscript = (call_id: number) =>
  req<{ call_id: number; full_text: string; created_at: string }>(`/calls/${call_id}/transcript`);

// Approvals
export const getApprovals = (status?: string) => {
  const qs = status ? `?status=${status}` : "?status=all";
  return req<import("./types").Approval[]>(`/approvals/${qs}`);
};

export const processApproval = (id: number, action: "approved" | "rejected" | "needs_review") =>
  req<{ status: string; update_id: number; changes_applied: number }>(`/approvals/${id}/action`, {
    method: "POST",
    body: JSON.stringify({ action, approved_by: "scout_admin" }),
  });

// Audit
export const getAuditLog = (params?: { entity_type?: string; action?: string }) => {
  const qs = new URLSearchParams();
  if (params?.entity_type) qs.set("entity_type", params.entity_type);
  if (params?.action) qs.set("action", params.action);
  return req<import("./types").AuditLogEntry[]>(`/audit/?${qs}&limit=100`);
};
