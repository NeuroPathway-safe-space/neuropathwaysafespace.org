import { NextResponse } from "next/server";
import type { UserRole } from "@/types/domain";

export type SecureRole =
  | UserRole
  | "teacher"
  | "senco"
  | "clinician"
  | "local_authority_officer";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: SecureRole;
  aal?: string;
  organisationId?: string;
}

export interface SecureRouteOptions {
  allowedRoles: SecureRole[];
  requireMfa?: boolean;
  auditAction: string;
}

export interface AuditEvent {
  actorUserId?: string;
  action: string;
  entityTable?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const MFA_REQUIRED_ROLES: SecureRole[] = [
  "administrator",
  "commissioner",
  "camhs_clinician",
  "gp_paediatrician",
  "educational_psychologist",
  "speech_language_therapist",
  "occupational_therapist",
  "social_worker",
  "clinician",
  "local_authority_officer",
  "senco",
];

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64UrlDecodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(value))) as T;
}

function asArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

async function verifyHs256Jwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

  const header = base64UrlDecodeJson<{ alg?: string; typ?: string }>(encodedHeader);
  if (header.alg !== "HS256") return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    asArrayBuffer(base64UrlDecode(encodedSignature)),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );

  if (!valid) return null;

  const payload = base64UrlDecodeJson<Record<string, unknown>>(encodedPayload);
  const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  if (!expiresAt || expiresAt < Date.now()) return null;

  return payload;
}

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function structuredError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function applyRateLimit(request: Request): NextResponse | null {
  const key = `${getClientIp(request)}:${new URL(request.url).pathname}`;
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
    return structuredError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
  }

  return null;
}

export function assertTrustedOrigin(request: Request): NextResponse | null {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return null;

  const expectedOrigin = process.env.APP_ORIGIN;
  if (!expectedOrigin) return null;

  const origin = request.headers.get("origin");
  if (origin && origin !== expectedOrigin) {
    return structuredError(403, "UNTRUSTED_ORIGIN", "Request origin is not permitted.");
  }

  return null;
}

export async function requireAuthenticatedUser(request: Request): Promise<AuthenticatedUser | NextResponse> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  if (!token) {
    return structuredError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  if (!jwtSecret) {
    return structuredError(503, "AUTH_NOT_CONFIGURED", "Authentication verification is not configured.");
  }

  const claims = await verifyHs256Jwt(token, jwtSecret);
  if (!claims) {
    return structuredError(401, "INVALID_TOKEN", "Authentication token is invalid or expired.");
  }

  const appMetadata = typeof claims.app_metadata === "object" && claims.app_metadata ? claims.app_metadata as Record<string, unknown> : {};
  const userMetadata = typeof claims.user_metadata === "object" && claims.user_metadata ? claims.user_metadata as Record<string, unknown> : {};
  const role = (appMetadata.role || userMetadata.role || claims.role || "parent_carer") as SecureRole;

  return {
    id: String(claims.sub),
    email: typeof claims.email === "string" ? claims.email : undefined,
    role,
    aal: typeof claims.aal === "string" ? claims.aal : undefined,
    organisationId: typeof appMetadata.organisation_id === "string" ? appMetadata.organisation_id : undefined,
  };
}

export async function requireSecureApiAccess(
  request: Request,
  options: SecureRouteOptions,
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const rateLimited = applyRateLimit(request);
  if (rateLimited) return rateLimited;

  const csrfFailure = assertTrustedOrigin(request);
  if (csrfFailure) return csrfFailure;

  const authResult = await requireAuthenticatedUser(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!options.allowedRoles.includes(authResult.role)) {
    await recordAuditEvent(request, {
      actorUserId: authResult.id,
      action: "authorisation_denied",
      metadata: { attemptedAction: options.auditAction, role: authResult.role },
      createdAt: new Date().toISOString(),
    });
    return structuredError(403, "FORBIDDEN", "You are not authorised to perform this action.");
  }

  const mfaRequired = options.requireMfa || MFA_REQUIRED_ROLES.includes(authResult.role);
  if (mfaRequired && authResult.aal !== "aal2") {
    return structuredError(403, "MFA_REQUIRED", "Multi-factor authentication is required for this action.");
  }

  await recordAuditEvent(request, {
    actorUserId: authResult.id,
    action: options.auditAction,
    metadata: { role: authResult.role },
    createdAt: new Date().toISOString(),
  });

  return { user: authResult };
}

export function sanitizeFreeText(value: unknown, maxLength = 4000): string {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function redactForAi(value: string): string {
  return value
    .replace(/\b\d{3}[ -]?\d{3}[ -]?\d{4}\b/g, "[phone redacted]")
    .replace(/\b[A-Z]{2}\d{6}[A-D]?\b/gi, "[national insurance redacted]")
    .replace(/\b\d{3}[ -]?\d{3}[ -]?\d{4}\b/g, "[nhs number redacted]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email redacted]");
}

export async function recordAuditEvent(request: Request, event: AuditEvent): Promise<void> {
  const auditEvent: AuditEvent = {
    ...event,
    ipAddress: event.ipAddress ?? getClientIp(request),
    userAgent: event.userAgent ?? request.headers.get("user-agent") ?? undefined,
  };

  // In production this should be persisted to the append-only audit_logs/security_events tables
  // using a server-side Supabase service role key. Never expose service role credentials client-side.
  console.info("SECURITY_AUDIT", JSON.stringify(auditEvent));
}
