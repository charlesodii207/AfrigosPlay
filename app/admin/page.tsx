"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminGatePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const adminRoles = ["admin", "super_admin", "system_owner"];

  // If already logged in as an admin, skip straight to the dashboard.
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setChecking(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && adminRoles.includes(data.role)) {
          router.push("/admin/dashboard");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Incorrect email or password");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Login succeeded — now check the role BEFORE granting admin access.
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const me = await meRes.json();

      if (!adminRoles.includes(me.role)) {
        // Same generic message as a bad password — never confirm the
        // account exists or that credentials were correct.
        setError("Incorrect email or password");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      router.push("/admin/dashboard");
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
  }

  if (checking) {
    return <main className="min-h-screen bg-background text-white flex items-center justify-center" />;
  }

  return (
    <main className="min-h-screen bg-background text-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-1">Admin Access</h1>
        <p className="text-sm text-gray-400 mb-6">
          Authorized personnel only. If you don't have admin credentials,
          this isn't the page you're looking for.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surface px-4 py-3 rounded text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-surface px-4 py-3 rounded text-sm outline-none focus:ring-2 focus:ring-accent"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent px-4 py-3 rounded font-semibold text-sm disabled:opacity-50"
          >
            {loading ? "Checking..." : "Log In"}
          </button>
        </form>
      </div>
    </main>
  );
}