import { NextResponse, type NextRequest } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "content-security-policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://*.sentry.io https://*.posthog.com",
  ].join("; "),
};

const PROTECTED_PREFIXES = ["/dashboard", "/observations", "/reports", "/commissioner", "/api"];
const PUBLIC_API_PREFIXES = ["/api/health"];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }

  const pathname = request.nextUrl.pathname;
  const protectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const publicApiRoute = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (protectedRoute && !publicApiRoute && pathname.startsWith("/api") && !request.headers.get("authorization")) {
    return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "Authentication is required." } }, { status: 401, headers: response.headers });
  }

  const hasSupabaseSessionCookie = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
  if (protectedRoute && !pathname.startsWith("/api") && !hasSupabaseSessionCookie) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/";
    signInUrl.searchParams.set("auth", "required");
    return NextResponse.redirect(signInUrl, { headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
