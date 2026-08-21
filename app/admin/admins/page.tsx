"use client";

import { useState, useEffect } from "react";

type UserRow = {
  id: number;
  email: string | null;
  username: string | null;
  full_name: string | null;
  role: string;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
};

type CurrentUser = {
  role: string;
};

const roleLabels: Record<string, string> = {
  system_owner: "SYSTEM OWNER",
  super_admin: "SUPER ADMIN",
  admin: "ADMINISTRATOR",
};

const ROLE_RANK: Record<string, number> = {
  admin: 1,
  super_admin: 2,
  system_owner: 3,
};

// Mirrors backend CREATABLE_STAFF_ROLES — which roles this user can create
const creatableRoles: Record<string, string[]> = {
  system_owner: ["admin", "super_admin"],
  super_admin: ["admin"],
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<UserRow[]>([]);
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [revealedPassword, setRevealedPassword] = useState<{ username: string; password: string } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  function loadStaff() {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setStaff(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMe(data));

    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myRank = me ? ROLE_RANK[me.role] || 0 : 0;
  const canCreateAny = me ? (creatableRoles[me.role]?.length ?? 0) > 0 : false;

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newUsername, full_name: newFullName || null, role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.detail || "Could not create admin");
        setCreating(false);
        return;
      }

      setRevealedPassword({ username: data.username, password: data.temp_password });
      setShowCreateModal(false);
      setNewUsername("");
      setNewFullName("");
      setNewRole("admin");
      setCreating(false);
      loadStaff();
    } catch {
      setCreateError("Could not reach the server.");
      setCreating(false);
    }
  }

  async function handleBlock(userId: number) {
    if (!token) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/block`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadStaff();
  }

  async function handleDelete(userId: number) {
    if (!token) return;
    if (!confirm("Delete this admin account? This cannot be undone from the UI.")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadStaff();
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Admins</h1>
        {canCreateAny && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-accent text-sm font-semibold px-4 py-2 rounded hover:opacity-90"
          >
            + Create Admin
          </button>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-6">Manage staff accounts, tiers, and access.</p>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Username</th>
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => {
                const targetRank = ROLE_RANK[u.role] || 0;
                const canActOnThis = myRank > targetRank;
                return (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="py-3 pr-4">{u.full_name || "—"}</td>
                    <td className="py-3 pr-4 text-gray-300">{u.username || "—"}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-semibold">
                        {roleLabels[u.role] || u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {u.is_active ? (
                        <span className="text-green-400 text-xs">Active</span>
                      ) : (
                        <span className="text-red-400 text-xs">Inactive</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      {canActOnThis ? (
                        <div className="flex gap-3 text-xs">
                          <button onClick={() => handleBlock(u.id)} className="text-yellow-400 hover:underline">
                            {u.is_active ? "Block" : "Unblock"}
                          </button>
                          {me?.role === "system_owner" && (
                            <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:underline">
                              Delete
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Admin modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
          <div className="bg-surface w-full max-w-sm rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Create Admin</h2>
            <form onSubmit={handleCreateAdmin} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Username"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="bg-background px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                placeholder="Full name (optional)"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                className="bg-background px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-accent"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="bg-background px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-accent"
              >
                {(me ? creatableRoles[me.role] || [] : []).map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r] || r}
                  </option>
                ))}
              </select>

              {createError && <p className="text-red-400 text-xs">{createError}</p>}

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/10 py-2 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-accent py-2 rounded text-sm font-semibold disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-time temp password reveal */}
      {revealedPassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
          <div className="bg-surface w-full max-w-sm rounded-lg p-6">
            <h2 className="text-lg font-bold mb-2">Admin Created</h2>
            <p className="text-sm text-gray-400 mb-4">
              Share this temporary password with <span className="text-white">{revealedPassword.username}</span> —
              it won&apos;t be shown again. They&apos;ll be required to change it on first login.
            </p>
            <div className="bg-background px-3 py-2 rounded font-mono text-sm mb-4 select-all">
              {revealedPassword.password}
            </div>
            <button
              onClick={() => setRevealedPassword(null)}
              className="w-full bg-accent py-2 rounded text-sm font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}