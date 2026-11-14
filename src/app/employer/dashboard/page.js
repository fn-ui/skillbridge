
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Users,
  UserCheck,
  Clock3,
  ArrowRight,
  Building2,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

function EmployerDashboardContent() {
  const { user, profile } = useAuth();

  const [stats, setStats] = useState({
    totalOpportunities: 0,
    publishedOpportunities: 0,
    applications: 0,
    shortlisted: 0,
    awaitingReview: 0,
  });

  const [opportunities, setOpportunities] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    async function loadEmployerDashboard() {
      setLoading(true);
      setError("");

      try {
        // 1. Find the employer's company
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("id, name")
          .eq("employer_id", user.id)
          .maybeSingle();

        if (companyError) throw companyError;

        if (!company) {
          if (isMounted) {
            setCompanyName("");
            setStats({
              totalOpportunities: 0,
              publishedOpportunities: 0,
              applications: 0,
              shortlisted: 0,
              awaitingReview: 0,
            });
            setOpportunities([]);
            setRecentApplications([]);
          }

          return;
        }

        // 2. Get opportunities belonging to the company
        const { data: opportunityData, error: opportunityError } =
          await supabase
            .from("opportunities")
            .select("id, title, status, created_at, deadline")
            .eq("company_id", company.id)
            .order("created_at", { ascending: false });

        if (opportunityError) throw opportunityError;

        const employerOpportunities = opportunityData || [];
        const opportunityIds = employerOpportunities.map(
          (item) => item.id
        );

        // 3. Get applications for these opportunities
        let applicationData = [];

        if (opportunityIds.length > 0) {
          const { data, error: applicationError } = await supabase
            .from("applications")
            .select("id, student_id, opportunity_id, status, applied_at")
            .in("opportunity_id", opportunityIds)
            .order("applied_at", { ascending: false });

          if (applicationError) throw applicationError;

          applicationData = data || [];
        }

        // 4. Get applicant profiles
        const applicantIds = [
          ...new Set(applicationData.map((item) => item.student_id)),
        ];

        let profileData = [];

        if (applicantIds.length > 0) {
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("user_id, full_name, profile_image")
            .in("user_id", applicantIds);

          if (profileError) throw profileError;

          profileData = data || [];
        }

        const profilesById = new Map(
          profileData.map((item) => [item.user_id, item])
        );

        const opportunitiesById = new Map(
          employerOpportunities.map((item) => [item.id, item])
        );

        const applicationsWithDetails = applicationData.map((application) => ({
          ...application,
          applicant: profilesById.get(application.student_id),
          opportunity: opportunitiesById.get(application.opportunity_id),
        }));

        // 5. Calculate dashboard statistics
        const shortlistedCount = applicationData.filter(
          (item) => item.status === "shortlisted"
        ).length;

        const awaitingReviewCount = applicationData.filter(
          (item) => item.status === "applied"
        ).length;

        const publishedCount = employerOpportunities.filter(
          (item) => item.status === "published"
        ).length;

        // 6. Calculate application statistics for each opportunity
        const opportunityPerformance = employerOpportunities.map(
          (opportunity) => {
            const opportunityApplications = applicationData.filter(
              (application) =>
                application.opportunity_id === opportunity.id
            );

            return {
              ...opportunity,
              applicationCount: opportunityApplications.length,
              shortlistedCount: opportunityApplications.filter(
                (item) => item.status === "shortlisted"
              ).length,
              awaitingReviewCount: opportunityApplications.filter(
                (item) => item.status === "applied"
              ).length,
            };
          }
        );

        if (!isMounted) return;

        setCompanyName(company.name);

        setStats({
          totalOpportunities: employerOpportunities.length,
          publishedOpportunities: publishedCount,
          applications: applicationData.length,
          shortlisted: shortlistedCount,
          awaitingReview: awaitingReviewCount,
        });

        setOpportunities(opportunityPerformance);
        setRecentApplications(applicationsWithDetails.slice(0, 5));
      } catch (err) {
        console.error("Employer dashboard error:", err);

        if (isMounted) {
          setError(
            "We couldn't load your recruitment information. Please refresh and try again."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEmployerDashboard();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusStyle(status) {
    const styles = {
      applied: "bg-blue-500/10 text-blue-300 border-blue-500/20",
      reviewing: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
      shortlisted: "bg-green-500/10 text-green-300 border-green-500/20",
      rejected: "bg-red-500/10 text-red-300 border-red-500/20",
      accepted: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    };

    return styles[status] || "bg-white/5 text-gray-300 border-white/10";
  }

  return (
    <DashboardLayout role="employer">
      <div>
        {/* Welcome section */}
        <p className="text-sm uppercase tracking-[0.2em] text-[#f5c451]">
          Employer Workspace
        </p>

        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Welcome, {profile?.full_name || "Employer"}
        </h1>

        <div className="mt-3 flex items-center gap-2 text-gray-400">
          <Building2 size={16} />
          <p className="text-sm">
            {companyName || "Manage your company and recruitment activities"}
          </p>
        </div>

        <p className="mt-3 max-w-2xl text-gray-400">
          Find emerging talent, publish opportunities, and manage applicants.
        </p>

        {/* Error message */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Total Opportunities</p>
              <BriefcaseBusiness className="text-[#f5c451]" size={21} />
            </div>
            <p className="mt-3 text-4xl font-bold text-[#f5c451]">
              {loading ? "—" : stats.totalOpportunities}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              All your created opportunities
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Published</p>
              <BriefcaseBusiness className="text-[#f5c451]" size={21} />
            </div>
            <p className="mt-3 text-4xl font-bold text-[#f5c451]">
              {loading ? "—" : stats.publishedOpportunities}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Live opportunities
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Applications Received</p>
              <Users className="text-[#f5c451]" size={21} />
            </div>
            <p className="mt-3 text-4xl font-bold text-[#f5c451]">
              {loading ? "—" : stats.applications}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Total student applications
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111722] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Shortlisted Students</p>
              <UserCheck className="text-[#f5c451]" size={21} />
            </div>
            <p className="mt-3 text-4xl font-bold text-[#f5c451]">
              {loading ? "—" : stats.shortlisted}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Applicants shortlisted
            </p>
          </div>
        </div>

        {/* Opportunity performance */}
        <section className="mt-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#f5c451]">
                Recruitment overview
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Opportunity Performance
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Track applications and recruitment progress for each opportunity.
              </p>
            </div>

            <Link
              href="/employer/opportunities"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#f5c451] hover:text-white"
            >
              Manage opportunities
              <ArrowRight size={17} />
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#111722] p-8 text-center text-gray-400">
              Loading opportunity performance...
            </div>
          ) : opportunities.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#111722] p-8 text-center">
              <BriefcaseBusiness
                className="mx-auto text-[#f5c451]"
                size={30}
              />
              <h3 className="mt-4 text-lg font-semibold">
                No opportunities yet
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Create your first opportunity to start attracting talented students.
              </p>
              <Link
                href="/employer/opportunities"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3 text-sm font-bold text-[#111722] hover:bg-[#ffda78]"
              >
                Create opportunity
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {opportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="rounded-2xl border border-white/10 bg-[#111722] p-5 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {opportunity.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Created {formatDate(opportunity.created_at)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${
                        opportunity.status === "published"
                          ? "border-green-500/20 bg-green-500/10 text-green-300"
                          : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                      }`}
                    >
                      {opportunity.status === "published"
                        ? "Published"
                        : "Draft"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                    <div>
                      <p className="text-xs text-gray-500">Applications</p>
                      <p className="mt-1 text-xl font-bold text-[#f5c451]">
                        {opportunity.applicationCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Shortlisted</p>
                      <p className="mt-1 text-xl font-bold text-green-400">
                        {opportunity.shortlistedCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Awaiting review</p>
                      <p className="mt-1 text-xl font-bold text-blue-300">
                        {opportunity.awaitingReviewCount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent applications */}
        <section className="mt-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#f5c451]">
                Latest activity
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Recent Applications
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Keep track of students who recently applied.
              </p>
            </div>

            <Link
              href="/employer/applicants"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#f5c451] hover:text-white"
            >
              View all applicants
              <ArrowRight size={17} />
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#111722] p-8 text-center text-gray-400">
              Loading recent applications...
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#111722] p-8 text-center">
              <Users className="mx-auto text-[#f5c451]" size={30} />
              <h3 className="mt-4 text-lg font-semibold">
                No applications received yet
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Applications from students will appear here when they apply.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#111722]">
              <div className="divide-y divide-white/10">
                {recentApplications.map((application) => (
                  <div
                    key={application.id}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold">
                        {application.applicant?.full_name || "Student"}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        {application.opportunity?.title || "Opportunity"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Applied {formatDate(application.applied_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Quick recruitment reminder */}
        {!loading && stats.awaitingReview > 0 && (
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[#f5c451]/20 bg-[#f5c451]/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-1 shrink-0 text-[#f5c451]" size={21} />
              <div>
                <p className="font-semibold">
                  You have {stats.awaitingReview} application
                  {stats.awaitingReview === 1 ? "" : "s"} awaiting review
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Review your applicants and update their application statuses.
                </p>
              </div>
            </div>

            <Link
              href="/employer/applicants"
              className="shrink-0 text-sm font-semibold text-[#f5c451] hover:text-white"
            >
              Review applicants →
            </Link>
          </div>
        )}
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
