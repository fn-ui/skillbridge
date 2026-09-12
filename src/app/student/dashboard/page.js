"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

function StudentDashboardContent() {
  const { profile } = useAuth();

  return (
    <main className="min-h-screen bg-[#080b12] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#f5c451]">
          Student Workspace
        </p>

        <h1 className="text-4xl font-bold">
          Welcome, {profile.full_name || "Student"}
        </h1>

        <p className="mt-3 max-w-2xl text-gray-400">
          Discover opportunities, showcase your projects, and grow your
          professional skills.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <p className="text-sm text-gray-400">Matched Opportunities</p>
            <p className="mt-3 text-4xl font-bold text-[#f5c451]">0</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <p className="text-sm text-gray-400">Projects</p>
            <p className="mt-3 text-4xl font-bold text-[#f5c451]">0</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <p className="text-sm text-gray-400">Applications</p>
            <p className="mt-3 text-4xl font-bold text-[#f5c451]">0</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}