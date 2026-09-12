"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

function EmployerDashboardContent() {
  const { profile } = useAuth();

  return (
    <DashboardLayout role="employer">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#f5c451]">
          Employer Workspace
        </p>

        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Welcome, {profile?.full_name || "Employer"}
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
    </DashboardLayout>
  );
}

export default function EmployerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["employer"]}>
      <EmployerDashboardContent />
    </ProtectedRoute>
  );
}