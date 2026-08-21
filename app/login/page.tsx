"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        const data = await res.json();
        setError(data.detail || "Login failed");
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);

      router.push("/");
    } catch {
      setError("Could not reach the server. Is the backend running?");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-white relative overflow-hidden">
      <Navbar />

      {/* Subtle red glow, echoes the landing page hero */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(229,9,20,0.6) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 px-4 sm:px-8 py-16 sm:py-24 max-w-sm mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1 text-center">
          Welcome Back
        </h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          Log in to keep watching.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 bg-surface rounded-lg p-6 sm:p-8 shadow-2xl shadow-black"
        >
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background px-4 py-3.5 rounded text-sm sm:text-base outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-background px-4 py-3.5 rounded text-sm sm:text-base outline-none focus:ring-2 focus:ring-accent"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent px-4 py-3.5 rounded font-bold text-sm sm:text-base disabled:opacity-50 hover:opacity-90 transition mt-2"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          New to AFRI HUB?{" "}
          <Link href="/register" className="text-accent font-semibold hover:underline">
            Sign up now
          </Link>
        </p>
      </div>
    </main>
  );
}