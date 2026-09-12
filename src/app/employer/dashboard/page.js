"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

function EmployerDashboardContent() {
  const { profile } = useAuth();

  return (
    <main className="min-h-screen bg-[#080b12] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#f5c451]">
          Employer Workspace
        </p>

        <h1 className="text-4xl font-bold">
          Welcome, {profile.full_name || "Employer"}
        </h1>

        <p className="mt-3 max-w-2xl text-gray-400">
          Find emerging talent, publish opportunities, and manage applicants.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <p className="text-sm text-gray-400">Published Opportunities</p>
            <p className="mt-3 text-4xl font-bold text-[#f5c451]">0</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <p className="text-sm text-gray-400">Applications Received</p>
            <p className="mt-3 text-4xl font-bold text-[#f5c451]">0</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <p className="text-sm text-gray-400">Shortlisted Students</p>
            <p className="mt-3 text-4xl font-bold text-[#f5c451]">0</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function EmployerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["employer"]}>
      <EmployerDashboardContent />
    </ProtectedRoute>
  );
}