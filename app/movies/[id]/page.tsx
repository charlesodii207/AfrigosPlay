"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";

type Film = {
  id: number;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url?: string | null;
  genre: string;
  director: string;
  cast: string;
  release_year: number;
  duration_minutes: number;
  vip_pass_min_amount: number;
};

type AccessCheck = {
  can_watch: boolean;
  reason: string;
};

export default function MovieDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [film, setFilm] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);

  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  const [access, setAccess] = useState<AccessCheck | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [showVipModal, setShowVipModal] = useState(false);
  const [vipAmount, setVipAmount] = useState("");
  const [vipQuantity, setVipQuantity] = useState(1);
  const [vipBusy, setVipBusy] = useState(false);
  const [vipError, setVipError] = useState("");
  const [vipCodes, setVipCodes] = useState<string[] | null>(null);

  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemError, setRedeemError] = useState("");

  function getToken() {
    return localStorage.getItem("access_token");
  }

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setFilm(data);
        setLoading(false);
      });
  }, [id]);

  function refreshAccess() {
    const token = getToken();
    if (!token) {
      setAccess(null);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/access/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAccess(data));
  }

  useEffect(() => {
    refreshAccess();

    const token = getToken();
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((items: { film_id: number }[]) => {
        setInWatchlist(items.some((item) => item.film_id === Number(id)));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleToggleWatchlist() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setWatchlistBusy(true);
    try {
      if (inWatchlist) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setInWatchlist(false);
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ film_id: Number(id) }),
        });
        if (res.ok) setInWatchlist(true);
      }
    } finally {
      setWatchlistBusy(false);
    }
  }

  function handleWatchNow() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    router.push(`/watch/${id}`);
  }

  async function handleSubscribe() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setActionBusy(true);
    setActionError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/subscribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setActionError("Subscription failed");
        return;
      }
      setActionMessage("You're now Premium! Unlimited access for 30 days.");
      refreshAccess();
    } finally {
      setActionBusy(false);
    }
  }

  function openVipModal() {
    setVipAmount("");
    setVipQuantity(1);
    setVipError("");
    setVipCodes(null);
    setShowVipModal(true);
  }

  function closeVipModal() {
    setShowVipModal(false);
  }

  async function handleVipPassSubmit() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const amountNum = Number(vipAmount);
    if (!amountNum || amountNum <= 0) {
      setVipError("Enter a valid amount.");
      return;
    }

    setVipBusy(true);
    setVipError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/vip-pass`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          film_id: Number(id),
          amount: amountNum,
          quantity: vipQuantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVipError(data.detail || "VIP Pass purchase failed.");
        return;
      }

      if (data.codes && data.codes.length > 0) {
        setVipCodes(data.codes);
      } else {
        setActionMessage(
          data.is_support_only
            ? "Thank you for supporting this film!"
            : "VIP Pass unlocked — you can watch this film anytime."
        );
        setShowVipModal(false);
      }

      refreshAccess();
    } finally {
      setVipBusy(false);
    }
  }

  function openRedeemModal() {
    setRedeemCode("");
    setRedeemError("");
    setShowRedeemModal(true);
  }

  function closeRedeemModal() {
    setShowRedeemModal(false);
  }

  async function handleRedeemSubmit() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (!redeemCode.trim()) {
      setRedeemError("Enter a code.");
      return;
    }

    setRedeemBusy(true);
    setRedeemError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/vip-pass/redeem`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ code: redeemCode.trim() }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setRedeemError(data.detail || "Could not redeem this code.");
        return;
      }

      setActionMessage(`Code redeemed! You now have access to ${data.film_title || "this film"}.`);
      setShowRedeemModal(false);
      refreshAccess();
    } finally {
      setRedeemBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="px-4 sm:px-8 py-16 text-center text-gray-400">Loading...</div>
      </main>
    );
  }

  if (!film) {
    return (
      <main className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="px-4 sm:px-8 py-16 text-center text-gray-400">Movie not found.</div>
      </main>
    );
  }

  const hours = Math.floor(film.duration_minutes / 60);
  const minutes = film.duration_minutes % 60;
  const isSubscriber = access?.reason === "premium";
  const minRequired = film.vip_pass_min_amount * vipQuantity;
  const heroImage = film.backdrop_url || film.poster_url;
  const hasRealBackdrop = Boolean(film.backdrop_url);

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />

      {/* ---------- BACKDROP HERO ---------- */}
      <div className="relative w-full">
        {/* Backdrop image: fixed aspect ratio on mobile (prevents crazy cropping), full-bleed height from md up */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-auto md:min-h-[85vh] overflow-hidden">
          {heroImage && (
            <img
              src={heroImage}
              alt=""
              aria-hidden="true"
              className={
                hasRealBackdrop
                  ? "absolute inset-0 w-full h-full object-cover object-top"
                  : "absolute inset-0 w-full h-full object-cover object-top scale-110 blur-2xl opacity-40"
              }
            />
          )}

          {/* Gradient overlays for depth + text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent md:via-background/70 md:to-background/10" />
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent" />
        </div>

        {/* Content: header row (poster + title/pills) on mobile, full overlay on md+ */}
        <div className="relative md:absolute md:inset-0 z-10 flex flex-col max-w-6xl mx-auto px-4 sm:px-6 md:px-8 -mt-16 sm:-mt-20 md:mt-0 md:pt-32 pb-8 md:pb-12 md:min-h-[85vh]">
          {/* Mobile/tablet: poster beside title + pills only (short content) */}
          <div className="flex md:hidden items-start gap-4">
            {film.poster_url && (
              <img
                src={film.poster_url}
                alt={film.title}
                className="w-24 sm:w-32 aspect-[2/3] object-cover rounded-lg shadow-2xl shadow-black/60 ring-1 ring-white/10 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 pt-1">
              <span className="inline-block uppercase text-[11px] tracking-[0.2em] font-semibold text-accent mb-2">
                {film.genre}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black leading-[0.98] tracking-tight mb-3 drop-shadow-lg">
                {film.title}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
                <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-gray-200">
                  {film.release_year}
                </span>
                <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-gray-200">
                  {hours}h {minutes}m
                </span>
                <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-gray-200">
                  {film.genre}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile/tablet: full-width body below the header row */}
          <div className="md:hidden pt-5">
            <p className="text-sm text-gray-200 leading-relaxed mb-5">{film.description}</p>

            <div className="flex flex-wrap gap-x-8 gap-y-3 mb-6 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Director</p>
                <p className="text-gray-100">{film.director}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Cast</p>
                <p className="text-gray-100">{film.cast}</p>
              </div>
            </div>

            {actionMessage && <p className="text-green-400 text-sm mb-3">{actionMessage}</p>}
            {actionError && <p className="text-red-400 text-sm mb-3">{actionError}</p>}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleWatchNow}
                className="flex items-center gap-2 bg-accent hover:brightness-110 transition px-6 py-3 rounded-md font-bold text-sm shadow-lg shadow-accent/20"
              >
                <span className="text-lg leading-none">▶</span> Watch Now
              </button>
              <button
                onClick={handleToggleWatchlist}
                disabled={watchlistBusy}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 transition px-6 py-3 rounded-md font-bold text-sm disabled:opacity-50"
              >
                {inWatchlist ? "✓ In My List" : "+ My List"}
              </button>
            </div>

            {isSubscriber && (
              <button
                onClick={openVipModal}
                className="block text-xs text-gray-400 hover:text-accent transition mt-4"
              >
                Enjoying this film? Get a VIP Pass to support it directly →
              </button>
            )}
          </div>

          {/* Desktop/tablet-landscape: full overlay hero (poster + everything beside it) */}
          <div className="hidden md:flex md:flex-row md:items-end gap-10">
            {film.poster_url && (
              <img
                src={film.poster_url}
                alt={film.title}
                className="w-56 aspect-[2/3] object-cover rounded-lg shadow-2xl shadow-black/60 ring-1 ring-white/10 flex-shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              <span className="inline-block uppercase text-xs tracking-[0.2em] font-semibold text-accent mb-3">
                {film.genre}
              </span>

              <h1 className="text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-4 drop-shadow-lg">
                {film.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mb-5 text-sm">
                <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-gray-200">
                  {film.release_year}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-gray-200">
                  {hours}h {minutes}m
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-gray-200">
                  {film.genre}
                </span>
              </div>

              <p className="text-base text-gray-200 max-w-2xl leading-relaxed mb-6">
                {film.description}
              </p>

              <div className="flex flex-wrap gap-x-8 gap-y-3 mb-7 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Director</p>
                  <p className="text-gray-100">{film.director}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Cast</p>
                  <p className="text-gray-100">{film.cast}</p>
                </div>
              </div>

              {actionMessage && <p className="text-green-400 text-sm mb-3">{actionMessage}</p>}
              {actionError && <p className="text-red-400 text-sm mb-3">{actionError}</p>}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleWatchNow}
                  className="flex items-center gap-2 bg-accent hover:brightness-110 transition px-8 py-3 rounded-md font-bold text-base shadow-lg shadow-accent/20"
                >
                  <span className="text-lg leading-none">▶</span> Watch Now
                </button>
                <button
                  onClick={handleToggleWatchlist}
                  disabled={watchlistBusy}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 transition px-8 py-3 rounded-md font-bold text-base disabled:opacity-50"
                >
                  {inWatchlist ? "✓ In My List" : "+ My List"}
                </button>
              </div>

              {isSubscriber && (
                <button
                  onClick={openVipModal}
                  className="block text-xs text-gray-400 hover:text-accent transition mt-4"
                >
                  Enjoying this film? Get a VIP Pass to support it directly →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- BELOW-THE-FOLD: ACCESS / UPSELL ---------- */}
      <div className="px-4 sm:px-8 py-10 max-w-6xl mx-auto">
        {access && !access.can_watch && (
          <div className="bg-surface border border-white/5 rounded-xl p-5 sm:p-7 max-w-md">
            <p className="text-sm text-gray-300 mb-5 leading-relaxed">
              You don't have access to this film yet. Subscribe for unlimited access, or get a
              VIP Pass to unlock just this one.
            </p>
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={handleSubscribe}
                disabled={actionBusy}
                className="bg-accent hover:brightness-110 transition px-4 py-2.5 rounded-md font-semibold text-sm disabled:opacity-50"
              >
                Subscribe to Premium (Demo — Free) — 30 days
              </button>
              <button
                onClick={openVipModal}
                disabled={actionBusy}
                className="bg-white/10 hover:bg-white/20 border border-white/10 transition px-4 py-2.5 rounded-md font-semibold text-sm disabled:opacity-50"
              >
                Get VIP Pass — from ₦{film.vip_pass_min_amount.toLocaleString()}
              </button>
            </div>
            <button
              onClick={openRedeemModal}
              className="text-xs text-gray-400 hover:text-white transition"
            >
              Have a VIP Pass code? Redeem it here
            </button>
          </div>
        )}
      </div>

      {showVipModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          onClick={closeVipModal}
        >
          <div
            className="bg-surface border border-white/10 rounded-xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {vipCodes ? (
              <>
                <h2 className="text-lg font-bold mb-2">You're in! 🎉</h2>
                <p className="text-sm text-gray-300 mb-4">
                  Share these codes with your friends — each one works once.
                </p>
                <div className="flex flex-col gap-2 mb-4">
                  {vipCodes.map((code) => (
                    <div
                      key={code}
                      className="bg-background rounded-md px-3 py-2 text-sm font-mono text-accent"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <button
                  onClick={closeVipModal}
                  className="bg-accent hover:brightness-110 transition px-4 py-2 rounded-md font-semibold text-sm w-full"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Get VIP Pass</h2>
                  <button onClick={closeVipModal} className="text-gray-400 hover:text-white">
                    ✕
                  </button>
                </div>

                {!isSubscriber && (
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1">
                      How many people is this for?
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={vipQuantity}
                      onChange={(e) => setVipQuantity(Math.max(1, Number(e.target.value)))}
                      className="bg-background px-3 py-2 rounded-md text-sm w-full outline-none focus:ring-2 focus:ring-accent"
                    />
                    {vipQuantity > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        You'll get access immediately, plus {vipQuantity - 1} code
                        {vipQuantity - 1 > 1 ? "s" : ""} to share with friends.
                      </p>
                    )}
                  </div>
                )}

                <label className="block text-xs text-gray-400 mb-1">
                  Amount (₦)
                  {!isSubscriber && (
                    <span className="text-gray-500"> — minimum ₦{minRequired.toLocaleString()}</span>
                  )}
                </label>
                <input
                  type="number"
                  min={1}
                  value={vipAmount}
                  onChange={(e) => setVipAmount(e.target.value)}
                  placeholder={isSubscriber ? "Any amount" : `${minRequired}`}
                  className="bg-background px-3 py-2 rounded-md text-sm w-full outline-none focus:ring-2 focus:ring-accent mb-3"
                />

                {vipError && <p className="text-red-400 text-sm mb-3">{vipError}</p>}

                <button
                  onClick={handleVipPassSubmit}
                  disabled={vipBusy}
                  className="bg-accent hover:brightness-110 transition px-4 py-2 rounded-md font-semibold text-sm w-full disabled:opacity-50"
                >
                  {vipBusy ? "Processing..." : "Confirm VIP Pass"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showRedeemModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          onClick={closeRedeemModal}
        >
          <div
            className="bg-surface border border-white/10 rounded-xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Redeem VIP Pass Code</h2>
              <button onClick={closeRedeemModal} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="VIP-XXXXXX"
              className="bg-background px-3 py-2 rounded-md text-sm w-full outline-none focus:ring-2 focus:ring-accent mb-3 font-mono"
            />

            {redeemError && <p className="text-red-400 text-sm mb-3">{redeemError}</p>}

            <button
              onClick={handleRedeemSubmit}
              disabled={redeemBusy}
              className="bg-accent hover:brightness-110 transition px-4 py-2 rounded-md font-semibold text-sm w-full disabled:opacity-50"
            >
              {redeemBusy ? "Redeeming..." : "Redeem"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
