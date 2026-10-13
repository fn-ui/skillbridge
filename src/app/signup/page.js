"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { signUp } from "@/lib/supabase/auth";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signUp(
        email.trim(),
        password,
        fullName.trim(),
        role
      );

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setMessage(
          "Your account has been created. Check your email to verify your address before logging in."
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#f5c451]/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-blue-500/5 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg"
      >
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#f5c451]"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#101722]/95 p-6 shadow-2xl sm:p-9">
          <Link
            href="/"
            className="text-2xl font-bold tracking-wide text-[#f5c451]"
          >
            SkillBridge
          </Link>

          <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5c451]/10 text-[#f5c451]">
            <Sparkles size={25} />
          </div>

          <h1 className="mt-5 text-3xl font-bold">
            Create your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Start building your profile and discovering new opportunities.
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                minLength={2}
                className="w-full rounded-xl border border-white/10 bg-[#080b12] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#f5c451]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-[#080b12] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#f5c451]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#080b12] px-4 py-3 pr-12 text-white outline-none transition placeholder:text-gray-600 focus:border-[#f5c451]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-300">
                I want to join as a
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  aria-pressed={role === "student"}
                  className={`rounded-xl border p-4 text-left transition ${
                    role === "student"
                      ? "border-[#f5c451] bg-[#f5c451]/10"
                      : "border-white/10 bg-[#080b12] hover:border-white/30"
                  }`}
                >
                  <GraduationCap
                    size={24}
                    className={
                      role === "student" ? "text-[#f5c451]" : "text-gray-400"
                    }
                  />
                  <p className="mt-3 font-semibold">Student</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Find opportunities
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("employer")}
                  aria-pressed={role === "employer"}
                  className={`rounded-xl border p-4 text-left transition ${
                    role === "employer"
                      ? "border-[#f5c451] bg-[#f5c451]/10"
                      : "border-white/10 bg-[#080b12] hover:border-white/30"
                  }`}
                >
                  <BriefcaseBusiness
                    size={24}
                    className={
                      role === "employer" ? "text-[#f5c451]" : "text-gray-400"
                    }
                  />
                  <p className="mt-3 font-semibold">Employer</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Discover emerging talent
                  </p>
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            {message && (
              <div
                role="status"
                className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm leading-6 text-green-300"
              >
                {message}
                <Link
                  href="/login"
                  className="mt-2 block font-semibold underline"
                >
                  Go to login
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3.5 font-bold text-[#080b12] transition hover:bg-[#ffe08a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#f5c451] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          By creating an account, you agree to use SkillBridge responsibly.
        </p>
      </motion.div>
    </main>
  );
}