"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, profile, loading, profileError } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!profile) return;

    if (profile.role === "student") {
      router.replace("/student/dashboard");
    } else if (profile.role === "employer") {
      router.replace("/employer/dashboard");
    } else if (profile.role === "admin") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/");
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b12] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[#f5c451]" />
          <p className="text-gray-400">Preparing your dashboard...</p>
        </div>
      </main>
    );
  }

  if (user && !profile && profileError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b12] px-5 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Unable to load your profile</h1>

          <p className="mt-3 text-sm leading-6 text-gray-400">
            {profileError}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-semibold text-[#080b12] hover:bg-[#ffda78]"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b12] text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[#f5c451]" />
        <p className="text-gray-400">Opening your dashboard...</p>
      </div>
    </main>
  );
}