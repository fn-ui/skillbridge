"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  FolderKanban,
  FileText,
  UserRound,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/supabase/auth";

export default function DashboardLayout({
  children,
  role,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const studentLinks = [
    {
      label: "Dashboard",
      href: "/student/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Opportunities",
      href: "/student/opportunities",
      icon: BriefcaseBusiness,
    },
    {
      label: "My Projects",
      href: "/student/projects",
      icon: FolderKanban,
    },
    {
      label: "Applications",
      href: "/student/applications",
      icon: FileText,
    },
    {
      label: "My Profile",
      href: "/student/profile",
      icon: UserRound,
    },
  ];

  const employerLinks = [
    {
      label: "Dashboard",
      href: "/employer/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Opportunities",
      href: "/employer/opportunities",
      icon: BriefcaseBusiness,
    },
    {
      label: "Applicants",
      href: "/employer/applicants",
      icon: Users,
    },
    {
      label: "Company Profile",
      href: "/employer/company",
      icon: UserRound,
    },
  ];

  const links = role === "student" ? studentLinks : employerLinks;

  async function handleLogout() {
    const { error } = await signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#080b12] text-white">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#0d121c] px-5 py-4 lg:hidden">
        <Link
          href="/"
          className="text-xl font-bold tracking-wide text-[#f5c451]"
        >
          SkillBridge
        </Link>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg border border-white/10 p-2 text-gray-300"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-[#0d121c] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col px-5 py-6">
          <Link
            href="/"
            className="mb-10 text-2xl font-bold tracking-wide text-[#f5c451]"
          >
            SkillBridge
          </Link>

          <div className="mb-8 rounded-2xl border border-white/10 bg-[#111722] p-4">
            <p className="text-xs uppercase tracking-widest text-gray-500">
              Signed in as
            </p>

            <p className="mt-2 truncate font-semibold">
              {profile?.full_name || "User"}
            </p>

            <p className="mt-1 text-sm capitalize text-[#f5c451]">
              {role}
            </p>
          </div>

          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[#f5c451] text-[#080b12]"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
            >
              <Settings size={18} />
              Settings
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Close navigation"
        />
      )}
    </div>
  );
}