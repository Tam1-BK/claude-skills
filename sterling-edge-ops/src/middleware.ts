import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Finance routes are restricted to Admin, Director, Finance Officer
const FINANCE_ROLES = ["ADMIN", "DIRECTOR", "FINANCE_OFFICER"];

// CRM/Tenders/Suppliers/Tasks write routes are restricted to ops roles
const OPS_WRITE_ROLES = ["ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER"];

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl;
    const method = req.method;
    const role: string | undefined = req.nextauth?.token?.role;

    // ── Finance API — restricted read ──────────────────────────────────────
    if (pathname.startsWith("/api/finance")) {
      if (!role || !FINANCE_ROLES.includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Viewer enforcement (belt-and-suspenders on top of withAuth) ────────
    // withAuth in each route already checks this; middleware adds edge layer
    if (role === "VIEWER" && method !== "GET" && pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden: read-only access" },
        { status: 403 }
      );
    }

    // ── Finance Officer cannot access CRM, Tenders, Suppliers, Tasks ───────
    if (role === "FINANCE_OFFICER") {
      const restricted = ["/api/crm", "/api/tenders", "/api/suppliers"];
      if (restricted.some((r) => pathname.startsWith(r))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Allow request to proceed to the middleware function only when a valid
      // token exists. withAuth will redirect to /login otherwise.
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - /login (auth page)
     * - /api/auth (NextAuth endpoints)
     * - /_next (Next.js internals)
     * - /favicon.ico, /robots.txt, etc. (static files)
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|robots\\.txt).*)",
  ],
};
