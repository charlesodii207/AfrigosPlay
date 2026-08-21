"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type Film = {
  id: number;
  title: string;
  genre: string;
  release_year: number;
  poster_url: string;
};

const DEBOUNCE_MS = 400;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setFilms([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/?search=${encodeURIComponent(trimmed)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setFilms(data);
          setLoading(false);
          setSearched(true);
        })
        .catch(() => {
          setLoading(false);
          setSearched(true);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="px-4 sm:px-8 py-8">
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-6">Search</h1>

        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, genre, or director..."
          className="w-full max-w-xl bg-surface px-5 py-3.5 rounded-lg text-sm sm:text-base outline-none focus:ring-2 focus:ring-accent mb-8"
        />

        {loading && <p className="text-gray-400">Searching...</p>}

        {!loading && searched && films.length === 0 && (
          <p className="text-gray-400">No results for "{query.trim()}".</p>
        )}

        {!loading && films.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {films.map((film) => (
              <Link key={film.id} href={`/movies/${film.id}`} className="group">
                <div className="aspect-[2/3] w-full bg-surface rounded-md overflow-hidden transition-transform duration-200 group-hover:scale-105">
                  {film.poster_url && (
                    <img
                      src={film.poster_url}
                      alt={film.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm sm:text-base font-bold truncate">{film.title}</p>
                  <p className="text-xs text-gray-400">
                    {film.genre} • {film.release_year}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}