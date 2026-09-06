const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const buckets = new Map();

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store",
};

export function applySecurityHeaders(_req, res, next) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    res.setHeader(name, value);
  }
  next();
}

export function rateLimit(req, res, next) {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many requests." } });
  }

  return next();
}

export function requireApiAuthentication(req, res, next) {
  if (process.env.ALLOW_INSECURE_DEMO === "true") {
    return next();
  }

  const expectedToken = process.env.INTERNAL_API_TOKEN;
  const providedToken = req.header("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expectedToken || providedToken !== expectedToken) {
    return res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Authentication is required." } });
  }

  return next();
}

export function sanitizeText(value, maxLength = 1000) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, maxLength);
}
