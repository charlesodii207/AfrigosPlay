"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import MovieRow from "@/components/MovieRow";
import GenreList from "@/components/GenreList";
import HeroSection from "@/components/HeroSection";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import LandingPage from "@/components/LandingPage";

type Film = {
  id: number;
  title: string;
  description: string;
  genre: string;
  release_year: number;
  duration_minutes: number;
  poster_url: string;
  backdrop_url?: string | null;
  trailer_url: string;
};

function toMovies(filmsArr: Film[]) {
  return filmsArr.map((f) => ({
    id: f.id,
    title: f.title,
    genre: f.genre,
    year: f.release_year,
    posterUrl: f.poster_url,
    backdropUrl: f.backdrop_url || undefined,
    trailerUrl: f.trailer_url,
    description: f.description,
  }));
}

function CatalogHome() {
  const [apiStatus, setApiStatus] = useState<{ status: string }>({ status: "checking" });
  const [films, setFilms] = useState<Film[]>([]);
  const [featured, setFeatured] = useState<Film | null>(null);
  const [trending, setTrending] = useState<Film[]>([]);
  const [top10, setTop10] = useState<Film[]>([]);
  const [nollywood, setNollywood] = useState<Film[]>([]);
  const [originals, setOriginals] = useState<Film[]>([]);
  const [myList, setMyList] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      const token = localStorage.getItem("access_token");

      const [
        healthRes,
        filmsRes,
        featuredRes,
        trendingRes,
        top10Res,
        nollywoodRes,
        originalsRes,
        watchlistRes,
      ] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/`).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/featured`).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/trending`).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/top10`).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/nollywood`).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/originals`).catch(() => null),
        token
          ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

      setApiStatus(healthRes && healthRes.ok ? await healthRes.json() : { status: "unreachable" });

      const allFilms: Film[] = filmsRes && filmsRes.ok ? await filmsRes.json() : [];
      setFilms(allFilms);

      if (featuredRes && featuredRes.ok) {
        const data = await featuredRes.json();
        setFeatured(data || null);
      } else {
        setFeatured(null);
      }

      setTrending(trendingRes && trendingRes.ok ? await trendingRes.json() : []);
      setTop10(top10Res && top10Res.ok ? await top10Res.json() : []);
      setNollywood(nollywoodRes && nollywoodRes.ok ? await nollywoodRes.json() : []);
      setOriginals(originalsRes && originalsRes.ok ? await originalsRes.json() : []);

      if (watchlistRes && watchlistRes.ok) {
        const items: { film_id: number }[] = await watchlistRes.json();
        const watchlistIds = new Set(items.map((i) => i.film_id));
        setMyList(allFilms.filter((f) => watchlistIds.has(f.id)));
      } else {
        setMyList([]);
      }

      setLoading(false);
    }

    loadAll();
  }, []);

  if (loading) {
    return <main className="min-h-screen bg-background" />;
  }

  const connected = apiStatus.status === "ok";
  const movies = toMovies(films);

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />

      {featured ? (
        <HeroSection film={featured} />
      ) : (
        <section className="h-[40vh] flex items-center justify-center text-gray-500 text-sm">
          No film is currently featured. An admin can set one from the Films dashboard.
        </section>
      )}

      <ContinueWatchingRow />

      <MovieRow title="My List" movies={toMovies(myList)} />
      <MovieRow title="Trending Now" movies={toMovies(trending)} />
      <MovieRow title="Top 10 Worldwide" movies={toMovies(top10)} showRank />
      <MovieRow title="Nollywood" movies={toMovies(nollywood)} />
      <MovieRow title="AFRIGOS PLAY Originals" movies={toMovies(originals)} />

      <MovieRow title="All Films" movies={movies} />
      <GenreList />

      <section className="px-4 sm:px-8 py-6 text-sm">
        <span className={connected ? "text-green-400" : "text-red-400"}>
          ● API status: {apiStatus.status}
        </span>
        <p className="text-gray-500 mt-1">
          This confirms the frontend can reach the FastAPI backend at{" "}
          {process.env.NEXT_PUBLIC_API_URL || "(NEXT_PUBLIC_API_URL not set)"}.
        </p>
      </section>
    </main>
  );
}

export default function Home() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setLoggedIn(!!token);
    setChecking(false);
  }, []);

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  return loggedIn ? <CatalogHome /> : <LandingPage />;
}
