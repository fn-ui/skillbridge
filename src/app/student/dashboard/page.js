"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

function StudentDashboardContent() {
  const { profile } = useAuth();

  return (
    <DashboardLayout role="student">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#f5c451]">
          Student Workspace
        </p>

        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Welcome, {profile?.full_name || "Student"}
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
    </DashboardLayout>
  );
}

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}