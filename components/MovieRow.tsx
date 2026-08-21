"use client";

import { useRef } from "react";
import MovieCard from "@/components/MovieCard";

type Movie = {
  id: number;
  title: string;
  genre: string;
  year: string | number;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  description?: string;
};

type MovieRowProps = {
  title: string;
  movies: Movie[];
  /** When true, each card shows a bold 1-based rank numeral (Top 10 row). */
  showRank?: boolean;
};

const SCROLL_AMOUNT = 600;

export default function MovieRow({ title, movies, showRank = false }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: "smooth",
    });
  }

  if (movies.length === 0) return null;

  return (
    <section className="px-4 sm:px-8 py-6 relative group/row">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">{title}</h2>

      <div className="relative">
        {/* Left scroll arrow */}
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-40 w-12 items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover/row:opacity-100 transition"
          aria-label="Scroll left"
        >
          <span className="w-9 h-9 rounded-full bg-black/70 flex items-center justify-center text-lg hover:bg-accent transition">
            ‹
          </span>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
        >
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              genre={movie.genre}
              year={movie.year}
              posterUrl={movie.posterUrl}
              backdropUrl={movie.backdropUrl}
              trailerUrl={movie.trailerUrl}
              description={movie.description}
              rank={showRank ? index + 1 : undefined}
            />
          ))}
        </div>

        {/* Right scroll arrow */}
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-40 w-12 items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover/row:opacity-100 transition"
          aria-label="Scroll right"
        >
          <span className="w-9 h-9 rounded-full bg-black/70 flex items-center justify-center text-lg hover:bg-accent transition">
            ›
          </span>
        </button>
      </div>
    </section>
  );
}
