# MediSense™ Greater Manchester MVP

MediSense™ is an NHS pilot MVP that generates a safe, explainable admission care summary from authorised healthcare records. The current repository contains a working Express/static implementation of the pilot workflow plus architecture, safety and rollout documentation for the target Next.js/NestJS/Azure production architecture.

## Project layout

- `backend/`: API, deterministic summary generation, provenance, audit logging and discharge kill switch.
- `frontend/`: NHS-styled static clinical dashboard for the MVP workflow.
- `docs/`: solution architecture, C4 diagrams, schema, API specification, FHIR mapping, infrastructure, security, clinical safety, backlog, sprint plan, deployment guide, test strategy and pilot rollout plan.

## Backend

```bash
cd backend
npm install
npm run dev
```

The API runs on `http://localhost:4000` and exposes both root-level and `/api`-prefixed MediSense endpoints:

- `GET /health`
- `POST /admissions`
- `POST /generate-summary`
- `GET /summary/{admissionId}`
- `GET /provenance/{summaryId}`
- `POST /discharge`
- `GET /audit`

Legacy demo endpoints remain available at `/api/pathways` and `/api/checkins`.

## Frontend

Serve the `frontend/` directory with any static server:

```bash
cd frontend
python -m http.server 8080
```

Open `http://localhost:8080` while the backend is running.

## Safety principles

- The MVP does not diagnose, prescribe, recommend treatment, invent information or infer missing information.
- Missing data is rendered as: "Information not available from connected records."
- Every statement contains source system, source record ID, source date and confidence score.
- Active AI summaries are temporary and removed by the discharge kill switch; audit logs are retained.
