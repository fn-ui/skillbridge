"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  RefreshCw,
  Search,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const statusStyles = {
  applied: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  reviewing: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  shortlisted: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
};

const statusLabels = {
  applied: "Applied",
  reviewing: "Under review",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
};

function formatDate(value) {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StudentApplicationsContent() {
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadApplications = useCallback(async () => {
    if (!user?.id) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        applied_at,
        opportunity_id,
        opportunities (
          id,
          title,
          location,
          opportunity_type,
          deadline,
          companies (
            name
          )
        )
      `)
      .eq("student_id", user.id)
      .order("applied_at", { ascending: false });

    if (queryError) {
      console.error("Could not load applications:", queryError);
      setError("We couldn't load your applications. Please try again.");
      setApplications([]);
    } else {
      setApplications(data || []);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredApplications = applications.filter((application) => {
    const opportunity = application.opportunities;
    const companyName = opportunity?.companies?.name || "";
    const title = opportunity?.title || "";

    const matchesSearch = `${title} ${companyName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || application.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: applications.length,
    applied: applications.filter((item) => item.status === "applied").length,
    reviewing: applications.filter((item) => item.status === "reviewing").length,
    shortlisted: applications.filter((item) => item.status === "shortlisted").length,
    accepted: applications.filter((item) => item.status === "accepted").length,
    rejected: applications.filter((item) => item.status === "rejected").length,
  };

  return (
    <div className="min-h-screen space-y-8 bg-[#080B12] p-4 text-white sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-amber-400">
            YOUR CAREER JOURNEY
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My Applications
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Track your applications and see their latest status.
          </p>
        </div>

        <button
          onClick={loadApplications}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "All", value: counts.all, key: "all" },
          { label: "Applied", value: counts.applied, key: "applied" },
          { label: "Reviewing", value: counts.reviewing, key: "reviewing" },
          { label: "Shortlisted", value: counts.shortlisted, key: "shortlisted" },
          { label: "Accepted", value: counts.accepted, key: "accepted" },
          { label: "Rejected", value: counts.rejected, key: "rejected" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            className={`rounded-2xl border p-4 text-left transition ${
              statusFilter === item.key
                ? "border-amber-400/50 bg-amber-400/10"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            }`}
          >
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold">{item.value}</p>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by opportunity or company..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p>{error}</p>
            <button
              onClick={loadApplications}
              className="mt-2 font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-slate-400">
          Loading your applications...
        </div>
      ) : !error && filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
          <BriefcaseBusiness className="mx-auto text-amber-400" size={34} />
          <h2 className="mt-4 text-lg font-semibold">
            {applications.length === 0
              ? "No applications yet"
              : "No matching applications"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            {applications.length === 0
              ? "When you apply for an opportunity, it will appear here so you can track its progress."
              : "Try a different search or select another status filter."}
          </p>
          {applications.length === 0 && (
            <a
              href="/student/opportunities"
              className="mt-6 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Explore opportunities
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const opportunity = application.opportunities;
            const companyName = opportunity?.companies?.name || "Company";
            const status = application.status || "applied";

            return (
              <article
                key={application.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-amber-400/25 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="text-sm text-amber-400">{companyName}</p>
                    <h2 className="mt-1 text-xl font-semibold">
                      {opportunity?.title || "Opportunity no longer available"}
                    </h2>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                      {opportunity?.location && (
                        <span className="inline-flex items-center gap-2">
                          <MapPin size={15} />
                          {opportunity.location}
                        </span>
                      )}
                      {opportunity?.opportunity_type && (
                        <span className="inline-flex items-center gap-2">
                          <BriefcaseBusiness size={15} />
                          {opportunity.opportunity_type}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={15} />
                        Applied {formatDate(application.applied_at)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      statusStyles[status] || statusStyles.applied
                    }`}
                  >
                    {status === "accepted" ? (
                      <CheckCircle2 size={14} />
                    ) : status === "rejected" ? (
                      <XCircle size={14} />
                    ) : (
                      <Clock3 size={14} />
                    )}
                    {statusLabels[status] || status}
                  </span>
                </div>

                <div className="mt-5 border-t border-white/[0.08] pt-4">
                  <p className="text-sm text-slate-400">
                    {status === "applied" &&
                      "Your application has been submitted."}
                    {status === "reviewing" &&
                      "The employer is reviewing your application."}
                    {status === "shortlisted" &&
                      "You have been shortlisted by the employer."}
                    {status === "accepted" &&
                      "Your application has been accepted. Congratulations!"}
                    {status === "rejected" &&
                      "The employer has decided not to proceed with this application."}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StudentApplicationsPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout role="student">
        <StudentApplicationsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}