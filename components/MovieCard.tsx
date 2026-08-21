"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type MovieCardProps = {
  id: number;
  title: string;
  genre: string;
  year: string | number;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  description?: string;
  progressPercent?: number;
  /** 1-based rank — when set, renders a bold numeral beside the poster
   * (Top 10 row). Omit for every other row. */
  rank?: number;
};

const TRAILER_DELAY_MS = 3000;

export default function MovieCard({
  id,
  title,
  genre,
  year,
  posterUrl,
  backdropUrl,
  trailerUrl,
  description,
  progressPercent,
  rank,
}: MovieCardProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const trailerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hovered && trailerUrl) {
      trailerTimer.current = setTimeout(() => setShowTrailer(true), TRAILER_DELAY_MS);
    } else {
      if (trailerTimer.current) clearTimeout(trailerTimer.current);
      setShowTrailer(false);
    }
    return () => {
      if (trailerTimer.current) clearTimeout(trailerTimer.current);
    };
  }, [hovered, trailerUrl]);

  function goToDetails() {
    router.push(`/movies/${id}`);
  }

  const previewImage = backdropUrl || posterUrl;
  const hasRank = typeof rank === "number";

  const posterBlock = (
    <div className="aspect-[2/3] w-full bg-surface rounded-md overflow-hidden relative">
      {posterUrl ? (
        <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
      ) : (
        <span className="text-gray-500 text-xs px-2 text-center flex items-center justify-center h-full">
          {title}
        </span>
      )}
      {typeof progressPercent === "number" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-accent"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`flex-shrink-0 relative ${
        hasRank
          ? "w-[58vw] sm:w-[38vw] md:w-[29vw] lg:w-[24vw] xl:w-[21vw]"
          : "w-[46vw] sm:w-[30vw] md:w-[23vw] lg:w-[19vw] xl:w-[17vw]"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Base card — whole thing is clickable */}
      <div onClick={goToDetails} className="cursor-pointer">
        {hasRank ? (
          <div className="flex items-end">
            <span
              className="shrink-0 leading-[0.8] font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-400 to-gray-700 [-webkit-text-stroke:2px_rgba(255,255,255,0.15)] text-[4.5rem] sm:text-[5.5rem] md:text-[6.5rem] select-none pointer-events-none -mr-3 sm:-mr-4 md:-mr-5"
              aria-hidden="true"
            >
              {rank}
            </span>
            <div className="relative z-10 flex-1 min-w-0">{posterBlock}</div>
          </div>
        ) : (
          posterBlock
        )}

        <div className={`mt-2 ${hasRank ? "pl-[3.2rem] sm:pl-[4.2rem] md:pl-[5rem]" : ""}`}>
          <p className="text-base sm:text-lg font-bold truncate">{title}</p>
          <p className="text-xs sm:text-sm text-gray-400">
            {genre} • {year}
          </p>
        </div>
      </div>

      {/* Floating preview */}
      <div
        onClick={goToDetails}
        className={`hidden md:block absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-surface rounded-lg shadow-2xl shadow-black overflow-hidden transition-all duration-150 origin-center cursor-pointer ${
          hovered
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none"
        }`}
      >
        <div className="aspect-video w-full bg-black relative">
          {showTrailer && trailerUrl ? (
            <video
              src={trailerUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            previewImage && (
              <img src={previewImage} alt={title} className="w-full h-full object-cover" />
            )
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent pointer-events-none" />
        </div>
        <div className="p-4">
          <p className="text-xl font-black mb-1 leading-tight">{title}</p>
          <p className="text-xs text-gray-400 mb-2">
            {genre} • {year}
          </p>
          {description && (
            <p className="text-xs text-gray-300 leading-relaxed mb-3 line-clamp-3">
              {description}
            </p>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToDetails();
            }}
            className="w-full bg-white/10 hover:bg-white/20 transition text-sm font-bold py-2.5 rounded"
          >
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}
