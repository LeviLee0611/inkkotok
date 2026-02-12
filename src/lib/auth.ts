import { getToken } from "@auth/core/jwt";
import type { NextRequest } from "next/server";

const SECURE_COOKIE = "__Secure-authjs.session-token";
const DEV_COOKIE = "authjs.session-token";

export async function getUserIdFromRequest(request: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const token =
    (await getToken({
      req: request,
      secret,
      cookieName: SECURE_COOKIE,
    })) ??
    (await getToken({
      req: request,
      secret,
      cookieName: DEV_COOKIE,
    }));

  return token?.sub ?? null;
}
