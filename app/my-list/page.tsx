"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type WatchlistItem = {
  id: number;
  film_id: number;
  film_title: string;
  film_genre: string;
  film_release_year: number;
};

export default function MyListPage() {
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }, [router]);

  async function handleRemove(filmId: number) {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${filmId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setItems((prev) => prev.filter((item) => item.film_id !== filmId));
    }
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      <div className="px-4 sm:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">My List</h1>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-400">
            Your list is empty. Browse movies and tap "+ My List" to save some here.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-surface rounded px-4 py-3"
              >
                <Link href={`/movies/${item.film_id}`} className="flex-1">
                  <p className="font-medium">{item.film_title}</p>
                  <p className="text-sm text-gray-400">
                    {item.film_genre} • {item.film_release_year}
                  </p>
                </Link>
                <button
                  onClick={() => handleRemove(item.film_id)}
                  className="text-sm text-red-400 hover:text-red-300 transition ml-4"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}