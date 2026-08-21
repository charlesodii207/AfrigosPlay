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

  return (
    <div className="min-h-screen bg-background text-white flex">
      <aside className="w-56 border-r border-white/10 flex flex-col justify-between p-4">
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
      </aside>

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}