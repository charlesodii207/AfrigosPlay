"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

type Me = {
  full_name: string | null;
  email: string;
  role: string;
  must_change_password: boolean;
};

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/users" },
  { label: "Admins", href: "/admin/admins" },
  { label: "Films", href: "/admin/films" },
  { label: "Settings", href: "/admin/settings" },
];

const roleLabels: Record<string, string> = {
  system_owner: "SYSTEM OWNER",
  super_admin: "SUPER ADMIN",
  admin: "ADMINISTRATOR",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const isPublicPath = pathname === "/admin";
  const isChangePasswordPath = pathname === "/admin/change-password";

  useEffect(() => {
    if (isPublicPath) {
      setChecked(true);
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !["admin", "super_admin", "system_owner"].includes(data.role)) {
          router.push("/admin");
          return;
        }

        // Force a password change before reaching any other admin page.
        if (data.must_change_password && !isChangePasswordPath) {
          router.push("/admin/change-password");
          return;
        }

        setMe(data);
        setChecked(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.push("/admin");
  }

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (!checked) {
    return <div className="min-h-screen bg-background" />;
  }

  // Change-password page renders full-screen, without the sidebar.
  if (isChangePasswordPath) {
    return <>{children}</>;
  }

  const sidebarInner = (
    <>
      <div>
        <div className="text-xl font-bold text-accent mb-6">AFRIGOS PLAY</div>

        {me && (
          <div className="bg-surface rounded p-3 mb-6">
            <p className="text-sm font-medium truncate">{me.full_name || me.email}</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-semibold">
              {roleLabels[me.role] || me.role.toUpperCase()}
            </span>
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded text-sm ${
                pathname === item.href
                  ? "bg-accent text-white"
                  : "text-gray-300 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="text-red-400 hover:text-red-300 text-sm text-left px-3 py-2"
      >
        Log Out
      </button>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-background text-white md:flex">
      {/* Mobile top bar — hidden from md up */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-lg font-bold text-accent">AFRIGOS PLAY</span>
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          className="p-2 -mr-2 text-gray-300 hover:text-white transition"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Mobile off-canvas drawer */}
      {navOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[80vw] bg-background border-r border-white/10 flex flex-col justify-between p-4 overflow-y-auto">
            <div className="flex items-center justify-end mb-2">
              <button
                onClick={() => setNavOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-2 text-gray-300 hover:text-white transition"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {sidebarInner}
          </aside>
        </div>
      )}

      {/* Desktop static sidebar — unchanged, visible from md up */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-white/10 flex-col justify-between p-4">
        {sidebarInner}
      </aside>

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
