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
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close the mobile menu automatically if the viewport grows past the
  // breakpoint (e.g. rotating a tablet or resizing a browser window).
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 640) setMenuOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    <main className="min-h-[100dvh] bg-background text-white">
      <nav className="px-4 sm:px-8 py-4 sm:py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-lg sm:text-xl font-bold">Afrigos Play Admin</span>

          {/* Full nav links — visible from sm breakpoint up */}
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <a href="/admin/films/new" className="text-accent hover:opacity-80 transition">
              + Add Film
            </a>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white transition">
              Log Out
            </button>
          </div>

          {/* Hamburger toggle — mobile only */}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="sm:hidden p-2 -mr-2 text-gray-300 hover:text-white transition"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Collapsed dropdown panel — mobile only, shown when toggled */}
        {menuOpen && (
          <div className="sm:hidden mt-4 flex flex-col gap-1 border-t border-white/10 pt-4">
            <a
              href="/admin/films/new"
              className="text-accent text-sm px-2 py-2.5 rounded hover:bg-surface transition"
              onClick={() => setMenuOpen(false)}
            >
              + Add Film
            </a>
            <button
              onClick={handleLogout}
              className="text-left text-gray-400 text-sm px-2 py-2.5 rounded hover:bg-surface hover:text-white transition"
            >
              Log Out
            </button>
          </div>
        )}
      </nav>

      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">Dashboard Overview</h1>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-surface rounded p-3 sm:p-4">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{card.value}</p>
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
