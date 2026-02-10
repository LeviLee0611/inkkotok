import { Auth, type AuthConfig } from "@auth/core";
import AzureAD from "@auth/core/providers/azure-ad";
import Google from "@auth/core/providers/google";
import Kakao from "@auth/core/providers/kakao";
import Naver from "@auth/core/providers/naver";

import { upsertProfile } from "@/lib/profile";

export const runtime = "edge";

const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  }),
  AzureAD({
    clientId: process.env.AZURE_AD_CLIENT_ID ?? "",
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
    tenantId: process.env.AZURE_AD_TENANT_ID ?? "common",
  }),
  Naver({
    clientId: process.env.NAVER_CLIENT_ID ?? "",
    clientSecret: process.env.NAVER_CLIENT_SECRET ?? "",
  }),
  Kakao({
    clientId: process.env.KAKAO_CLIENT_ID ?? "",
    clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "",
  }),
];

const authConfig: AuthConfig = {
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

const handler = (request: Request) => Auth(request, authConfig);

export const GET = handler;
export const POST = handler;
