"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const supabase = getSupabaseBrowserClient();
  const token = supabase
    ? (await supabase.auth.getSession()).data.session?.access_token
    : null;

  const headers = new Headers(init?.headers ?? undefined);
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...(init ?? {}),
    headers,
  });
}
