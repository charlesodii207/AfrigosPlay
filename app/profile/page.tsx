"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

type UserProfile = {
  id: number;
  email: string;
  full_name: string | null;
  is_email_verified: boolean;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Session expired");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        setError("Your session expired. Please log in again.");
        setLoading(false);
        router.push("/login");
      });
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="px-4 sm:px-8 py-12 text-gray-400">Loading...</div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="px-4 sm:px-8 py-12 text-red-400">{error}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      <div className="px-4 sm:px-8 py-12 max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Account</h1>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-gray-400">Full Name</p>
            <p className="text-base">{user.full_name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p className="text-base">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Email Verified</p>
            <p className="text-base">{user.is_email_verified ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>
    </main>
  );
}