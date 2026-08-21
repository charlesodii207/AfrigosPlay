"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Stats = {
  total_users: number;
  total_premium_subscribers: number;
  total_films: number;
  published_films: number;
  active_rentals: number;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 403 || res.status === 401) {
          router.push("/admin");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load dashboard.");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.push("/admin");
  }

  if (loading) {
    return <main className="min-h-screen bg-background text-white flex items-center justify-center" />;
  }

  const cards = stats
    ? [
        { label: "Total Users", value: stats.total_users },
        { label: "Premium Subscribers", value: stats.total_premium_subscribers },
        { label: "Total Films", value: stats.total_films },
        { label: "Published Films", value: stats.published_films },
        { label: "Active Rentals", value: stats.active_rentals },
      ]
    : [];

  return (
    <main className="min-h-screen bg-background text-white">
      <nav className="flex items-center justify-between px-4 sm:px-8 py-5 border-b border-white/10">
        <span className="text-xl font-bold">AFRI HUB Admin</span>
        <div className="flex items-center gap-4 text-sm">
          <a href="/admin/films/new" className="text-accent hover:opacity-80 transition">
            + Add Film
          </a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white transition">
            Log Out
          </button>
        </div>
      </nav>

      <div className="px-4 sm:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-surface rounded p-4">
              <p className="text-2xl sm:text-3xl font-bold">{card.value}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}