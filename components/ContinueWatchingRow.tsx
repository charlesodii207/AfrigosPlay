"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ContinueWatchingItem = {
  film_id: number;
  title: string;
  poster_url: string;
  genre: string;
  release_year: number;
  duration_minutes: number;
  position_seconds: number;
  progress_percent: number;
  updated_at: string;
};

export default function ContinueWatchingRow() {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);

  function loadItems() {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watch-progress/continue-watching`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleRemove(e: React.MouseEvent, filmId: number) {
    e.preventDefault(); // don't navigate — this is inside a <Link>
    e.stopPropagation();

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/watch-progress/${filmId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.ok) {
      setItems((prev) => prev.filter((item) => item.film_id !== filmId));
    }
  }

  // Not logged in, still loading, or nothing in progress — render nothing
  // rather than an empty row.
  if (loading || items.length === 0) {
    return null;
  }

  return (
    <section className="px-4 sm:px-8 py-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Continue Watching</h2>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <Link
            key={item.film_id}
            href={`/watch/${item.film_id}`}
            className="flex-shrink-0 w-32 sm:w-40 md:w-48 cursor-pointer group relative"
          >
            <div className="aspect-[2/3] w-full bg-surface rounded-md overflow-hidden flex items-center justify-center transition-transform duration-200 group-hover:scale-105 relative">
              {item.poster_url ? (
                <img
                  src={item.poster_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 text-xs px-2 text-center">{item.title}</span>
              )}

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${item.progress_percent}%` }}
                />
              </div>

              <button
                onClick={(e) => handleRemove(e, item.film_id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                aria-label="Remove from Continue Watching"
                title="Remove from Continue Watching"
              >
                ✕
              </button>
            </div>

            <div className="mt-2">
              <p className="text-sm sm:text-base font-medium truncate">{item.title}</p>
              <p className="text-xs text-gray-400">
                {item.genre} • {item.release_year}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}