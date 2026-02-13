import { verifyFirebaseBearer, type FirebaseVerifiedUser } from "@/lib/firebase-auth";

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
