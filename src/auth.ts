import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return false;
      await upsertUser(user.email, user.name, user.image);
      return true;
    },
  },
});
