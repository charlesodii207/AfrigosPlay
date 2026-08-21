"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Could not change password");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-background text-white flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-[22rem] sm:max-w-sm">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Set a New Password</h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-5 sm:mb-6 leading-relaxed">
          You&apos;re using a temporary password. Choose a new one to continue.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
          <input
            type="password"
            placeholder="Temporary password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="bg-surface px-4 py-3 rounded text-sm outline-none focus:ring-2 focus:ring-accent w-full"
          />
          <input
            type="password"
            placeholder="New password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-surface px-4 py-3 rounded text-sm outline-none focus:ring-2 focus:ring-accent w-full"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-surface px-4 py-3 rounded text-sm outline-none focus:ring-2 focus:ring-accent w-full"
          />

          {error && <p className="text-red-400 text-xs sm:text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent px-4 py-3 rounded font-semibold text-sm disabled:opacity-50 w-full active:scale-[0.99] transition-transform"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
