import { NextResponse } from "next/server";

export const runtime = "edge";

const COOKIES = [
  "__Host-authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Host-authjs.csrf-token",
  "__Secure-authjs.callback-url",
  "__Secure-authjs.pkce.code_verifier",
];

function buildCookie(name: string, secure: boolean) {
  const parts = [
    `${name}=`,
    "Path=/",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get("callbackUrl") ?? "/";
  const redirectUrl = new URL("/", url.origin);

  if (callbackUrl.startsWith("/")) {
    const parsed = new URL(callbackUrl, url.origin);
    redirectUrl.pathname = parsed.pathname;
    redirectUrl.search = parsed.search;
    redirectUrl.hash = parsed.hash;
  } else {
    try {
      const parsed = new URL(callbackUrl);
      if (parsed.origin === url.origin) {
        redirectUrl.pathname = parsed.pathname;
        redirectUrl.search = parsed.search;
        redirectUrl.hash = parsed.hash;
      }
    } catch {
      // Ignore invalid callbackUrl and use root fallback.
    }
  }

  const response = NextResponse.redirect(redirectUrl);

  COOKIES.forEach((name) => {
    response.headers.append("Set-Cookie", buildCookie(name, true));
    response.headers.append("Set-Cookie", buildCookie(name, false));
  });

  return response;
}
