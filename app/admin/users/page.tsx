"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
};

type SessionItem = {
  id: number;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
};

const ROLE_RANK: Record<string, number> = {
  user: 0,
  admin: 1,
  super_admin: 2,
  system_owner: 3,
};

function canModerate(actorRole: string, targetRole: string) {
  return (ROLE_RANK[actorRole] ?? 0) > (ROLE_RANK[targetRole] ?? 0);
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [myRole, setMyRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const [sessionsUser, setSessionsUser] = useState<UserRow | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  function getToken() {
    return localStorage.getItem("access_token");
  }

  function loadUsers() {
    const token = getToken();
    if (!token) return;

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => (res.ok ? res.json() : null)),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => (res.ok ? res.json() : [])),
    ]).then(([me, usersData]) => {
      if (me) setMyRole(me.role);
      setUsers(usersData);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleBlock(user: UserRow) {
    setActionError("");
    const token = getToken();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.id}/block`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setActionError(data?.detail || "Could not update this user.");
      return;
    }

    const data = await res.json();
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_active: data.is_active } : u))
    );
  }

  async function handleDelete(user: UserRow) {
    const confirmed = window.confirm(
      `Delete ${user.email}? They will lose access immediately.`
    );
    if (!confirmed) return;

    setActionError("");
    const token = getToken();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setActionError(data?.detail || "Could not delete this user.");
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  async function openSessions(user: UserRow) {
    setSessionsUser(user);
    setSessionsLoading(true);
    setSessions([]);
    const token = getToken();

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.id}/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(res.ok ? await res.json() : []);
    } finally {
      setSessionsLoading(false);
    }
  }

  function closeSessions() {
    setSessionsUser(null);
    setSessions([]);
  }

  function distinctIpCount(list: SessionItem[]) {
    return new Set(list.map((s) => s.ip_address)).size;
  }

  function UserActions({ u, moderatable }: { u: UserRow; moderatable: boolean }) {
    return (
      <div className="flex gap-4 sm:gap-3 flex-wrap">
        <button
          onClick={() => openSessions(u)}
          className="text-accent hover:opacity-80 transition text-xs py-1"
        >
          View Sessions
        </button>
        {moderatable && (
          <>
            <button
              onClick={() => handleToggleBlock(u)}
              className="text-yellow-400 hover:opacity-80 transition text-xs py-1"
            >
              {u.is_active ? "Block" : "Unblock"}
            </button>
            <button
              onClick={() => handleDelete(u)}
              className="text-red-400 hover:opacity-80 transition text-xs py-1"
            >
              Delete
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Users</h1>
      <p className="text-sm text-gray-400 mb-5 sm:mb-6">All registered accounts.</p>

      {actionError && <p className="text-red-400 text-sm mb-4">{actionError}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {users.map((u) => {
              const moderatable = canModerate(myRole, u.role);
              return (
                <div key={u.id} className="bg-surface rounded-lg p-4 border border-white/5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{u.full_name || "—"}</p>
                      <p className="text-gray-400 text-xs truncate">{u.email}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 whitespace-nowrap">
                      {u.role}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs">
                    {u.is_premium ? (
                      <span className="text-green-400">Premium</span>
                    ) : (
                      <span className="text-gray-500">Free tier</span>
                    )}
                    {u.is_active ? (
                      <span className="text-green-400">Active</span>
                    ) : (
                      <span className="text-red-400">Blocked</span>
                    )}
                    <span className="text-gray-500">
                      Joined {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <UserActions u={u} moderatable={moderatable} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Premium</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const moderatable = canModerate(myRole, u.role);
                  return (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="py-3 pr-4">{u.full_name || "—"}</td>
                      <td className="py-3 pr-4 text-gray-300">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10">{u.role}</span>
                      </td>
                      <td className="py-3 pr-4">
                        {u.is_premium ? (
                          <span className="text-green-400 text-xs">Premium</span>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {u.is_active ? (
                          <span className="text-green-400 text-xs">Active</span>
                        ) : (
                          <span className="text-red-400 text-xs">Blocked</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <UserActions u={u} moderatable={moderatable} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {sessionsUser && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50"
          onClick={closeSessions}
        >
          <div
            className="bg-surface rounded max-w-lg w-full p-5 sm:p-6 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold break-words">
                Login history — {sessionsUser.email}
              </h2>
              <button
                onClick={closeSessions}
                className="text-gray-400 hover:text-white shrink-0 p-1 -m-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {sessionsLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-gray-400">No login history yet.</p>
            ) : (
              <>
                {distinctIpCount(sessions) >= 3 && (
                  <p className="text-sm text-yellow-400 mb-3">
                    ⚠ {distinctIpCount(sessions)} distinct IPs in recent logins — worth a closer look.
                  </p>
                )}
                <div className="max-h-80 overflow-y-auto flex flex-col gap-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="bg-background rounded p-3 text-sm">
                      <p className="font-medium break-all">{s.ip_address}</p>
                      <p className="text-gray-400 text-xs mt-1 break-words">
                        {s.user_agent || "Unknown device"}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(s.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
