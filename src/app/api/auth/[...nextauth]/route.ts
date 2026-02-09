import NextAuth, { type NextAuthOptions } from "next-auth";
import AzureAD from "next-auth/providers/azure-ad";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";

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

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider && token.sub) {
        const displayName = await upsertProfile({
          id: token.sub,
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
        session.user.id = token.sub ?? session.user.id;
        session.user.nickname =
          typeof token.nickname === "string" ? token.nickname : null;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
