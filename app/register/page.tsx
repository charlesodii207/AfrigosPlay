"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Registration failed");
        setLoading(false);
        return;
      }

      // Registered successfully — send them to login next.
      router.push("/login");
    } catch {
      setError("Could not reach the server. Is the backend running?");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      <div className="px-4 sm:px-8 py-12 max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-surface px-4 py-3 rounded text-sm sm:text-base outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surface px-4 py-3 rounded text-sm sm:text-base outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-surface px-4 py-3 rounded text-sm sm:text-base outline-none focus:ring-2 focus:ring-accent"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent px-4 py-3 rounded font-semibold text-sm sm:text-base disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>
    </main>
  );
}