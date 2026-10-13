"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import { signIn } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await signIn(email.trim(), password);

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        router.replace("/dashboard");
        router.refresh();
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
        className="relative w-full max-w-md"
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

          <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5c451]/10 text-[#f5c451]">
            <LockKeyhole size={24} />
          </div>

          <h1 className="mt-5 text-3xl font-bold">Welcome back</h1>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Log in to continue building your future with SkillBridge.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-300"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs text-[#f5c451] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5c451] px-5 py-3.5 font-bold text-[#080b12] transition hover:bg-[#ffe08a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Log In"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            New to SkillBridge?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#f5c451] hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}