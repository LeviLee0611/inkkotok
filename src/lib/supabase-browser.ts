"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function readPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  // In Next.js client bundles, public env vars must be referenced as static property access.
  const value =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return value?.trim() ? value : null;
}

export function hasSupabasePublicEnv() {
  return Boolean(
    readPublicEnv("NEXT_PUBLIC_SUPABASE_URL") &&
      readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = readPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anonKey) return null;

  browserClient = createClient(url, anonKey);

  return browserClient;
}
