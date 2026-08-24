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
        body: JSON.stringify({ identifier: email, password }),
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
    <main className="min-h-screen bg-background text-white relative overflow-hidden flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="relative max-w-sm w-full">
          {/* Glow */}
          <div
            className="absolute -inset-4 rounded-2xl opacity-40 blur-2xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(229,9,20,0.5) 0%, transparent 70%)" }}
          />

          <div className="relative bg-surface/80 backdrop-blur rounded-2xl border border-accent/20 shadow-[0_0_40px_rgba(229,9,20,0.15)] p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-center text-accent mb-1">
              AFRIGOS TV
            </h1>
            <p className="text-gray-400 text-sm text-center mb-8">
              Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background/80 border border-white/10 px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400">Password</label>
                  <Link href="/coming-soon" className="text-xs text-accent hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/80 border border-white/10 px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 bg-gradient-to-r from-accent to-red-500 px-4 py-3.5 rounded-lg font-bold text-sm shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_30px_rgba(229,9,20,0.6)] hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-accent font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}