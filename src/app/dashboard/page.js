"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b12] text-white">
      <p className="text-gray-400">Preparing your dashboard...</p>
    </main>
  );
}