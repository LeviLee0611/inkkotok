import { Auth, type AuthConfig } from "@auth/core";
import Google from "@auth/core/providers/google";

import { upsertProfile } from "@/lib/profile";

export const runtime = "edge";

const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  }),
];

const authConfig: AuthConfig = {
  basePath: "/api/auth",
  providers,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async jwt({ token, account }) {
      const subject = token.sub ?? (token as { id?: string }).id;
      if (account?.provider && subject) {
        const displayName = await upsertProfile({
          id: subject,
          email: token.email,
          image: token.picture,
          provider: account.provider,
        });
        token.nickname = displayName;
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
  if (url.searchParams.get("debug") === "2") {
    return new Response(
      JSON.stringify({
        requestUrl: url.toString(),
        requestPath: url.pathname,
        requestQuery: Object.fromEntries(url.searchParams.entries()),
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
  const nextauth = url.searchParams.get("nextauth");
  if (nextauth && url.pathname === (authConfig.basePath ?? "/auth")) {
    url.pathname = `${authConfig.basePath ?? "/auth"}/${nextauth}`;
    url.searchParams.delete("nextauth");
    request = new Request(url, request);
  }
  if (url.searchParams.get("debug") === "1") {
    let parsed: { action?: string; providerId?: string; error?: string } = {};
    try {
      parsed = parseActionAndProviderId(url.pathname, authConfig.basePath ?? "/auth");
    } catch (error) {
      parsed.error = error instanceof Error ? error.message : String(error);
    }
    return new Response(
      JSON.stringify({
        requestUrl: url.toString(),
        requestPath: url.pathname,
        basePath: authConfig.basePath ?? null,
        parsed,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
  return Auth(request, authConfig);
};

export const GET = handler;
export const POST = handler;
