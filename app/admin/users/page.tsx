"use client";

import { useState, useEffect, useMemo } from "react";
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

const premiumFilterTabs = [
  { key: "all", label: "ALL" },
  { key: "premium", label: "PREMIUM" },
  { key: "free", label: "FREE TIER" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [premiumFilter, setPremiumFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");

  const [sessionsUser, setSessionsUser] = useState<UserRow | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  function getToken() {
    return localStorage.getItem("access_token");
  }

  function loadUsers() {
    const token = getToken();
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((usersData) => {
        setUsers(usersData);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users
      .filter((u) => {
        if (premiumFilter === "premium") return u.is_premium;
        if (premiumFilter === "free") return !u.is_premium;
        return true;
      })
      .filter((u) => {
        if (!q) return true;
        return (
          (u.full_name || "").toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return (a.full_name || a.email).localeCompare(b.full_name || b.email);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [users, search, premiumFilter, sortBy]);

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

  function UserActions({ u }: { u: UserRow }) {
    return (
      <div className="flex gap-4 sm:gap-3 flex-wrap">
        <button
          onClick={() => openSessions(u)}
          className="text-accent hover:opacity-80 transition text-xs py-1"
        >
          View Sessions
        </button>
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
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Users</h1>
      <p className="text-sm text-gray-400 mb-5">All registered accounts.</p>

      {/* Search + sort controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 sm:max-w-xs bg-surface border border-white/10 px-4 py-2.5 rounded text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "date")}
          className="bg-surface border border-white/10 px-3 py-2.5 rounded text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="date">Sort: Date Joined</option>
          <option value="name">Sort: Alphabetical</option>
        </select>
      </div>

      {/* Premium filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {premiumFilterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPremiumFilter(tab.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              premiumFilter === tab.key
                ? "bg-accent text-white"
                : "bg-surface text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {actionError && <p className="text-red-400 text-sm mb-4">{actionError}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : displayedUsers.length === 0 ? (
        <p className="text-gray-400 text-sm">No users match your search.</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {displayedUsers.map((u) => (
              <div key={u.id} className="bg-surface rounded-lg p-4 border border-white/5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{u.full_name || "—"}</p>
                    <p className="text-gray-400 text-xs truncate">{u.email}</p>
                  </div>
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
                  <UserActions u={u} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Premium</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="py-3 pr-4">{u.full_name || "—"}</td>
                    <td className="py-3 pr-4 text-gray-300">{u.email}</td>
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
                      <UserActions u={u} />
                    </td>
                  </tr>
                ))}
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