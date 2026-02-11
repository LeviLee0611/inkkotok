import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { upsertProfile } from "@/lib/profile";

export const runtime = "edge";

const auth = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
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
});

export const { GET, POST } = auth.handlers;
