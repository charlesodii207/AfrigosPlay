"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

type UploadStatus = "idle" | "uploading" | "stalled" | "error" | "done";

interface UploadState {
  status: UploadStatus;
  percent: number;
  message: string;
}

const IDLE: UploadState = { status: "idle", percent: 0, message: "" };

// How long we'll wait without any progress before treating the upload as stalled/dead.
const STALL_TIMEOUT_MS = 15000;

// Shared XHR-based uploader. fetch() doesn't expose upload progress events,
// so we need XHR for the progress bar + stall detection.
function uploadWithProgress(
  url: string,
  token: string,
  file: File,
  onUpdate: (state: UploadState) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastLoaded = 0;
    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    let stalledByTimer = false;

    function armStallTimer() {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        stalledByTimer = true;
        onUpdate({
          status: "stalled",
          percent: Math.round((lastLoaded / (file.size || 1)) * 100),
          message: "Upload stalled — no progress for a while. Aborting, please retry.",
        });
        xhr.abort();
      }, STALL_TIMEOUT_MS);
    }

    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onloadstart = () => {
      onUpdate({ status: "uploading", percent: 0, message: "Starting upload..." });
      armStallTimer();
    };

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const percent = Math.round((e.loaded / e.total) * 100);
      onUpdate({
        status: "uploading",
        percent,
        message: `Uploading... ${(e.loaded / 1e6).toFixed(1)}MB / ${(e.total / 1e6).toFixed(1)}MB`,
      });
      if (e.loaded > lastLoaded) {
        lastLoaded = e.loaded;
        armStallTimer(); // progress happened, push the stall deadline forward
      }
    };

    xhr.onload = () => {
      if (stallTimer) clearTimeout(stallTimer);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          onUpdate({ status: "done", percent: 100, message: "Upload complete." });
          resolve(data);
        } catch {
          onUpdate({ status: "error", percent: 0, message: "Server returned an unexpected response." });
          reject(new Error("Bad JSON response"));
        }
      } else {
        let detail = `Upload failed (${xhr.status}).`;
        try {
          const data = JSON.parse(xhr.responseText);
          if (typeof data.detail === "string") detail = data.detail;
        } catch {
          /* ignore parse errors, use default message */
        }
        onUpdate({ status: "error", percent: 0, message: detail });
        reject(new Error(detail));
      }
    };

    xhr.onerror = () => {
      if (stallTimer) clearTimeout(stallTimer);
      onUpdate({ status: "error", percent: 0, message: "Network error — connection lost. Please retry." });
      reject(new Error("Network error"));
    };

    xhr.onabort = () => {
      if (stallTimer) clearTimeout(stallTimer);
      // If the stall timer triggered this abort, it already set a clearer "stalled" message.
      if (!stalledByTimer) {
        onUpdate({ status: "error", percent: 0, message: "Upload stopped. Please retry." });
      }
      reject(new Error("Aborted"));
    };

    const formData = new FormData();
    formData.append("file", file, file.name);
    xhr.send(formData);
  });
}

// Small presentational progress bar.
function UploadProgressBar({ state }: { state: UploadState }) {
  if (state.status === "idle") return null;

  const barColor =
    state.status === "error" || state.status === "stalled"
      ? "bg-red-500"
      : state.status === "done"
      ? "bg-green-500"
      : "bg-accent";

  const textColor =
    state.status === "error" || state.status === "stalled"
      ? "text-red-400"
      : state.status === "done"
      ? "text-green-400"
      : "text-gray-400";

  return (
    <div className="mt-2">
      <div className="w-full h-2.5 bg-surface rounded overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-150`}
          style={{ width: `${state.percent}%` }}
        />
      </div>
      <p className={`text-xs mt-1 ${textColor}`}>
        {state.message} {state.status === "uploading" ? `(${state.percent}%)` : ""}
      </p>
    </div>
  );
}

export default function EditFilmPage() {
  const router = useRouter();
  const params = useParams();
  const filmId = params.id as string;

  const [form, setForm] = useState({
    title: "",
    description: "",
    poster_url: "",
    backdrop_url: "",
    video_url: "",
    trailer_url: "",
    genre: "",
    director: "",
    cast: "",
    release_year: "",
    duration_minutes: "",
    language: "",
    country: "",
    age_rating: "",
    production_company: "",
    tags: "",
    status: "DRAFT",
    vip_pass_min_amount: "1000",
    industry: "other",
    is_afrihub_original: false,
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoState, setVideoState] = useState<UploadState>(IDLE);

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterState, setPosterState] = useState<UploadState>(IDLE);

  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [backdropState, setBackdropState] = useState<UploadState>(IDLE);

  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [trailerState, setTrailerState] = useState<UploadState>(IDLE);

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    // GET /{film_id} only returns PUBLISHED films, so we pull from
    // /admin/all (every status) and find this one client-side.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((films: any[]) => {
        const film = films.find((f) => f.id === Number(filmId));
        if (!film) {
          setError("Film not found.");
          setPageLoading(false);
          return;
        }

        setForm({
          title: film.title || "",
          description: film.description || "",
          poster_url: film.poster_url || "",
          backdrop_url: film.backdrop_url || "",
          video_url: film.video_url || "",
          trailer_url: film.trailer_url || "",
          genre: film.genre || "",
          director: film.director || "",
          cast: film.cast || "",
          release_year: String(film.release_year ?? ""),
          duration_minutes: String(film.duration_minutes ?? ""),
          language: film.language || "",
          country: film.country || "",
          age_rating: film.age_rating || "",
          production_company: film.production_company || "",
          tags: film.tags || "",
          status: film.status || "DRAFT",
          vip_pass_min_amount: String(film.vip_pass_min_amount ?? "1000"),
          industry: film.industry || "other",
          is_afrihub_original: Boolean(film.is_afrihub_original),
        });
        setPageLoading(false);
      })
      .catch(() => {
        setError("Could not load film.");
        setPageLoading(false);
      });
  }, [filmId, router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleUploadVideo() {
    if (!videoFile) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/admin");
      return;
    }
    setError("");
    try {
      const data = await uploadWithProgress(
        `${process.env.NEXT_PUBLIC_API_URL}/api/films/admin/upload-video`,
        token,
        videoFile,
        setVideoState
      );
      setForm((prev) => ({ ...prev, video_url: data.video_url }));
    } catch {
      // videoState already carries the error/stalled message for display
    }
  }

  async function handleUploadTrailer() {
    if (!trailerFile) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/admin");
      return;
    }
    setError("");
    try {
      const data = await uploadWithProgress(
        `${process.env.NEXT_PUBLIC_API_URL}/api/films/admin/upload-video`,
        token,
        trailerFile,
        setTrailerState
      );
      setForm((prev) => ({ ...prev, trailer_url: data.video_url }));
    } catch {
      // trailerState already carries the error/stalled message for display
    }
  }

  async function handleUploadImage(
    file: File | null,
    imageType: "poster" | "backdrop",
    setState: (s: UploadState) => void
  ) {
    if (!file) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/admin");
      return;
    }
    setError("");
    try {
      const data = await uploadWithProgress(
        `${process.env.NEXT_PUBLIC_API_URL}/api/films/admin/upload-image?image_type=${imageType}`,
        token,
        file,
        setState
      );
      setForm((prev) => ({
        ...prev,
        [imageType === "backdrop" ? "backdrop_url" : "poster_url"]: data.image_url,
      }));
    } catch {
      // setState already carries the error/stalled message for display
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/${filmId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          release_year: Number(form.release_year),
          duration_minutes: Number(form.duration_minutes),
          vip_pass_min_amount: Number(form.vip_pass_min_amount),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.detail === "string" ? data.detail : "Failed to update film");
        setLoading(false);
        return;
      }

      setSuccess("Film updated successfully!");
      setLoading(false);
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
  }

  const inputClass =
    "bg-surface px-4 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-accent w-full";
  const labelClass = "text-sm text-gray-400 mb-1 block";

  if (pageLoading) {
    return <div className="p-4 sm:p-6 md:p-8 text-gray-400">Loading...</div>;
  }

  const videoBusy = videoState.status === "uploading";
  const trailerBusy = trailerState.status === "uploading";
  const posterBusy = posterState.status === "uploading";
  const backdropBusy = backdropState.status === "uploading";

  const videoRetry = videoState.status === "error" || videoState.status === "stalled";
  const trailerRetry = trailerState.status === "error" || trailerState.status === "stalled";
  const posterRetry = posterState.status === "error" || posterState.status === "stalled";
  const backdropRetry = backdropState.status === "error" || backdropState.status === "stalled";

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">Edit Film</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input name="title" value={form.title} onChange={handleChange} required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Poster Image (500×750px, portrait)</label>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                setPosterFile(e.target.files?.[0] || null);
                setPosterState(IDLE);
              }}
              className="text-xs sm:text-sm text-gray-300 min-w-0 max-w-full"
            />
            <button
              type="button"
              onClick={() => handleUploadImage(posterFile, "poster", setPosterState)}
              disabled={!posterFile || posterBusy}
              className="bg-white/20 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {posterBusy ? "Uploading..." : posterRetry ? "Retry" : "Replace"}
            </button>
          </div>
          <UploadProgressBar state={posterState} />
          {form.poster_url && (
            <img src={form.poster_url} alt="Poster preview" className="mt-2 h-32 rounded object-cover" />
          )}
        </div>

        <div>
          <label className={labelClass}>Backdrop Image (1920×1080px, landscape)</label>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                setBackdropFile(e.target.files?.[0] || null);
                setBackdropState(IDLE);
              }}
              className="text-xs sm:text-sm text-gray-300 min-w-0 max-w-full"
            />
            <button
              type="button"
              onClick={() => handleUploadImage(backdropFile, "backdrop", setBackdropState)}
              disabled={!backdropFile || backdropBusy}
              className="bg-white/20 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {backdropBusy ? "Uploading..." : backdropRetry ? "Retry" : "Replace"}
            </button>
          </div>
          <UploadProgressBar state={backdropState} />
          {form.backdrop_url && (
            <img src={form.backdrop_url} alt="Backdrop preview" className="mt-2 w-full max-w-sm rounded object-cover" />
          )}
        </div>

        <div>
          <label className={labelClass}>Video File</label>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <input
              type="file"
              accept=".mp4,.mov,.mkv,.webm"
              onChange={(e) => {
                setVideoFile(e.target.files?.[0] || null);
                setVideoState(IDLE);
              }}
              className="text-xs sm:text-sm text-gray-300 min-w-0 max-w-full"
            />
            <button
              type="button"
              onClick={handleUploadVideo}
              disabled={!videoFile || videoBusy}
              className="bg-white/20 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {videoBusy ? "Uploading..." : videoRetry ? "Retry" : "Replace"}
            </button>
          </div>
          <UploadProgressBar state={videoState} />
          {form.video_url && (
            <p className="text-xs text-gray-500 mt-1 truncate">Current: {form.video_url}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Trailer Video</label>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <input
              type="file"
              accept=".mp4,.mov,.mkv,.webm"
              onChange={(e) => {
                setTrailerFile(e.target.files?.[0] || null);
                setTrailerState(IDLE);
              }}
              className="text-xs sm:text-sm text-gray-300 min-w-0 max-w-full"
            />
            <button
              type="button"
              onClick={handleUploadTrailer}
              disabled={!trailerFile || trailerBusy}
              className="bg-white/20 px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {trailerBusy ? "Uploading..." : trailerRetry ? "Retry" : "Replace"}
            </button>
          </div>
          <UploadProgressBar state={trailerState} />
          {form.trailer_url && (
            <p className="text-xs text-gray-500 mt-1 truncate">Current: {form.trailer_url}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Genre *</label>
            <input name="genre" value={form.genre} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Director *</label>
            <input name="director" value={form.director} onChange={handleChange} required className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Cast *</label>
          <input name="cast" value={form.cast} onChange={handleChange} required placeholder="Comma-separated names" className={inputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Release Year *</label>
            <input name="release_year" type="number" value={form.release_year} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Duration (minutes) *</label>
            <input name="duration_minutes" type="number" value={form.duration_minutes} onChange={handleChange} required className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Language</label>
            <input name="language" value={form.language} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input name="country" value={form.country} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Age Rating</label>
            <input name="age_rating" value={form.age_rating} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Production Company</label>
            <input name="production_company" value={form.production_company} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Tags</label>
          <input name="tags" value={form.tags} onChange={handleChange} placeholder="Comma-separated" className={inputClass} />
        </div>

        {/* --- Industry / collection tagging --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Industry</label>
            <select name="industry" value={form.industry} onChange={handleChange} className={inputClass}>
              <option value="nollywood">Nollywood</option>
              <option value="hollywood">Hollywood</option>
              <option value="bollywood">Bollywood</option>
              <option value="other">Other</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Drives the "Nollywood" rail on the homepage.
            </p>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 bg-surface px-4 py-2 rounded text-sm cursor-pointer min-h-[38px]">
              <input
                type="checkbox"
                name="is_afrihub_original"
                checked={form.is_afrihub_original}
                onChange={handleChange}
                className="w-4 h-4 accent-accent shrink-0"
              />
              Afrigos Play Original
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Drives the "Afrigos Play Originals" rail.
            </p>
          </div>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            <option value="DRAFT">Draft (hidden)</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="PUBLISHED">Published (live now)</option>
            <option value="UNPUBLISHED">Unpublished</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>VIP Pass Minimum Amount (₦)</label>
          <input
            name="vip_pass_min_amount"
            type="number"
            min={1}
            value={form.vip_pass_min_amount}
            onChange={handleChange}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            The minimum a non-subscriber must pay to unlock this film via VIP Pass.
          </p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent px-6 py-3 rounded font-semibold disabled:opacity-50 mt-2 w-full sm:w-auto"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
