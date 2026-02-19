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

export type RoleCode = "user" | "manager" | "admin";

let roleClient:
  | ReturnType<typeof createClient>
  | null = null;

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

function getSupabaseAdminConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

function getRoleClient() {
  if (roleClient) return roleClient;
  const config = getSupabaseAdminConfig();
  if (!config) return null;
  roleClient = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return roleClient;
}

async function getDbRoleCode(userId: string): Promise<RoleCode | null> {
  const supabase = getRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(code, priority)")
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (error || !data?.length) {
    return null;
  }

  let best: { code: RoleCode; priority: number } | null = null;

  for (const row of data as Array<{
    roles?: { code?: string; priority?: number } | Array<{ code?: string; priority?: number }> | null;
  }>) {
    const roles = Array.isArray(row.roles) ? row.roles : row.roles ? [row.roles] : [];
    for (const role of roles) {
      if (!role || typeof role.code !== "string") continue;
      const code = role.code as RoleCode;
      if (!["user", "manager", "admin"].includes(code)) continue;
      const priority = typeof role.priority === "number" ? role.priority : 0;
      if (!best || priority > best.priority) {
        best = { code, priority };
      }
    }
  }

  return best?.code ?? null;
}

export async function getUserRole(user: AuthUser): Promise<RoleCode> {
  const dbRole = await getDbRoleCode(user.id).catch(() => null);
  if (dbRole) return dbRole;
  if (isAdminEmail(user.email)) return "admin";
  return "user";
}

export async function isAdminUser(user: AuthUser) {
  const role = await getUserRole(user);
  return role === "admin";
}

export async function isManagerUser(user: AuthUser) {
  const role = await getUserRole(user);
  return role === "manager" || role === "admin";
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
