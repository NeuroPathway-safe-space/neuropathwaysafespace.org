# NeuroPathway Security, Privacy, and Safeguarding Hardening Review

## 1. Security risk assessment

| Risk | Impact | Likelihood | Priority | Remediation now in codebase |
| --- | --- | --- | --- | --- |
| Unauthenticated API access to sensitive observations and AI analysis | Critical child, health, education, and safeguarding data exposure | High | P0 | API routes now call secure access guards with JWT verification, role checks, MFA checks for privileged roles, rate limiting, origin checks, and audit events. |
| Over-broad database access | Unauthorised record viewing across families, schools, or agencies | High | P0 | Supabase schema now includes relationship-based RLS helper functions and policies for child/adult records, documents, reports, risks, tasks, and safeguarding alerts. |
| In-memory observation persistence | Sensitive records could bypass database controls, retention, and audit | High | P0 | Demo in-memory observation storage has been disabled; observations are validated and must be persisted through Supabase with RLS and audit logging. |
| Weak safeguarding audit trail | Missed or untraceable critical alerts | High | P0 | Added safeguarding alerts/actions tables and immutable action trigger. API risk review logs urgent safeguarding alerts. |
| Prompt injection and AI privacy leakage | Unsafe AI output or unnecessary personal data processing | Medium | P1 | Inputs are sanitised and personal identifiers are redacted before deterministic AI helper processing; AI outputs are marked human-review-required. |
| Missing GDPR operational records | Inability to evidence lawful basis, SARs, restrictions, privacy notices, retention | Medium | P1 | Added lawful basis, privacy notice, data subject request, processing restriction, and retention policy tables. |
| File upload malware exposure | Malware or inappropriate content in evidence files | Medium | P1 | Added file security scan table; implementation must require MIME/size checks, private buckets, signed URLs, and malware scanning before release. |
| Browser attack surface | XSS/clickjacking/data leakage | Medium | P1 | Added security headers middleware with CSP, HSTS, frame denial, nosniff, referrer policy, and permissions policy. |
| Insufficient monitoring | Delayed detection of suspicious behaviour | Medium | P1 | Added security events table and structured audit helper; production deployment must connect Sentry, SIEM alerts, and failed-login monitoring. |

## 2. Prioritised remediation plan

### P0 before any real data pilot

1. Configure `SUPABASE_JWT_SECRET`, `APP_ORIGIN`, Supabase URL, service-role key only on the server, Sentry DSN, and PostHog privacy settings.
2. Apply the full Supabase schema and run RLS regression tests for each role and relationship type.
3. Replace placeholder persistence in API routes with Supabase server-side writes that rely on RLS and append audit/security events.
4. Enable MFA enforcement in Supabase Auth for administrator, commissioner, clinical, social worker, SENCO, and local authority roles.
5. Configure safeguarding escalation recipients, out-of-hours procedures, and alert acknowledgement SLAs.
6. Complete DPIA, clinical safety case, Caldicott review, and data processing agreements.

### P1 before production

1. Add virus scanning to the upload pipeline and quarantine unscanned documents.
2. Add Sentry alerts, SIEM forwarding, failed-login alerts, and anomaly detection for bulk access/export.
3. Implement SAR export, rectification, restriction, portability, and secure deletion workflows.
4. Add penetration testing, accessibility testing, and backup restore tests.
5. Add automated dependency, secret, SAST, and container scanning in CI.

### P2 post-pilot maturity

1. Integrate NHS login or federated SSO where appropriate.
2. Add FHIR/HL7 integration governance for NHS deployments.
3. Implement advanced tenant isolation and organisation-level encryption key management.
4. Run ISO 27001/27701 internal audit readiness assessment.

## 3. Updated secure code summary

- `lib/security.ts` provides JWT verification, secure route guards, role checks, MFA enforcement, rate limiting, CSRF origin checks, sanitisation, PII redaction, and audit event creation.
- `lib/validation.ts` validates and sanitises observation payloads before analysis or persistence.
- API routes under `app/api` are protected with authentication, role checks, validation, audit logging, and human-review flags.
- `middleware.ts` applies security headers and rejects unauthenticated API requests early.
- `backend/middleware/security.js` hardens the legacy Express prototype with security headers, rate limiting, token authentication, JSON size limits, CORS origin restriction, and input sanitisation.
- `supabase/schema.sql` contains expanded RLS, GDPR, safeguarding, file scanning, AI logging, and security event controls.

## 4. Supabase RLS policy model

RLS is enabled for all application tables, including organisations, schools, professionals, evidence embeddings, GDPR tables, safeguarding tables, AI logs, and security events. Access is based on:

- `auth.uid()` identity.
- Direct parent/adult ownership.
- Explicit `access_relationships` assignments.
- Administrator-only access for governance tables.
- Deny-by-default access for embeddings.

Production tests must prove that:

1. A parent can only access their linked child records.
2. An adult user can only access their own adult record unless explicit sharing exists.
3. A SENCO/teacher can only access assigned records.
4. A clinician/social worker/local authority officer can only access records explicitly assigned or lawfully shared.
5. Commissioners can only access aggregated/de-identified analytics, not identifiable records unless separately authorised.
6. Audit, AI, security, lawful-basis, and retention records are administrator-restricted.

## 5. GDPR compliance checklist

- [x] Lawful basis records table.
- [x] Explicit consent table and withdrawal timestamp.
- [x] Privacy notice versioning and acceptance records.
- [x] Data subject request table for SAR, rectification, erasure, restriction, portability, and objection.
- [x] Processing restriction table.
- [x] Retention policy table.
- [x] Audit logs for reads, writes, exports, consent changes, AI usage, and safeguarding events.
- [x] Data minimisation through validation, maximum payload sizes, and AI redaction helpers.
- [ ] Production SAR export workflow with identity verification.
- [ ] Secure deletion worker and deletion certificate process.
- [ ] DPIA approved by DPO and reviewed after material changes.
- [ ] Data processing agreements and sub-processor register.
- [ ] Age-appropriate privacy notices tested with children and parents.

## 6. Safeguarding compliance checklist

- [x] Risk review route identifies low, moderate/high, and urgent safeguarding concerns.
- [x] Critical alert path for suicidal language and urgent safeguarding indicators.
- [x] Safeguarding alerts table.
- [x] Immutable safeguarding actions table.
- [x] Audit events for urgent safeguarding alerts.
- [x] Human review required on safeguarding and clinical outputs.
- [ ] Named DSL/safeguarding lead routing per organisation.
- [ ] Out-of-hours escalation pathway.
- [ ] SLA dashboard for acknowledgement and closure.
- [ ] Staff training and supervision records.
- [ ] Regular safeguarding false-negative review.

## 7. Cyber Essentials Plus checklist

- [x] Secure configuration: security headers, deny-by-default API access, environment-only secrets.
- [x] Access control: authentication guards, RBAC, MFA enforcement for privileged roles.
- [x] Malware protection design: file security scan table and quarantine workflow requirement.
- [x] Patch management design: dependency scanning required in CI.
- [x] Firewalls and internet gateways: Vercel/Supabase managed edge with HTTPS-only deployment requirement.
- [ ] Independent Cyber Essentials Plus assessment.
- [ ] Device management evidence for operational staff.
- [ ] Vulnerability scan evidence and remediation register.

## 8. Data flow diagram description

1. **User device to Vercel:** Users access the Next.js application over HTTPS/TLS 1.2+.
2. **Authentication:** Supabase Auth issues secure JWT sessions. Privileged roles require MFA.
3. **API protection:** Next.js route handlers verify JWTs, enforce role/MFA checks, validate input, rate limit requests, and write audit events.
4. **Database access:** Server-side operations use Supabase/PostgreSQL with RLS policies based on user identity, explicit relationships, consent, and lawful basis.
5. **Storage:** Documents are stored in private Supabase buckets. Uploads require MIME/size checks, malware scanning, and short-lived signed URLs.
6. **AI processing:** Inputs are minimised/redacted before AI workflows. Prompts/outputs are logged by hash with human-review flags. Safeguarding/clinical outputs cannot be finalised without professional review.
7. **Monitoring:** Sentry, security events, audit logs, and SIEM alerts monitor failed auth, abnormal access, exports, safeguarding events, and system errors.
8. **Exports/deletion:** Reports and SAR exports use private storage with expiry. Retention and secure deletion workflows remove data when legally appropriate.

## 9. Incident response plan

1. **Triage:** Classify severity within 30 minutes for suspected data breach, safeguarding failure, malware upload, account compromise, or AI safety incident.
2. **Containment:** Disable affected accounts/sessions, revoke tokens, quarantine files, rotate secrets, and pause affected AI/export workflows.
3. **Safeguarding:** If a child or adult is at immediate risk, follow the configured safeguarding pathway and record actions in immutable safeguarding logs.
4. **Assessment:** Determine categories of data affected, number of subjects, likelihood of harm, and whether ICO notification is required within 72 hours.
5. **Notification:** Notify DPO, SIRO, Caldicott Guardian, clinical safety officer, affected controllers/processors, ICO, NHS partners, and data subjects where required.
6. **Eradication and recovery:** Patch vulnerabilities, restore from known-good backups, verify integrity, and monitor for recurrence.
7. **Post-incident review:** Complete root-cause analysis, update DPIA/threat model, retrain staff, and track remediation to closure.

## 10. Security architecture summary

NeuroPathway now follows defence in depth:

- Zero-trust API routes with JWT verification, RBAC, MFA checks, rate limiting, input validation, audit logging, and structured errors.
- Supabase RLS for data-layer isolation using explicit access relationships and ownership rules.
- Safeguarding-by-design tables for alerts, immutable actions, escalation, and auditability.
- Privacy-by-design tables for lawful basis, privacy notices, SARs, restrictions, and retention.
- AI safety controls for redaction, non-diagnostic wording, uncertainty, human review, and prompt/output audit hashes.
- Browser protections via CSP, HSTS, frame denial, content-type hardening, referrer policy, and permissions policy.

## 11. Recommended penetration testing plan

1. **Scope:** Web app, API routes, Supabase RLS, storage buckets, auth/MFA flows, AI endpoints, report exports, commissioner analytics, and admin workflows.
2. **Methodology:** OWASP ASVS, OWASP Top 10, OWASP API Security Top 10, NCSC cloud security principles, Cyber Essentials Plus verification.
3. **RLS testing:** Attempt horizontal and vertical privilege escalation across parent, adult, SENCO, clinician, social worker, local authority, commissioner, and admin personas.
4. **AI testing:** Prompt injection, data exfiltration, jailbreak attempts, unsafe safeguarding advice, hallucinated clinical recommendations, and PII minimisation failures.
5. **File testing:** MIME confusion, malware samples in safe test harness, oversize files, path traversal, signed URL expiry, and unauthorised access.
6. **Session testing:** Token replay, missing MFA, password reset abuse, CSRF, CORS, rate-limit bypass, and account recovery flows.
7. **Reporting:** Rank findings by CVSS and safeguarding/privacy impact, require evidence, retest all P0/P1 fixes, and provide executive summary for NHS IG stakeholders.
