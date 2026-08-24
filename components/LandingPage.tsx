"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Film = {
  id: number;
  title: string;
  poster_url: string;
  created_at: string;
};

const faqs = [
  {
    q: "What is AFRIGOS TV?",
    a: "AFRIGOS TV is a streaming platform where you can watch a growing catalogue of films. Subscribe for unlimited access, or unlock individual films one at a time with a VIP Pass — no subscription required.",
  },
  {
    q: "How much does it cost?",
    a: "A subscription starts at ₦2000 and gives you unlimited access to every film for 30 days. Prefer to pay for just one film? Get a VIP Pass for that title starting from ₦1,000 — it's yours to watch forever.",
  },
  {
    q: "What's a VIP Pass?",
    a: "A VIP Pass unlocks a single film permanently, without needing a subscription. You choose the amount (from a film's minimum), and if you're buying for a group, you can grab extra tickets and share codes with friends.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Your subscription simply runs for 30 days from when you subscribe — there's no auto-renewal to cancel. Subscribe again whenever you want to keep watching.",
  },
  {
    q: "Where can I watch?",
    a: "Right in your browser, on any device with an internet connection — phone, tablet, laptop, or desktop.",
  },
];

export default function LandingPage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Film[]) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setFilms(sorted.slice(0, 10));
      })
      .catch(() => setFilms([]));
  }, []);

  const features = [
    {
      title: "Watch on any device",
      description: "Stream from your phone, tablet, laptop, or desktop — no app install required.",
    },
    {
      title: "VIP Pass, your way",
      description: "Skip the subscription and unlock just the films you want, from as little as ₦1,000, forever.",
    },
    {
      title: "Pick up where you left off",
      description: "We remember exactly where you stopped, so every film continues right from that moment.",
    },
    {
      title: "Build your watchlist",
      description: "Save titles to My List the moment you find them, and come back whenever you're ready.",
    },
  ];

  // A handful of posters for the hero backdrop collage — just the first 6,
  // doesn't need to be the same set as the "Latest Movies" row below.
  const backdropPosters = films.slice(0, 6);

  return (
    <main className="min-h-screen bg-background text-white">
      <header className="flex items-center justify-between px-4 sm:px-8 py-5 relative z-20">
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-accent">AFRIGOS TV</span>
        <div className="flex items-center gap-3">
          <Link
            href="/subscribe"
            className="hidden sm:inline text-sm text-gray-300 hover:text-white transition px-3 py-2"
          >
            Subscription
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-300 hover:text-white transition px-3 py-2"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="bg-accent px-4 py-2 rounded font-semibold text-sm"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero — layered poster collage + gradient glow behind the text */}
      <section className="relative overflow-hidden">
        {/* Blurred poster collage backdrop */}
        {backdropPosters.length > 0 && (
          <div className="absolute inset-0 flex opacity-40">
            {backdropPosters.map((film) => (
              <div key={film.id} className="flex-1 h-full">
                {film.poster_url && (
                  <img
                    src={film.poster_url}
                    alt=""
                    className="w-full h-full object-cover blur-sm scale-110"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Accent color glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 60%, var(--color-background, #0a0a0a) 100%)",
          }}
        />
        <div
          className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[140%] h-[80%] opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(229,9,20,0.5) 0%, transparent 70%)",
          }}
        />

        {/* Fade to solid background at the bottom, so the trending row sits on flat black */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 px-4 sm:px-8 py-20 sm:py-28 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 leading-[1.05]">
            Unlimited films.
            <br />
            Your way.
          </h1>
          <p className="text-gray-200 text-base sm:text-xl mb-2 font-light">
            Subscribe for unlimited streaming, starting at ₦2000.
          </p>
          <p className="text-gray-400 text-sm sm:text-base mb-10 font-light">
            Or unlock any single film with a VIP Pass, from ₦1,000 — no subscription needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/subscribe"
              className="bg-accent px-8 py-3.5 rounded font-semibold text-sm sm:text-base"
            >
              View Subscription Plans
            </Link>
            <Link
              href="/register"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm transition px-8 py-3.5 rounded font-semibold text-sm sm:text-base"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Latest movies row */}
      {films.length > 0 && (
        <section className="pb-16">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight px-4 sm:px-8 mb-4">
            Latest Movies For You
          </h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-8 pb-2">
            {films.map((film, index) => (
              <div key={film.id} className="flex-shrink-0 flex items-end">
                <span className="text-5xl sm:text-7xl font-black text-white/10 leading-none -mr-3 sm:-mr-4 select-none">
                  {index + 1}
                </span>
                <div className="w-24 sm:w-32 md:w-36 aspect-[2/3] bg-surface rounded-md overflow-hidden relative z-10">
                  {film.poster_url && (
                    <img
                      src={film.poster_url}
                      alt={film.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feature grid */}
      <section className="px-4 sm:px-8 py-16 border-t border-white/10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-12">
          Why You'll Love It Here
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {features.map((feature) => (
            <div key={feature.title} className="bg-surface rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="px-4 sm:px-8 py-16 border-t border-white/10 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="flex flex-col gap-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={faq.q} className="bg-surface rounded overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-sm sm:text-base">{faq.q}</span>
                  <span className="text-xl text-gray-400">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed font-light">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-8 py-20 text-center border-t border-white/10">
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
          Ready to watch?
        </h2>
        <p className="text-gray-400 text-sm sm:text-base mb-8 font-light">
          Join in seconds. Start with a subscription or a single VIP Pass — your choice.
        </p>
        <Link
          href="/register"
          className="bg-accent px-8 py-3.5 rounded font-semibold text-sm sm:text-base inline-block"
        >
          Create Your Free Account
        </Link>
      </section>

      <footer className="px-4 sm:px-8 py-8 text-center text-xs text-gray-500 border-t border-white/10">
        © {new Date().getFullYear()} AFRIGOS TV. All rights reserved.
      </footer>
    </main>
  );
}