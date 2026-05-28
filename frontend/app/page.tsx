"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getStats, getCalls, getApprovals } from "@/lib/api";
import type { DashboardStats, CallLog, Approval } from "@/lib/types";

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${accent || "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  answered: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  queued: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  ringing: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  voicemail: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
      {status}
    </span>
  );
}

function fmtDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getStats(), getCalls({ limit: 8 }), getApprovals("pending")])
      .then(([s, c, a]) => {
        setStats(s);
        setCalls(c);
        setApprovals(a);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  if (error) return (
    <div className="p-8">
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-5 text-red-300">
        <strong>Backend not reachable.</strong> Start the FastAPI server at <code>localhost:8000</code> and seed the database.
        <pre className="mt-2 text-xs text-red-400">{error}</pre>
      </div>
    </div>
  );

  const verifiedPct = stats
    ? Math.round((stats.verified_coaches / Math.max(stats.total_coaches, 1)) * 100)
    : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Basketball scouting verification overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Coaches" value={stats?.total_coaches ?? 0} sub={`${stats?.total_leagues ?? 0} leagues · ${stats?.total_teams ?? 0} teams`} />
        <StatCard
          label="Verified Contacts"
          value={`${stats?.verified_coaches ?? 0}`}
          sub={`${verifiedPct}% verification rate`}
          accent="text-green-400"
        />
        <StatCard label="Pending Approvals" value={stats?.pending_approvals ?? 0} sub="Awaiting review" accent={stats?.pending_approvals ? "text-yellow-400" : "text-white"} />
        <StatCard label="Calls This Week" value={stats?.calls_this_week ?? 0} sub={`${stats?.calls_today ?? 0} today`} accent="text-indigo-400" />
      </div>

      {/* Verification progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-300">Contact Verification Progress</span>
          <span className="text-sm text-gray-400">{stats?.verified_coaches} / {stats?.total_coaches}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-700"
            style={{ width: `${verifiedPct}%` }}
          />
        </div>
      </div>

      {/* Two columns: recent calls + pending approvals */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent calls */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="font-semibold text-white">Recent Calls</h2>
            <Link href="/calls" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </div>
          {calls.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500 text-sm">No calls yet. Go to Contacts to trigger a call.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {calls.map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-200">{c.coach?.name ?? `Coach #${c.coach_id}`}</div>
                    <div className="text-xs text-gray-500">{c.coach?.team?.name} · {fmtDate(c.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{fmtDuration(c.duration)}</span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending approvals */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="font-semibold text-white">Pending Approvals</h2>
            <Link href="/approvals" className="text-xs text-indigo-400 hover:text-indigo-300">Review all →</Link>
          </div>
          {approvals.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500 text-sm">No pending approvals.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {approvals.slice(0, 6).map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-200">{a.coach?.name}</div>
                    <div className="text-xs text-gray-500">{a.team?.name} · {a.changes.length} change{a.changes.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      a.confidence_score >= 0.9
                        ? "bg-green-500/15 text-green-400 border-green-500/30"
                        : a.confidence_score >= 0.75
                        ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                        : "bg-red-500/15 text-red-400 border-red-500/30"
                    }`}>
                      {Math.round(a.confidence_score * 100)}% conf.
                    </span>
                    <Link href="/approvals" className="text-xs text-indigo-400 hover:text-indigo-300">Review</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
