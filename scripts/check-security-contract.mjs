import { readFileSync } from "node:fs";

const requiredFiles = [
  ["lib/security.ts", ["requireSecureApiAccess", "MFA_REQUIRED_ROLES", "applyRateLimit", "recordAuditEvent", "redactForAi"]],
  ["lib/validation.ts", ["validateObservation", "validateObservations", "sanitizeFreeText"]],
  ["middleware.ts", ["content-security-policy", "strict-transport-security", "x-frame-options"]],
  ["lib/file-security.ts", ["validateUploadMetadata", "ALLOWED_UPLOAD_MIME_TYPES", "buildQuarantineStoragePath"]],
  ["backend/middleware/security.js", ["requireApiAuthentication", "rateLimit", "applySecurityHeaders"]],
  ["supabase/schema.sql", ["access_relationships", "lawful_basis_records", "safeguarding_alerts", "safeguarding_actions", "enable row level security", "prevent_safeguarding_action_mutation"]],
  ["docs/security-compliance.md", ["Security risk assessment", "GDPR compliance checklist", "Safeguarding compliance checklist", "Incident response plan", "Recommended penetration testing plan"]],
];

const missing = [];
for (const [file, phrases] of requiredFiles) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  for (const phrase of phrases) {
    if (!source.includes(phrase)) missing.push(`${file}: ${phrase}`);
  }
}

if (missing.length > 0) {
  console.error(`Missing security contract phrases:\n${missing.join("\n")}`);
  process.exit(1);
}

const schemaSource = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const tables = [...schemaSource.matchAll(/create table ([a-z_]+)/g)].map((match) => match[1]);
const rlsTables = [...schemaSource.matchAll(/alter table ([a-z_]+) enable row level security/g)].map((match) => match[1]);
const missingRls = tables.filter((table) => !rlsTables.includes(table));
if (missingRls.length > 0) {
  console.error(`Tables missing RLS: ${missingRls.join(", ")}`);
  process.exit(1);
}

console.log("NeuroPathway security, privacy, and safeguarding contract verified.");
