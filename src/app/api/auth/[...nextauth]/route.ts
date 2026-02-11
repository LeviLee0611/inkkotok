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
        user.nickname =
          typeof token.nickname === "string" ? token.nickname : null;
      }
      return session;
    },
  },
};

const handler = async (request: Request) => {
  const url = new URL(request.url);
  if (url.searchParams.get("debug") === "1") {
    const providerIds = providers.map((provider) => provider.id);
    const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
    const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
    const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
    return new Response(
      JSON.stringify({
        hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasAuthUrl: !!process.env.AUTH_URL || !!process.env.NEXTAUTH_URL,
        hasAuthSecret: !!process.env.AUTH_SECRET || !!process.env.NEXTAUTH_SECRET,
        trustHost: process.env.AUTH_TRUST_HOST ?? null,
        authUrl: authUrl || null,
        requestOrigin: url.origin,
        requestHost: url.host,
        providerIds,
        googleClientIdLength: googleClientId.length,
        googleClientSecretLength: googleClientSecret.length,
        authSecretLength: authSecret.length,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
  if (url.searchParams.get("debug") === "2") {
    const response = await Auth(request, authConfig);
    const bodyText = await response.text();
    return new Response(
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        body: bodyText,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
  return Auth(request, authConfig);
};

export const GET = handler;
export const POST = handler;
