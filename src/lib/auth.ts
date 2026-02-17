import { createClient } from "@supabase/supabase-js";

type HeaderCarrier = {
  headers: Headers | Record<string, string>;
};

export type AuthUser = {
  id: string;
  email: string | null;
  provider: string;
  name: string | null;
  picture: string | null;
};

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const fromList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const single = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const normalized = email.trim().toLowerCase();
  return fromList.includes(normalized) || (single !== "" && single === normalized);
}

export async function isAdminUser(user: AuthUser) {
  return isAdminEmail(user.email);
}

function getBearerToken(headers: Headers | Record<string, string>) {
  const resolved = headers instanceof Headers ? headers : new Headers(headers);
  const auth = resolved.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase public envs.");
  }
  return { url, anonKey };
}

function toAuthUser(supabaseUser: {
  id: string;
  email?: string | null;
  app_metadata?: { provider?: string | null } | null;
  user_metadata?: {
    name?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    picture?: string | null;
  } | null;
}): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? null,
    provider: supabaseUser.app_metadata?.provider ?? "unknown",
    name: supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? null,
    picture:
      supabaseUser.user_metadata?.avatar_url ??
      supabaseUser.user_metadata?.picture ??
      null,
  };
}

export async function getUserFromRequest(request: HeaderCarrier): Promise<AuthUser | null> {
  const token = getBearerToken(request.headers);
  if (!token) return null;

  try {
    const { url, anonKey } = getSupabasePublicConfig();
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return toAuthUser(data.user);
  } catch {
    return null;
  }
}

export async function getUserIdFromRequest(request: HeaderCarrier) {
  const user = await getUserFromRequest(request);
  return user?.id ?? null;
}
