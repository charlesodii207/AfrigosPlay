"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service to continue");
      return;
    }

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

      router.push("/login");
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
              Afrigos Play
            </h1>
            <p className="text-gray-400 text-sm text-center mb-8">
              Create your account
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Full name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-background/80 border border-white/10 px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
                />
              </div>

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
                <label className="block text-xs text-gray-400 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/80 border border-white/10 px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Confirm password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background/80 border border-white/10 px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-gray-400 select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 accent-accent"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/coming-soon" className="text-accent hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/coming-soon" className="text-accent hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 bg-gradient-to-r from-accent to-red-500 px-4 py-3.5 rounded-lg font-bold text-sm shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_30px_rgba(229,9,20,0.6)] hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-accent font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}