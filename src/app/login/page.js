"use client";

import { useState } from "react";
import { signIn } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
    router.push("/dashboard");
    } 
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-4 p-8"
      >
        <h1 className="text-3xl font-bold">
          Welcome back
        </h1>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-3 rounded"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-3 rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 rounded font-semibold"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {error && (
          <p className="text-red-500">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}