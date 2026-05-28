"use client";
import { useEffect, useState } from "react";
import { getAuditLog } from "@/lib/api";
import type { AuditLogEntry } from "@/lib/types";

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const ACTION_COLORS: Record<string, string> = {
  approved: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    getAuditLog({ action: actionFilter || undefined })
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [actionFilter]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-gray-400 text-sm mt-1">Complete history of all data changes and approval decisions</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[{ value: "", label: "All" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }].map((f) => (
          <button
            key={f.value}
            onClick={() => setActionFilter(f.value)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              actionFilter === f.value
                ? "bg-indigo-600/20 border-indigo-600/40 text-indigo-300"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Entity</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Field</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Old Value</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">New Value</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Approved By</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center">
                  <div className="text-gray-500 text-sm">No audit entries yet.</div>
                  <div className="text-gray-600 text-xs mt-1">Approve or reject suggestions in the Approvals tab to generate entries.</div>
                </td>
              </tr>
            ) : logs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="text-gray-300 capitalize">{l.entity_type}</div>
                  <div className="text-xs text-gray-500">ID #{l.entity_id}</div>
                </td>
                <td className="px-5 py-3.5 text-gray-300">{l.field_name.replace(/_/g, " ")}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs max-w-xs truncate">{l.old_value ?? "—"}</td>
                <td className="px-5 py-3.5 text-green-300 text-xs max-w-xs truncate">{l.new_value ?? "—"}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ACTION_COLORS[l.action] || "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
                    {l.action}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{l.approved_by}</td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{fmtDate(l.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
