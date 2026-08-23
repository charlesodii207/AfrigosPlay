"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

// How long the cursor has to sit on the hero before the trailer starts.
const HOVER_TO_PLAY_MS = 5000;
// How long each slide shows before auto-advancing to the next film.
// Set this to 5000 for a 5s slideshow, or 7000 for 7s.
const SLIDE_INTERVAL_MS = 7000;

export default function HeroSection({ films }: { films: Film[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const film = films[activeIndex];

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const clearSlideTimer = useCallback(() => {
    if (slideTimerRef.current) {
      clearTimeout(slideTimerRef.current);
      slideTimerRef.current = null;
    }
  }, []);

  const goToNextSlide = useCallback(() => {
    setActiveIndex((i) => (i + 1) % films.length);
  }, [films.length]);

  // Auto-advance the slideshow, but only while the user isn't hovering
  // (so it never yanks a film away mid-trailer).
  useEffect(() => {
    if (films.length <= 1 || isHovering) return;

    slideTimerRef.current = setTimeout(goToNextSlide, SLIDE_INTERVAL_MS);
    return () => clearSlideTimer();
  }, [activeIndex, isHovering, films.length, goToNextSlide, clearSlideTimer]);

  // Reset trailer state whenever the active film changes.
  useEffect(() => {
    setShowTrailer(false);
  }, [activeIndex]);

  function handleMouseEnter() {
    setIsHovering(true);
    clearSlideTimer();
    hoverTimerRef.current = setTimeout(() => setShowTrailer(true), HOVER_TO_PLAY_MS);
  }

  function handleMouseLeave() {
    setIsHovering(false);
    clearHoverTimer();
    setShowTrailer(false);
  }

  useEffect(() => {
    return () => {
      clearHoverTimer();
      clearSlideTimer();
    };
  }, [clearHoverTimer, clearSlideTimer]);

  if (!film) return null;

  const hours = Math.floor(film.duration_minutes / 60);
  const minutes = film.duration_minutes % 60;
  const heroImage = film.backdrop_url || film.poster_url;

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
        {/* renamed from "Featured" */}
        <p className="uppercase text-sm tracking-widest text-gray-300 mb-2">Spotlight</p>
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

      {films.length > 1 && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 flex gap-2 z-10">
          {films.map((f, i) => (
            <button
              key={f.id}
              onClick={() => {
                clearSlideTimer();
                setActiveIndex(i);
              }}
              aria-label={`Show ${f.title}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
