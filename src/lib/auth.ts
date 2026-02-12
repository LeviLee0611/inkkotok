import { getToken } from "@auth/core/jwt";
type HeaderCarrier = {
  headers: Headers | Record<string, string>;
};

const COOKIE_NAMES = [
  "__Host-authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

export async function getUserIdFromRequest(request: HeaderCarrier) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const headers =
    request.headers instanceof Headers
      ? request.headers
      : new Headers(request.headers);

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
