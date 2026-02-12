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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get("callbackUrl") ?? "/";
  const response = NextResponse.redirect(callbackUrl);

  COOKIES.forEach((name) => {
    response.cookies.set({
      name,
      value: "",
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  return response;
}
