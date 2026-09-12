"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (
      profile &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(profile.role)
    ) {
      router.replace("/dashboard");
    }
  }, [user, profile, loading, router, allowedRoles]);

  if (loading || !user || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b12] text-white">
        <p className="text-gray-400">Loading SkillBridge...</p>
      </main>
    );
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(profile.role)
  ) {
    return null;
  }

  return children;
}