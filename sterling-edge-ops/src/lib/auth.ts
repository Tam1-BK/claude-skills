import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { loginRateLimit } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required").max(200),
});

const isProd = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  // 8-hour sessions — work-day scoped; deactivated users are out within 1 hour (updateAge)
  session: { strategy: "jwt", maxAge: 8 * 60 * 60, updateAge: 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // Harden session cookies: strict SameSite + Secure in production
  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: isProd,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Zod validation — prevents malformed bodies reaching the DB
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Rate-limit by IP to prevent brute force
        const ip =
          (req as any)?.headers?.["x-forwarded-for"]?.split(",")[0].trim() ??
          (req as any)?.headers?.["x-real-ip"] ??
          "unknown";
        const allowed = await loginRateLimit(ip);
        if (!allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in — embed role and id into the JWT
        token.role = (user as any).role;
        token.id = user.id;
        token.active = true;
        return token;
      }

      // Token refresh path — re-validate user is still active and sync role changes
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { active: true, role: true },
        }).catch(() => null);

        if (!dbUser || !dbUser.active) {
          // Mark deactivated — session callback will strip the user, middleware will block
          token.active = false;
        } else {
          token.active = true;
          token.role = dbUser.role; // Sync role changes made by admin
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Deactivated users get an expired session — client is forced to re-authenticate
      if (!token.active) {
        return { ...session, user: undefined, expires: new Date(0).toISOString() } as any;
      }
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
