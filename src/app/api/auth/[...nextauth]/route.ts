import { Auth, skipCSRFCheck, type AuthConfig } from "@auth/core";
import Google from "@auth/core/providers/google";

import { upsertProfile } from "@/lib/profile";

export const runtime = "edge";

const authConfig: AuthConfig = {
  basePath: "/api/auth",
  // Cloudflare Pages requires explicit host trust in production.
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth" },
  callbacks: {
    async jwt({ token, account }) {
      const subject = token.sub ?? (token as { id?: string }).id;
      if (account?.provider && subject) {
        try {
          const displayName = await upsertProfile({
            id: subject,
            email: token.email,
            image: token.picture,
            provider: account.provider,
          });
          token.nickname = displayName;
        } catch (error) {
          console.error("profile upsert failed", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as typeof session.user & {
          id?: string;
          nickname?: string | null;
        };
        user.id = token.sub ?? user.id;
        user.nickname = typeof token.nickname === "string" ? token.nickname : null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/feed`;
    },
  },
};

const handler = async (request: Request) => {
  const url = new URL(request.url);
  // Delegate routing to Auth.js but normalize GET /signin/:provider to POST
  // to avoid Unsupported action errors while keeping internal actions (e.g. _log) intact.
  const basePath = authConfig.basePath ?? "/api/auth";
  const signinPrefix = `${basePath}/signin/`;
  const signoutPrefix = `${basePath}/signout`;
  if (request.method === "GET" && url.pathname.startsWith(signinPrefix)) {
    const nextUrl = new URL(url);
    const body = nextUrl.searchParams.toString();
    nextUrl.search = "";
    const authRequest = new Request(nextUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    return Auth(authRequest, { ...authConfig, skipCSRFCheck });
  }

  if (request.method === "GET" && url.pathname === signoutPrefix) {
    const nextUrl = new URL(url);
    const body = nextUrl.searchParams.toString();
    nextUrl.search = "";
    const authRequest = new Request(nextUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    return Auth(authRequest, { ...authConfig, skipCSRFCheck });
  }

  return Auth(new Request(url, request), authConfig);
};

export const GET = handler;
export const POST = handler;
