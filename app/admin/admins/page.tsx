"use client";

import { useState, useEffect } from "react";

type UserRow = {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
};

const roleLabels: Record<string, string> = {
  system_owner: "SYSTEM OWNER",
  super_admin: "SUPER ADMIN",
  admin: "ADMINISTRATOR",
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setStaff(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold mb-1">Admins</h1>
      <p className="text-sm text-gray-400 mb-6">Manage staff accounts, tiers, and access.</p>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="py-3 pr-4">{u.full_name || "—"}</td>
                  <td className="py-3 pr-4 text-gray-300">{u.email}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}