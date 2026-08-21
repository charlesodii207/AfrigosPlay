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

export default function MoviesPage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setFilms(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="px-4 sm:px-8 py-8">
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-8">All Movies</h1>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : films.length === 0 ? (
          <p className="text-gray-400">No films available yet.</p>
        ) : (
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