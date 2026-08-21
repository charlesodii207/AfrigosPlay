"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

type Film = {
  id: number;
  title: string;
  video_url: string;
  duration_minutes: number;
};

type AccessCheck = {
  can_watch: boolean;
  reason: string;
};

const SAVE_INTERVAL_SECONDS = 15;

export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedAt = useRef(0);
  const resumePosition = useRef<number | null>(null);

  const [film, setFilm] = useState<Film | null>(null);
  const [access, setAccess] = useState<AccessCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeBanner, setResumeBanner] = useState(false);

  function getToken() {
    return localStorage.getItem("access_token");
  }

  function saveProgress(positionSeconds: number) {
    const token = getToken();
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watch-progress/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ film_id: Number(id), position_seconds: positionSeconds }),
      keepalive: true,
    }).catch(() => {});
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;

    const current = video.currentTime;
    if (current - lastSavedAt.current >= SAVE_INTERVAL_SECONDS) {
      lastSavedAt.current = current;
      saveProgress(current);
    }
  }

  function handlePauseOrEnd() {
    const video = videoRef.current;
    if (!video) return;
    saveProgress(video.currentTime);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;

    // Only resume if there's meaningful progress saved — skip the jump
    // for positions under 10s, since that's basically the start anyway.
    if (resumePosition.current && resumePosition.current > 10) {
      video.currentTime = resumePosition.current;
      setResumeBanner(true);
      setTimeout(() => setResumeBanner(false), 3000);
    }
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadEverything() {
      const accessRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/access/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!accessRes.ok) {
        setError("Could not verify access.");
        setLoading(false);
        return;
      }

      const accessData: AccessCheck = await accessRes.json();
      setAccess(accessData);

      if (!accessData.can_watch) {
        setLoading(false);
        return;
      }

      // Fetch saved position (if any) alongside the film — Continue
      // Watching list happens to include it, so pull that and find this film.
      const [filmRes, progressRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/${id}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watch-progress/continue-watching`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!filmRes.ok) {
        setError("Film not found.");
        setLoading(false);
        return;
      }

      const filmData = await filmRes.json();
      setFilm(filmData);

      if (progressRes.ok) {
        const progressList = await progressRes.json();
        const match = progressList.find((p: any) => p.film_id === Number(id));
        if (match) {
          resumePosition.current = match.position_seconds;
        }
      }

      setLoading(false);
    }

    loadEverything();

    function handleBeforeUnload() {
      const video = videoRef.current;
      if (video && !video.paused) {
        saveProgress(video.currentTime);
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  if (access && !access.can_watch) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg">You don't have access to this movie.</p>
        <button
          onClick={() => router.push(`/movies/${id}`)}
          className="bg-accent px-6 py-2 rounded font-semibold"
        >
          Subscribe or Get VIP Pass
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-8 py-4">
        <button
          onClick={() => router.push(`/movies/${id}`)}
          className="text-gray-300 hover:text-white text-sm"
        >
          ← Back to details
        </button>
        {film && <p className="text-sm text-gray-400">{film.title}</p>}
      </div>

      <div className="flex-1 flex items-center justify-center px-2 sm:px-8 pb-8 relative">
        {resumeBanner && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/80 text-sm px-4 py-2 rounded z-10">
            Resuming where you left off
          </div>
        )}
        {film && (
          <video
            ref={videoRef}
            controls
            autoPlay
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPause={handlePauseOrEnd}
            onEnded={handlePauseOrEnd}
            className="w-full max-w-5xl max-h-[80vh] rounded"
            src={film.video_url}
          >
            Your browser does not support video playback.
          </video>
        )}
      </div>
    </main>
  );
}