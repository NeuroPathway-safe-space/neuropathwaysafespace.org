# NeuroPathway Ecosystem: Executive Summary and Architecture

## 1. Executive summary

NeuroPathway Ecosystem is an AI-assisted early identification and lifelong support platform for neurodivergent children, young people, adults, families, schools, clinicians, social care professionals, and commissioners. The mission is **“Prevention Is the Cure”**: identify needs earlier, convert lived observations into structured evidence, and coordinate practical support before crisis points are reached.

The platform is founded by **Tanja Hanson**, informed by lived experience and the goal that no family should experience preventable systemic failure. It combines a child and young person **Safe Space** app, observation capture, an AI evidence engine, EHCP-ready reporting, professional workflows, adult support tracking, and commissioner-level population analytics.

## 2. Technical architecture

### 2.1 Product modules

| Module | Purpose | Primary users |
| --- | --- | --- |
| Safe Space app | Mood logs, journaling, coping tools, safety plans, goals, rewards | Children, young people, adults |
| Observation capture | Structured observations, free text, files, time stamps, multi-source evidence | Parents, schools, clinicians, social workers |
| AI Evidence Engine | Pattern detection, summaries, functional impact, safeguarding flags | Families and professionals |
| EHCP report generator | Strengths, needs, SMART outcomes, provision, timeline | Parents, SENCOs, educational psychologists |
| Professional dashboard | Unified child view, trends, heat maps, comments, tasks | Multi-agency team |
| Adult support tracker | Medication reminders, wellbeing logs, goals, progress | Adult users and support network |
| Commissioner analytics | Waiting lists, risk stratification, outcomes, cost-saving estimates | ICBs, NHS Trusts, local authorities |

### 2.2 Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui-ready component architecture.
- **Backend:** Supabase Auth, PostgreSQL, Storage, Edge Functions, Row Level Security.
- **AI:** OpenAI API with retrieval-augmented generation over structured evidence and document embeddings.
- **Infrastructure:** Vercel for web deployment, Supabase for managed backend, GitHub for CI/CD.
- **Monitoring:** Sentry for errors, PostHog for privacy-conscious product analytics.
- **Security:** MFA, RBAC, consent management, RLS, encryption at rest and in transit, audit logs, rate limiting, security headers, immutable safeguarding actions, DPIA-ready governance. Detailed hardening is documented in `docs/security-compliance.md`.

### 2.3 High-level data flow

1. User signs in with Supabase Auth and MFA for privileged roles.
2. Consent and role checks determine access to child, adult, organisation, or commissioner records.
3. Observations, mood logs, journal entries, tasks, and documents are captured with timestamps and source attribution.
4. AI services summarise evidence, detect recurring themes, calculate risk, and draft report sections.
5. Professionals review AI outputs before they become formal reports or escalation decisions.
6. Aggregated and de-identified metrics feed commissioner dashboards.

## 3. Database schema

The initial SQL schema is in `supabase/schema.sql`. It defines the required tables: `users`, `children`, `adults`, `observations`, `journal_entries`, `mood_logs`, `risk_scores`, `reports`, `documents`, `consents`, `tasks`, `notifications`, `organisations`, `schools`, `professionals`, and `audit_logs`.

Key implementation points:

- `auth.users` remains the identity source of truth.
- `users` stores application role, organisation, profile, and MFA metadata.
- `consents` records purpose, status, expiry, withdrawal, and sharing organisation.
- `observations`, `journal_entries`, `mood_logs`, `reports`, `documents`, and `risk_scores` support both child and adult journeys.
- `audit_logs` records access and data-changing actions.
- `evidence_embeddings` supports RAG with pgvector.
- Baseline RLS policies are intentionally conservative and should be expanded during tenant onboarding.

## 4. Supabase setup instructions

1. Create a Supabase project in the UK/EU region where possible for data residency alignment.
2. Enable email/password, magic link if required, and MFA factors for professional and administrator roles.
3. Run `supabase/schema.sql` in the Supabase SQL editor or through Supabase CLI migrations.
4. Create private storage buckets:
   - `documents`
   - `voice-notes`
   - `safe-space-media`
   - `report-exports`
5. Configure signed URL expiry for sensitive files.
6. Store environment variables in Vercel and local `.env.local` using `.env.example` as the template.
7. Add Edge Functions for AI generation, report export, notification dispatch, and audit log fan-out.
8. Validate RLS policies using Supabase tests before production onboarding.

## 5. API routes

Recommended Next.js route handlers:

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/observations` | `GET`, `POST` | List and create observations after consent and role checks |
| `/api/ai/observations/analyse` | `POST` | Return the required NeuroPathway JSON structure: observation summary, patterns, needs, evidence strength, supports, missing information, professional summary, and risk flags |
| `/api/ai/ehcp-evidence` | `POST` | Convert observations into EHCP-ready evidence domains with functional impact wording |
| `/api/ai/risk-review` | `POST` | Review self-harm, suicidal language, absconding, exploitation, crisis, aggression, neglect, and medication indicators |
| `/api/ai/journal` | `POST` | Analyse Safe Space journal tone, stress indicators, protective factors, support suggestions, and escalation warning |
| `/api/ai/agents` | `POST` | Run specialist agent outputs for Risk, Observation, EHCP, Parent Support, Clinical Summary, and Safeguarding |
| `/api/journal` | `GET`, `POST` | Safe Space journal entries and summaries |
| `/api/mood-logs` | `GET`, `POST` | Mood tracker history and daily submissions |
| `/api/risk/analyse` | `POST` | Calculate deterministic risk and request AI pattern narrative |
| `/api/reports/ehcp` | `POST` | Generate draft EHCP-ready evidence pack |
| `/api/documents/sign-upload` | `POST` | Create signed upload URL for Supabase Storage |
| `/api/tasks` | `GET`, `POST`, `PATCH` | Multi-agency task management |
| `/api/commissioner/insights` | `GET` | Aggregated, de-identified population metrics |
| `/api/admin/audit-logs` | `GET` | Audited administrator access to logs |

All API routes must enforce authentication, RBAC, consent, audit logging, input validation with Zod, and safe error responses.

## 6. AI prompt templates

Prompt templates live in `lib/ai-prompts.ts`, while deterministic structured output helpers live in `lib/neuro-ai-analysis.ts`. The NeuroPathway AI system prompt requires non-diagnostic, trauma-informed, safeguarding-prioritised JSON output with eight mandatory sections: Observation Summary, Patterns Identified, Possible Areas of Need, Evidence Strength, Recommended Supports, Missing Information, Professional Summary, and Risk Flags. The templates cover:

- Observation summaries.
- Behavioural pattern detection.
- Functional impact statements.
- EHCP-ready evidence packs.
- Safeguarding concern highlighting.
- Parent-friendly summaries.
- Clinician-friendly summaries.
- Multi-agent collaboration between Risk Agent, Observation Agent, EHCP Agent, Parent Support Agent, Clinical Summary Agent, and Safeguarding Agent.

AI outputs must be treated as drafts. The UI should display evidence IDs, confidence, limitations, and a professional review requirement.

## 7. Risk scoring logic

The deterministic baseline risk engine is in `lib/risk-scoring.ts`. It calculates Green, Amber, or Red risk using:

- Observation category weights.
- Intensity from 1 to 5.
- Recency multipliers for the last 7 days.
- Thirty-day recurring pattern boosts.
- Safeguarding and self-harm escalation factors.

This creates an explainable score before any AI narrative is generated, which supports auditability and avoids opaque triage. Safeguarding review additionally categorises concerns as `low`, `moderate`, `high`, or `urgent_safeguarding_concern` and explains why each flag was triggered.

## 8. EHCP report generation logic

The EHCP scaffold in `lib/ehcp-report.ts` creates reviewable sections:

1. Child or young person profile.
2. Strengths and protective factors.
3. Presenting needs and patterns.
4. Functional impact.
5. Risk and safeguarding summary.
6. SMART outcomes and provision.

The final production flow should include professional review, version history, export to PDF, and a clear separation between observed evidence and professional opinion.

## 9. Next.js folder structure

```text
app/
  api/ai/agents/route.ts
  api/ai/ehcp-evidence/route.ts
  api/ai/journal/route.ts
  api/ai/observations/analyse/route.ts
  api/ai/risk-review/route.ts
  commissioner/page.tsx
  dashboard/page.tsx
  globals.css
  layout.tsx
  observations/page.tsx
  page.tsx
  reports/page.tsx
  safe-space/page.tsx
components/
  brand.tsx
  risk-badge.tsx
  stat-card.tsx
lib/
  ai-prompts.ts
  ehcp-report.ts
  neuro-ai-analysis.ts
  risk-scoring.ts
  supabase.ts
types/
  domain.ts
  neuro-ai.ts
supabase/
  schema.sql
docs/
  neuro-pathway-architecture.md
```

## 10. Security and compliance plan

- Complete DPIA, clinical safety case, threat model, and data processing agreement templates before pilots.
- Assign Caldicott Guardian, DPO, clinical safety officer, SIRO, and product owner responsibilities for NHS deployments.
- Use least-privilege RBAC and Supabase RLS for every table.
- Enforce MFA for professionals, administrators, and commissioners.
- Encrypt all data in transit with TLS and at rest through Supabase-managed encryption.
- Keep documents in private buckets with short-lived signed URLs.
- Log all sensitive reads, writes, exports, AI generations, and consent changes.
- Implement retention schedules, subject access export, rectification, erasure workflows, and data minimisation.
- Run accessibility testing against WCAG 2.2 AA.
- Treat safeguarding flags as high-priority workflow items, not automated decisions.

## 11. Deployment instructions

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add Supabase, OpenAI, Sentry, and PostHog keys.
3. Run `npm run typecheck` and `npm run build` locally.
4. Connect the GitHub repository to Vercel.
5. Configure Vercel environment variables for preview and production.
6. Apply Supabase migrations to staging, run smoke tests, then promote to production.
7. Configure Sentry release tracking and PostHog privacy settings.
8. Set up database backups, restore tests, uptime monitoring, and incident response runbooks.

## 12. Testing strategy

- **Unit tests:** risk scoring, EHCP section generation, prompt assembly, validation schemas.
- **Integration tests:** Supabase RLS policies, route handlers, storage signed URLs, audit logging.
- **End-to-end tests:** parent observation journey, child Safe Space journal, SENCO report generation, commissioner dashboard.
- **Security tests:** dependency scanning, OWASP checks, access-control regression tests, MFA enforcement.
- **Clinical safety tests:** safeguarding false-negative review, report traceability, human-in-the-loop approval.
- **Accessibility tests:** keyboard navigation, screen reader labels, colour contrast, mobile layout.

## 13. MVP development plan

### Phase 0: Foundation

- Confirm information governance, DPIA scope, clinical safety ownership, and safeguarding pathways.
- Build Supabase schema, Auth, RLS, and storage buckets.
- Implement responsive Next.js shell with NHS-aligned design.

### Phase 1: Family and school evidence capture

- Parent/carer onboarding and consent.
- Child profile and school linkage.
- Structured observations and document uploads.
- Basic dashboard and timeline.

### Phase 2: Safe Space and risk insight

- Mood tracker, journaling, coping tools, goals, and safety plan.
- Deterministic risk scoring.
- AI observation summaries and pattern detection.

### Phase 3: EHCP-ready reporting

- Report generator, professional review workflow, PDF export.
- Multi-agency comments and tasks.
- Audit logs and evidence traceability.

### Phase 4: Pilot readiness

- Accessibility audit, security testing, clinical safety review, analytics, onboarding materials.
- Pilot with selected schools, local authority teams, and health partners.

## 14. Commercial roadmap

### Schools and local authorities

- Per-school or per-pupil licensing.
- SENCO dashboards, EHCP evidence packs, parental collaboration, attendance and need trends.

### NHS Trusts and ICBs

- Pathway stratification, waiting list prioritisation support, integrated care dashboards, outcomes reporting.

### Universities and employers

- Adult support tracker, workplace adjustment evidence, wellbeing analytics, consented support coordination.

### National scale

- Multi-tenant SaaS, configurable pathways, FHIR integration, marketplace partner integrations, advanced population health analytics, and independently validated outcome/cost-saving models.
