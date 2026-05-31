# MediSense™ DCB0129 clinical safety pack

## Clinical risk assessment

MediSense™ is a clinical decision support tool. It does not diagnose, prescribe or recommend treatment. The principal clinical risk is that a clinician over-relies on an incorrect, incomplete or outdated AI-generated summary. The MVP mitigates this by using extractive structured summaries, explicit unavailable-data wording, visible provenance for every statement and immediate deletion of active summaries at discharge.

## Safety case report

- Intended use: provide a concise admission care summary from authorised records for nurses, doctors and pharmacists.
- Intended users: trained clinicians in one Greater Manchester NHS Trust pilot.
- Safety claim: the system improves situational awareness without replacing professional judgement.
- Evidence: endpoint tests, provenance model, unavailable-data guardrail, kill-switch behaviour and audit logging.
- Residual risk: acceptable for supervised pilot only, subject to local clinical safety officer approval.

## Initial hazard log

| ID | Hazard | Control in MVP |
| --- | --- | --- |
| H-001 | Incorrect medication information | Display medication source, source date and confidence; never prescribe or alter medication. |
| H-002 | Missing risk information | Display "Information not available from connected records." instead of inferring. |
| H-003 | Outdated source records | Display source date for every statement. |
| H-004 | Incorrect patient matching | Admission trigger requires NHS Number and local Patient ID. |
| H-005 | AI hallucination | Structured JSON, deterministic settings and provenance validation for each statement. |
