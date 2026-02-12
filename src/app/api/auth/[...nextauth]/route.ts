import { Auth, skipCSRFCheck, type AuthConfig } from "@auth/core";
import Google from "@auth/core/providers/google";

import { upsertProfile } from "@/lib/profile";

export const runtime = "edge";

const authConfig: AuthConfig = {
  basePath: "/api/auth",
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

function parseActionAndProviderId(pathname: string, base: string) {
  const match = pathname.match(new RegExp(`^${base}(.+)`));
  if (match === null) throw new Error(`Cannot parse action at ${pathname}`);
  const actionAndProviderId = match.at(-1) ?? "";
  const parts = actionAndProviderId.replace(/^\//, "").split("/").filter(Boolean);
  if (parts.length !== 1 && parts.length !== 2)
    throw new Error(`Cannot parse action at ${pathname}`);
  const [action, providerId] = parts;
  return { action, providerId };
}

const handler = async (request: Request) => {
  const url = new URL(request.url);
  let authRequest = request;
  let authOptions: AuthConfig = authConfig;

  try {
    const parsed = parseActionAndProviderId(
      url.pathname,
      authConfig.basePath ?? "/auth"
    );
    if (parsed.action === "signin" && parsed.providerId && request.method === "GET") {
      authRequest = new Request(url, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "",
      });
      authOptions = { ...authConfig, skipCSRFCheck };
    }
  } catch {
    // fall through to Auth.js error handling
  }

  return Auth(authRequest, authOptions);
};

export const GET = handler;
export const POST = handler;
