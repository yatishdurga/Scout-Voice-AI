"use client";
import { useEffect, useState } from "react";
import { getCalls, getTranscript } from "@/lib/api";
import type { CallLog } from "@/lib/types";

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

function TranscriptModal({ call, onClose }: { call: CallLog; onClose: () => void }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTranscript(call.id)
      .then((r) => setText(r.full_text))
      .catch(() => setText(null))
      .finally(() => setLoading(false));
  }, [call.id]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white">{call.coach?.name ?? `Call #${call.id}`}</h3>
            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
              <span>{call.coach?.team?.name}</span>
              <StatusBadge status={call.status} />
              {call.duration && <span>{fmtDuration(call.duration)}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-gray-500 text-sm">Loading transcript...</div>
          ) : !text ? (
            <div className="text-gray-500 text-sm">Transcript not available for this call.</div>
          ) : (
            <div className="space-y-3">
              {text.split("\n").filter(Boolean).map((line, i) => {
                const isAI = line.startsWith("Scout AI:");
                const isContact = line.startsWith("Contact:");
                return (
                  <div key={i} className={`flex ${isAI ? "justify-start" : isContact ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                      isAI
                        ? "bg-indigo-600/20 border border-indigo-600/30 text-indigo-100"
                        : isContact
                        ? "bg-gray-800 border border-gray-700 text-gray-200"
                        : "text-gray-500 text-xs italic"
                    }`}>
                      {isAI ? line.replace("Scout AI: ", "") : isContact ? line.replace("Contact: ", "") : line}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {call.recording_url && (
          <div className="px-6 py-3 border-t border-gray-800">
            <a href={call.recording_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300">
              🎙 Listen to recording →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<CallLog | null>(null);

  useEffect(() => {
    setLoading(true);
    getCalls({ status: statusFilter || undefined, limit: 50 })
      .then(setCalls)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const statuses = ["completed", "answered", "queued", "ringing", "voicemail", "failed"];

  return (
    <div className="p-8">
      {selected && <TranscriptModal call={selected} onClose={() => setSelected(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Calls</h1>
        <p className="text-gray-400 text-sm mt-1">Outbound call log and transcripts</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
            statusFilter === ""
              ? "bg-indigo-600/20 border-indigo-600/40 text-indigo-300"
              : "bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200"
          }`}
        >
          All
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors capitalize ${
              statusFilter === s
                ? "bg-indigo-600/20 border-indigo-600/40 text-indigo-300"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Team</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Duration</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Conv. ID</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-500">Loading...</td></tr>
            ) : calls.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center">
                  <div className="text-gray-500 text-sm">No calls yet.</div>
                  <div className="text-gray-600 text-xs mt-1">Go to Contacts and click Call on any coach to start.</div>
                </td>
              </tr>
            ) : calls.map((c) => (
              <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-gray-200">{c.coach?.name ?? `Coach #${c.coach_id}`}</div>
                  <div className="text-xs text-gray-500">{c.coach?.role}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-gray-300">{c.coach?.team?.name ?? "—"}</div>
                  <div className="text-xs text-gray-500">{c.coach?.team?.league?.name}</div>
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3.5 text-gray-400">{fmtDuration(c.duration)}</td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{fmtDate(c.created_at)}</td>
                <td className="px-5 py-3.5 text-gray-600 text-xs font-mono">{c.conversation_id?.slice(0, 14) ?? "—"}</td>
                <td className="px-5 py-3.5 text-right">
                  {c.status === "completed" && (
                    <button
                      onClick={() => setSelected(c)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      View Transcript
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
