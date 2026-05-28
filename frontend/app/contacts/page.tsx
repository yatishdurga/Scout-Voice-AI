"use client";
import { useEffect, useState, useCallback } from "react";
import { getCoaches, updateCoach, deleteCoach, triggerCall } from "@/lib/api";
import type { Coach } from "@/lib/types";

const VSTATUS_COLORS: Record<string, string> = {
  verified: "bg-green-500/15 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  unverified: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

function VBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${VSTATUS_COLORS[status] || VSTATUS_COLORS.unverified}`}>
      {status}
    </span>
  );
}

function fmtDate(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface EditModal {
  coach: Coach;
  name: string;
  email: string;
  phone: string;
  role: string;
  notes: string;
}

export default function ContactsPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Coach | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getCoaches({ search: search || undefined, verification_status: statusFilter || undefined, limit: 100 })
      .then(setCoaches)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTriggerCall = async (coach: Coach) => {
    if (!coach.phone) { showToast("No phone number on file", "error"); return; }
    setTriggeringId(coach.id);
    try {
      await triggerCall(coach.id);
      showToast(`Call triggered for ${coach.name}`);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to trigger call", "error");
    } finally {
      setTriggeringId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await updateCoach(editModal.coach.id, {
        name: editModal.name,
        email: editModal.email,
        phone: editModal.phone,
        role: editModal.role,
        notes: editModal.notes,
      });
      setEditModal(null);
      showToast("Contact updated");
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coach: Coach) => {
    try {
      await deleteCoach(coach.id);
      setConfirmDelete(null);
      showToast(`${coach.name} deleted`);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to delete", "error");
    }
  };

  return (
    <div className="p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg border ${
          toast.type === "success"
            ? "bg-green-900/80 border-green-700 text-green-200"
            : "bg-red-900/80 border-red-700 text-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Contacts</h1>
        <p className="text-gray-400 text-sm mt-1">Coaches, GMs, and basketball operations staff</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Team / League</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Last Verified</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500">Loading...</td></tr>
            ) : coaches.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500">No contacts found.</td></tr>
            ) : coaches.map((c) => (
              <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-gray-200">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.role}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-gray-300">{c.team?.name ?? "—"}</div>
                  <div className="text-xs text-gray-500">{c.team?.league?.name}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-gray-300">{c.email ?? "—"}</div>
                  <div className="text-xs text-gray-500">{c.phone ?? "—"}</div>
                </td>
                <td className="px-5 py-3.5">
                  <VBadge status={c.verification_status} />
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{fmtDate(c.last_verified)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleTriggerCall(c)}
                      disabled={triggeringId === c.id}
                      className="px-3 py-1.5 text-xs font-medium bg-indigo-600/20 border border-indigo-600/40 text-indigo-300 rounded-lg hover:bg-indigo-600/30 disabled:opacity-50 transition-colors"
                    >
                      {triggeringId === c.id ? "Calling..." : "Call"}
                    </button>
                    <button
                      onClick={() => setEditModal({ coach: c, name: c.name, email: c.email ?? "", phone: c.phone ?? "", role: c.role ?? "", notes: c.notes ?? "" })}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(c)}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-800 border border-gray-700 text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-5">Edit Contact</h3>
            <div className="space-y-3">
              {(["name", "role", "email", "phone", "notes"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs text-gray-400 mb-1 capitalize">{field}</label>
                  {field === "notes" ? (
                    <textarea
                      value={editModal[field]}
                      onChange={(e) => setEditModal({ ...editModal, [field]: e.target.value })}
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  ) : (
                    <input
                      value={editModal[field]}
                      onChange={(e) => setEditModal({ ...editModal, [field]: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditModal(null)} className="flex-1 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-white mb-2">Delete Contact?</h3>
            <p className="text-sm text-gray-400 mb-5">This will permanently remove <strong className="text-white">{confirmDelete.name}</strong> and all related data.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 text-sm font-medium bg-red-700 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
