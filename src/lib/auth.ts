import { getToken } from "@auth/core/jwt";
import { verifyFirebaseBearer } from "@/lib/firebase-auth";
type HeaderCarrier = {
  headers: Headers | Record<string, string>;
};

const COOKIE_NAMES = [
  "__Host-authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.session-token",
];
const COOKIE_SALTS = ["authjs.session-token", ...COOKIE_NAMES];

type AuthUser = {
  id: string;
  email: string | null;
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

export async function getUserFromRequest(request: HeaderCarrier): Promise<AuthUser | null> {
  const firebaseUser = await verifyFirebaseBearer(request.headers);
  if (firebaseUser) {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const headers =
    request.headers instanceof Headers
      ? request.headers
      : new Headers(request.headers);

  const req = { headers };

  for (const cookieName of COOKIE_NAMES) {
    for (const salt of COOKIE_SALTS) {
      const token = await getToken({
        req,
        secret,
        cookieName,
        salt,
        secureCookie: cookieName.startsWith("__Secure") || cookieName.startsWith("__Host"),
      });
      if (token?.sub) {
        return {
          id: token.sub,
          email: typeof token.email === "string" ? token.email : null,
        };
      }
    }
  }

  // Fallback to Auth.js defaults in case cookie naming differs by environment.
  for (const secureCookie of [true, false]) {
    for (const salt of COOKIE_SALTS) {
      const token = await getToken({
        req,
        secret,
        secureCookie,
        salt,
      });
      if (token?.sub) {
        return {
          id: token.sub,
          email: typeof token.email === "string" ? token.email : null,
        };
      }
    }
  }

  return null;
}

export async function getUserIdFromRequest(request: HeaderCarrier) {
  const user = await getUserFromRequest(request);
  return user?.id ?? null;
}
