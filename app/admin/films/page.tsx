"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Film = {
  id: number;
  title: string;
  genre: string;
  release_year: number;
  status: string;
  is_featured: boolean;
};

export default function AdminFilmsPage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadFilms() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setFilms(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadFilms();
  }, []);

  async function patchFilm(filmId: number, body: object) {
    const token = localStorage.getItem("access_token");
    if (!token) return false;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/${filmId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    return res.ok;
  }

  async function handleToggleStatus(film: Film) {
    const newStatus = film.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
    const ok = await patchFilm(film.id, { status: newStatus });
    if (ok) loadFilms();
    else setError("Failed to update status");
  }

  async function handleSetFeatured(film: Film) {
    const ok = await patchFilm(film.id, { is_featured: true });
    if (ok) loadFilms();
    else setError("Failed to set featured film");
  }

  async function handleUnfeature(film: Film) {
    const ok = await patchFilm(film.id, { is_featured: false });
    if (ok) loadFilms();
    else setError("Failed to unfeature film");
  }

  async function handleDelete(film: Film) {
    if (!confirm(`Delete "${film.title}"? This cannot be undone.`)) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/${film.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFilms((prev) => prev.filter((f) => f.id !== film.id));
      } else {
        let detail = `Failed to delete film (status ${res.status})`;
        try {
          const data = await res.json();
          if (typeof data.detail === "string") detail = data.detail;
        } catch {
          // response wasn't JSON, keep the default message
        }
        console.error("Delete failed:", detail);
        setError(detail);
      }
    } catch (err) {
      console.error("Delete request threw:", err);
      setError("Could not reach the server to delete this film.");
    }
  }

  const statusColors: Record<string, string> = {
    PUBLISHED: "bg-green-500/20 text-green-400",
    DRAFT: "bg-gray-500/20 text-gray-400",
    UNPUBLISHED: "bg-yellow-500/20 text-yellow-400",
    ARCHIVED: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Films</h1>
          <p className="text-sm text-gray-400">Manage the catalogue.</p>
        </div>
        <Link
          href="/admin/films/new"
          className="bg-accent px-4 py-2 rounded font-semibold text-sm"
        >
          + Add Film
        </Link>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Genre</th>
                <th className="py-2 pr-4">Year</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Featured</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {films.map((film) => (
                <tr key={film.id} className="border-b border-white/5">
                  <td className="py-3 pr-4">{film.title}</td>
                  <td className="py-3 pr-4 text-gray-300">{film.genre}</td>
                  <td className="py-3 pr-4 text-gray-300">{film.release_year}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        statusColors[film.status] || "bg-white/10"
                      }`}
                    >
                      {film.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {film.is_featured ? (
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-accent/20 text-accent">
                        ★ Featured
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/films/${film.id}/edit`}
                        className="text-white hover:text-accent text-xs"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(film)}
                        className="text-accent hover:opacity-80 text-xs"
                      >
                        {film.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>
                      {film.is_featured ? (
                        <button
                          onClick={() => handleUnfeature(film)}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          Unfeature
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSetFeatured(film)}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          Set Featured
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(film)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
