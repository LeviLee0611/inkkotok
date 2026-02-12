import { getToken } from "@auth/core/jwt";
import type { NextRequest } from "next/server";

const COOKIE_NAMES = [
  "__Host-authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

export async function getUserIdFromRequest(request: Request | NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const headers =
    request instanceof Request
      ? request.headers
      : request.headers instanceof Headers
        ? request.headers
        : new Headers(request.headers as unknown as HeadersInit);

  const req = { headers };

  for (const cookieName of COOKIE_NAMES) {
    const token = await getToken({
      req,
      secret,
      cookieName,
      salt: cookieName,
      secureCookie: cookieName.startsWith("__Secure") || cookieName.startsWith("__Host"),
    });
    if (token?.sub) return token.sub;
  }

  return null;
}
