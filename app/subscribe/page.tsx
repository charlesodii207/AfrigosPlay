"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const MONTHLY_PRICE = 2000;
const YEARLY_FULL_PRICE = MONTHLY_PRICE * 12;
const MONTHLY_FIRST_MONTH = Math.round(MONTHLY_PRICE * 0.8);
const YEARLY_DISCOUNTED = Math.round(YEARLY_FULL_PRICE * 0.7);

export default function SubscribePage() {
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ plan: string; amount: number } | null>(null);

  function getToken() {
    return localStorage.getItem("access_token");
  }

  async function handleSubscribe(plan: "monthly" | "yearly") {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setBusyPlan(plan);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Subscription failed");
        setBusyPlan(null);
        return;
      }

      setSuccess({ plan: data.plan, amount: data.amount_charged });
    } catch {
      setError("Could not reach the server.");
      setBusyPlan(null);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-3xl font-black mb-3">You&apos;re Premium! 🎉</h1>
          <p className="text-gray-400 max-w-sm mb-2">
            {success.plan === "monthly" ? "Monthly" : "Yearly"} plan activated — demo charge of{" "}
            <span className="text-white font-semibold">₦{success.amount.toLocaleString()}</span>.
          </p>
          <p className="text-gray-500 text-sm max-w-sm mb-8">
            No real payment was taken — this is demo mode. You now have unlimited access to every movie.
          </p>
          <button
            onClick={() => router.push("/movies")}
            className="bg-accent px-6 py-3 rounded font-semibold text-sm hover:opacity-90 transition"
          >
            Start Watching
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-white relative overflow-hidden">
      <Navbar />

      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(229,9,20,0.5) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 px-4 sm:px-8 py-16 sm:py-20 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
          Unlock Every Movie
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto mb-12">
          One subscription, unlimited access. Cancel anytime — this is demo mode, so no card is
          ever charged.
        </p>

        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
          {/* Monthly */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col">
            <p className="text-sm text-gray-400 mb-1">Monthly</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black">₦{MONTHLY_FIRST_MONTH.toLocaleString()}</span>
              <span className="text-gray-500 text-sm line-through">
                ₦{MONTHLY_PRICE.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-accent font-semibold mb-6">
              20% off your first month, then ₦{MONTHLY_PRICE.toLocaleString()}/month
            </p>

            <ul className="text-sm text-gray-300 flex flex-col gap-2 mb-8 flex-1">
              <li>✓ Unlimited movies, no VIP Pass needed</li>
              <li>✓ Watch on any device</li>
              <li>✓ Cancel anytime</li>
            </ul>

            <button
              onClick={() => handleSubscribe("monthly")}
              disabled={busyPlan !== null}
              className="bg-accent px-4 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {busyPlan === "monthly" ? "Activating..." : "Subscribe Monthly"}
            </button>
          </div>

          {/* Yearly */}
          <div className="bg-surface border border-accent/40 rounded-2xl p-6 sm:p-8 flex flex-col relative">
            <span className="absolute -top-3 right-6 bg-accent text-xs font-bold px-3 py-1 rounded-full">
              SAVE 30%
            </span>
            <p className="text-sm text-gray-400 mb-1">Yearly</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black">₦{YEARLY_DISCOUNTED.toLocaleString()}</span>
              <span className="text-gray-500 text-sm line-through">
                ₦{YEARLY_FULL_PRICE.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-accent font-semibold mb-6">
              ₦{Math.round(YEARLY_DISCOUNTED / 12).toLocaleString()}/month, billed yearly
            </p>

            <ul className="text-sm text-gray-300 flex flex-col gap-2 mb-8 flex-1">
              <li>✓ Everything in Monthly</li>
              <li>✓ Best value — 30% off all year</li>
              <li>✓ Cancel anytime</li>
            </ul>

            <button
              onClick={() => handleSubscribe("yearly")}
              disabled={busyPlan !== null}
              className="bg-accent px-4 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {busyPlan === "yearly" ? "Activating..." : "Subscribe Yearly"}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-10">
          Prefer to just support a specific film instead? You can do that from any movie&apos;s
          page — no subscription required.
        </p>
      </div>
    </main>
  );
}