import { verifyFirebaseBearer, type FirebaseVerifiedUser } from "@/lib/firebase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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
  if (isAdminEmail(user.email)) {
    return true;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("role, status, deleted_at")
    .eq("firebase_uid", user.id)
    .maybeSingle();

  if (error || !data) return false;
  if (data.deleted_at) return false;
  if (data.status && data.status !== "active") return false;

  const role = typeof data.role === "string" ? data.role.toLowerCase() : "";
  return role === "admin" || role === "moderator";
}

function toAuthUser(firebaseUser: FirebaseVerifiedUser): AuthUser {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    provider: firebaseUser.provider,
    name: firebaseUser.name,
    picture: firebaseUser.picture,
  };
}

export async function getUserFromRequest(request: HeaderCarrier): Promise<AuthUser | null> {
  const firebaseUser = await verifyFirebaseBearer(request.headers);
  return firebaseUser ? toAuthUser(firebaseUser) : null;
}

export async function getUserIdFromRequest(request: HeaderCarrier) {
  const user = await getUserFromRequest(request);
  return user?.id ?? null;
}
