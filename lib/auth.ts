import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

export const LOGIN_RATE_LIMIT_ERROR = "Too many login attempts. Please try again in 15 minutes.";

const loginLimiter = createRateLimiter({ prefix: "login", limit: 5, window: "15 m" });

// Compared against when the username does not exist, so response time does not reveal valid usernames.
const DUMMY_HASH = "$2a$12$Y/5DUvdnKSZ1mbNlGxO05eb1XTSHkViSfF4J4/FObvzfRRTgkyi/m";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip = getClientIp(req?.headers);
        const { success } = await loginLimiter.limit(ip);
        if (!success) {
          throw new Error(LOGIN_RATE_LIMIT_ERROR);
        }

        const username = credentials?.username?.trim();
        const password = credentials?.password;
        if (!username || !password || username.length > 100 || password.length > 200) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { username } });
        const isPasswordValid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

        if (!user || !isPasswordValid) {
          return null;
        }

        return { id: user.id, name: user.username };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
};
