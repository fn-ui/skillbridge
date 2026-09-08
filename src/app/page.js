"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const [status, setStatus] = useState("Testing connection...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (error) {
        setStatus(`Connection reached Supabase, but query returned: ${error.message}`);
      } else {
        setStatus("Successfully connected to Supabase!");
      }
    }

    testConnection();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          SkillBridge
        </h1>

        <p className="text-lg">
          {status}
        </p>
      </div>
    </main>
  );
}