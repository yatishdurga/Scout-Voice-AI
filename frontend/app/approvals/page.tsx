"use client";
import { useEffect, useState } from "react";
import { getApprovals, processApproval } from "@/lib/api";
import type { Approval } from "@/lib/types";

const CONF_COLORS: Record<string, string> = {
  high: "bg-green-500/15 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  needs_review: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = (status: string) => {
    setLoading(true);
    getApprovals(status || "all")
      .then(setApprovals)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handle = async (id: number, action: "approved" | "rejected" | "needs_review") => {
    setProcessing(id);
    try {
      const result = await processApproval(id, action);
      const label = action === "approved" ? `Approved — ${result.changes_applied ?? 0} change(s) applied` : action === "rejected" ? "Rejected" : "Flagged for review";
      showToast(label, action === "rejected" ? "error" : "success");
      load(filter);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Action failed", "error");
    } finally {
      setProcessing(null);
    }
  };

  const filters = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "needs_review", label: "Needs Review" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="p-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg border ${
          toast.type === "success"
            ? "bg-green-900/80 border-green-700 text-green-200"
            : "bg-red-900/80 border-red-700 text-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Approvals</h1>
        <p className="text-gray-400 text-sm mt-1">Review AI-extracted scouting updates before they are applied</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              filter === f.value
                ? "bg-indigo-600/20 border-indigo-600/40 text-indigo-300"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : approvals.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-12 text-center">
          <div className="text-gray-400 text-sm">No {filter !== "all" ? filter : ""} approvals.</div>
          {filter === "pending" && (
            <div className="text-gray-600 text-xs mt-1">Trigger calls from the Contacts page — completed calls will generate approval requests.</div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((a) => (
            <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Card header */}
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{a.coach?.name ?? "Unknown"}</span>
                    <span className="text-gray-500 text-xs">·</span>
                    <span className="text-gray-400 text-sm">{a.team?.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[a.status] || ""}`}>
                      {a.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                    <span>{a.coach?.role}</span>
                    <span>Call #{a.call_id}</span>
                    <span>{fmtDate(a.created_at)}</span>
                    <span className={`px-1.5 py-0.5 rounded-full border text-xs ${
                      a.confidence_score >= 0.9 ? CONF_COLORS.high : a.confidence_score >= 0.75 ? CONF_COLORS.medium : CONF_COLORS.low
                    }`}>
                      {Math.round(a.confidence_score * 100)}% confidence
                    </span>
                  </div>
                </div>
                {a.status === "pending" && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handle(a.id, "needs_review")}
                      disabled={processing === a.id}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600/15 border border-blue-600/30 text-blue-300 rounded-lg hover:bg-blue-600/25 disabled:opacity-50"
                    >
                      Flag
                    </button>
                    <button
                      onClick={() => handle(a.id, "rejected")}
                      disabled={processing === a.id}
                      className="px-3 py-1.5 text-xs font-medium bg-red-600/15 border border-red-600/30 text-red-300 rounded-lg hover:bg-red-600/25 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handle(a.id, "approved")}
                      disabled={processing === a.id}
                      className="px-4 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50"
                    >
                      {processing === a.id ? "Processing..." : "Approve All"}
                    </button>
                  </div>
                )}
              </div>

              {/* Changes table */}
              {a.changes.length > 0 ? (
                <div className="divide-y divide-gray-800/50">
                  <div className="grid grid-cols-4 gap-4 px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <div>Field</div>
                    <div>Old Value</div>
                    <div>New Value</div>
                    <div>Confidence</div>
                  </div>
                  {a.changes.map((c, i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 px-5 py-3 text-sm">
                      <div className="text-gray-300 font-medium">{c.display_name}</div>
                      <div className="text-gray-500">{c.old_value}</div>
                      <div className="text-green-300">{c.new_value}</div>
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CONF_COLORS[c.confidence] || CONF_COLORS.low}`}>
                          {c.confidence}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-4 text-sm text-gray-500">No structured changes extracted.</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
