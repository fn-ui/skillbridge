"use client";

import { useState } from "react";
import { signUp } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("student");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

  const { data, error } = await signUp(
  email,
  password,
  fullName,
  role
  );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Unable to create account.");
      setLoading(false);
      return;
    }

    setMessage(
      "Account created successfully. Please check your email to verify your account."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md space-y-4 p-8"
      >
        <h1 className="text-3xl font-bold">
          Create your SkillBridge account
        </h1>

        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border p-3 rounded"
          required
        />

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
          minLength={6}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border p-3 rounded"
        >
          <option value="student">Student</option>
          <option value="employer">Employer</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 rounded font-semibold"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        {error && (
          <p className="text-red-500">
            {error}
          </p>
        )}

        {message && (
          <p className="text-green-500">
            {message}
          </p>
        )}
      </form>
    </main>
  );
}