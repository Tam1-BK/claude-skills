import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FINANCE_ROLES = ["ADMIN", "DIRECTOR", "FINANCE_OFFICER"];
const MUTATING_METHODS = ["POST", "PATCH", "PUT", "DELETE"];

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl;
    const method = req.method;
    const role: string | undefined = req.nextauth?.token?.role;

    // ── CSRF: reject cross-origin state-changing requests ──────────────────
    if (MUTATING_METHODS.includes(method) && pathname.startsWith("/api/")) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");
      if (origin) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json({ error: "Forbidden: cross-origin request" }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "Forbidden: invalid origin" }, { status: 403 });
        }
      }
    }

    // ── Finance API — restricted read ──────────────────────────────────────
    if (pathname.startsWith("/api/finance")) {
      if (!role || !FINANCE_ROLES.includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Viewer enforcement ─────────────────────────────────────────────────
    if (role === "VIEWER" && MUTATING_METHODS.includes(method) && pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden: read-only access" }, { status: 403 });
    }

    // ── Finance Officer isolation ──────────────────────────────────────────
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
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|robots\\.txt).*)",
  ],
};
