"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const links = [
    { label: "Home", href: "/" },
    { label: "Movies", href: "/movies" },
    { label: "Genres", href: "/genres" },
    { label: "Search", href: "/search" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    router.push("/");
  }

  return (
    <nav className="relative flex items-center justify-between px-4 sm:px-8 py-5 bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/5">
      <div className="flex items-center gap-10">
        <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tight text-accent">
          Afrigos Play
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm font-semibold uppercase tracking-wide text-gray-300">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4 text-sm font-semibold">
        {isLoggedIn ? (
          <button onClick={handleLogout} className="text-gray-300 hover:text-white transition">
            Log Out
          </button>
        ) : (
          <>
            <Link href="/login" className="text-gray-300 hover:text-white transition">
              Login
            </Link>
            <Link
              href="/register"
              className="bg-accent px-5 py-2 rounded font-bold hover:opacity-90 transition"
            >
              Register
            </Link>
          </>
        )}
      </div>

      <button
        className="md:hidden text-white text-2xl"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-surface flex flex-col md:hidden z-50 border-t border-white/10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-6 py-4 border-b border-white/10 text-gray-200 font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="px-6 py-4 text-left text-gray-200 font-semibold"
            >
              Log Out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="px-6 py-4 border-b border-white/10 text-gray-200 font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-6 py-4 text-gray-200 font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}