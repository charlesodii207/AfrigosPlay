"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

export default function HeroSection({ film }: { film: Film }) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [muted, setMuted] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hours = Math.floor(film.duration_minutes / 60);
  const minutes = film.duration_minutes % 60;
  const heroImage = film.backdrop_url || film.poster_url;

  useEffect(() => {
    timerRef.current = setTimeout(() => setShowTrailer(true), 8000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [film.id]);

  function handleMouseEnter() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTrailer(true);
  }

  function handleMouseLeave() {
    setShowTrailer(false);
    timerRef.current = setTimeout(() => setShowTrailer(true), 8000);
  }

  return (
    <section
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-start justify-end h-[70vh] sm:h-[85vh] px-4 sm:px-8 pb-10 sm:pb-16 overflow-hidden"
    >
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
          showTrailer ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {film.trailer_url && (
        <video
          ref={videoRef}
          key={film.id}
          src={film.trailer_url}
          autoPlay
          loop
          muted={muted}
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            showTrailer ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

      <div className="relative max-w-xl">
        <p className="uppercase text-sm tracking-widest text-gray-300 mb-2">Featured</p>
        <h1 className="text-3xl sm:text-6xl font-bold mb-3">{film.title}</h1>
        <p className="text-sm sm:text-base text-gray-200 mb-2">
          {film.genre} • {film.release_year} • {hours}h {minutes}m
        </p>
        <p className="text-sm sm:text-base text-gray-300 mb-6 line-clamp-3">
          {film.description}
        </p>
        <div className="flex gap-3 items-center">
          <Link
            href={`/watch/${film.id}`}
            className="bg-accent px-4 sm:px-6 py-2 rounded font-semibold text-sm sm:text-base"
          >
            ▶ Watch Now
          </Link>
          <Link
            href={`/movies/${film.id}`}
            className="bg-white/20 px-4 sm:px-6 py-2 rounded font-semibold text-sm sm:text-base"
          >
            More Info
          </Link>

          {showTrailer && film.trailer_url && (
            <button
              onClick={() => setMuted((m) => !m)}
              className="bg-white/20 rounded-full w-9 h-9 flex items-center justify-center text-sm"
              aria-label={muted ? "Unmute trailer" : "Mute trailer"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}