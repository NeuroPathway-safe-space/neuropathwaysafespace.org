-- NeuroPathway Ecosystem initial Supabase schema.
-- Enable extensions required for UUIDs, case-insensitive email, and vector RAG search.
create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "vector";

create type user_role as enum (
  'parent_carer', 'child_young_person', 'adult_user', 'teacher_senco',
  'educational_psychologist', 'speech_language_therapist', 'occupational_therapist',
  'camhs_clinician', 'social_worker', 'gp_paediatrician', 'local_authority_officer', 'administrator', 'commissioner'
);

create type risk_level as enum ('green', 'amber', 'red');
create type consent_status as enum ('granted', 'withdrawn', 'expired', 'pending');
create type observation_category as enum (
  'emotional_dysregulation', 'executive_functioning', 'sensory_processing',
  'communication_difference', 'sleep', 'school_avoidance', 'anxiety', 'self_harm_risk'
);

create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('nhs_trust', 'icb', 'local_authority', 'school', 'university', 'employer', 'provider')),
  ods_code text,
  created_at timestamptz not null default now()
);

create table schools (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id) on delete cascade,
  name text not null,
  urn text,
  local_authority text,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid references organisations(id),
  email citext not null unique,
  full_name text not null,
  role user_role not null,
  mfa_enabled boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  registration_body text,
  registration_number text,
  job_title text,
  service_name text,
  created_at timestamptz not null default now()
);

create table children (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  school_id uuid references schools(id),
  nhs_number text,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  pronouns text,
  primary_parent_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table adults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  date_of_birth date,
  support_preferences jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid references users(id),
  child_id uuid references children(id) on delete cascade,
  granted_by uuid not null references users(id),
  shared_with_organisation_id uuid references organisations(id),
  purpose text not null,
  status consent_status not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  check ((subject_user_id is not null) or (child_id is not null))
);

create table observations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  adult_id uuid references adults(id) on delete cascade,
  created_by uuid not null references users(id),
  category observation_category not null,
  intensity int not null check (intensity between 1 and 5),
  narrative text not null,
  context jsonb not null default '{}',
  safeguarding_concern boolean not null default false,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  check ((child_id is not null) or (adult_id is not null))
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  adult_id uuid references adults(id) on delete cascade,
  created_by uuid not null references users(id),
  title text,
  body text not null,
  emotion_tags text[] not null default '{}',
  ai_summary text,
  created_at timestamptz not null default now(),
  check ((child_id is not null) or (adult_id is not null))
);

create table mood_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  adult_id uuid references adults(id) on delete cascade,
  created_by uuid not null references users(id),
  mood_label text not null,
  mood_score int not null check (mood_score between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  check ((child_id is not null) or (adult_id is not null))
);

create table risk_scores (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  adult_id uuid references adults(id) on delete cascade,
  level risk_level not null,
  score int not null check (score between 0 and 100),
  rationale jsonb not null default '[]',
  recommended_action text not null,
  model_version text not null,
  calculated_at timestamptz not null default now(),
  check ((child_id is not null) or (adult_id is not null))
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  adult_id uuid references adults(id) on delete cascade,
  created_by uuid not null references users(id),
  report_type text not null check (report_type in ('ehcp', 'parent_summary', 'clinician_summary', 'commissioner_brief')),
  status text not null default 'draft',
  content jsonb not null,
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  check ((child_id is not null) or (adult_id is not null))
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  adult_id uuid references adults(id) on delete cascade,
  uploaded_by uuid not null references users(id),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  classification text not null default 'evidence',
  created_at timestamptz not null default now(),
  check ((child_id is not null) or (adult_id is not null))
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  child_id uuid references children(id) on delete cascade,
  adult_id uuid references adults(id) on delete cascade,
  assigned_to uuid references users(id),
  created_by uuid not null references users(id),
  title text not null,
  description text,
  due_at timestamptz,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  organisation_id uuid references organisations(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);


create table access_relationships (
  id uuid primary key default gen_random_uuid(),
  subject_child_id uuid references children(id) on delete cascade,
  subject_adult_id uuid references adults(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('parent_carer', 'assigned_professional', 'senco', 'clinician', 'social_worker', 'local_authority_officer', 'adult_self')),
  granted_by uuid references users(id),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  check ((subject_child_id is not null) or (subject_adult_id is not null))
);

create table lawful_basis_records (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid references users(id),
  child_id uuid references children(id) on delete cascade,
  processing_purpose text not null,
  lawful_basis text not null check (lawful_basis in ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests', 'special_category_health_social_care', 'safeguarding_children')),
  special_category_condition text,
  documented_by uuid not null references users(id),
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check ((subject_user_id is not null) or (child_id is not null))
);

create table privacy_notices (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('child', 'young_person', 'adult', 'parent_carer', 'professional')),
  version text not null,
  content_url text not null,
  effective_from timestamptz not null,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  unique (audience, version)
);

create table privacy_notice_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  privacy_notice_id uuid not null references privacy_notices(id),
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  unique (user_id, privacy_notice_id)
);

create table data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references users(id),
  subject_user_id uuid references users(id),
  child_id uuid references children(id),
  request_type text not null check (request_type in ('sar', 'rectification', 'erasure', 'restriction', 'portability', 'objection')),
  status text not null default 'open' check (status in ('open', 'verifying_identity', 'in_progress', 'completed', 'rejected')),
  due_at timestamptz not null,
  completed_at timestamptz,
  secure_export_path text,
  notes text,
  created_at timestamptz not null default now(),
  check ((subject_user_id is not null) or (child_id is not null))
);

create table processing_restrictions (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid references users(id),
  child_id uuid references children(id),
  restriction_reason text not null,
  active boolean not null default true,
  applied_by uuid not null references users(id),
  lifted_by uuid references users(id),
  lifted_at timestamptz,
  created_at timestamptz not null default now(),
  check ((subject_user_id is not null) or (child_id is not null))
);

create table retention_policies (
  id uuid primary key default gen_random_uuid(),
  data_category text not null unique,
  retention_period interval not null,
  legal_basis text not null,
  secure_deletion_method text not null,
  review_frequency interval not null default interval '1 year',
  created_at timestamptz not null default now()
);

create table safeguarding_alerts (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  adult_id uuid references adults(id) on delete cascade,
  observation_id uuid references observations(id),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  alert_type text not null,
  summary text not null,
  triggered_by uuid references users(id),
  assigned_to uuid references users(id),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'escalated', 'closed')),
  opened_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  closed_at timestamptz,
  check ((child_id is not null) or (adult_id is not null))
);

create table safeguarding_actions (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references safeguarding_alerts(id) on delete cascade,
  actor_user_id uuid not null references users(id),
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table file_security_scans (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  scan_provider text not null,
  scan_status text not null check (scan_status in ('pending', 'clean', 'quarantined', 'failed')),
  malware_signature text,
  scanned_at timestamptz,
  created_at timestamptz not null default now()
);

create table ai_interaction_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  child_id uuid references children(id),
  adult_id uuid references adults(id),
  feature_name text not null,
  prompt_hash text not null,
  output_hash text not null,
  model text,
  human_review_required boolean not null default true,
  safeguarding_flagged boolean not null default false,
  created_at timestamptz not null default now(),
  check ((child_id is not null) or (adult_id is not null) or (actor_user_id is not null))
);

create table security_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  event_type text not null,
  severity text not null check (severity in ('info', 'warning', 'high', 'critical')),
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table evidence_embeddings (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid references observations(id) on delete cascade,
  report_id uuid references reports(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  check ((observation_id is not null) or (report_id is not null))
);

alter table organisations enable row level security;
alter table schools enable row level security;
alter table users enable row level security;
alter table children enable row level security;
alter table adults enable row level security;
alter table observations enable row level security;
alter table journal_entries enable row level security;
alter table mood_logs enable row level security;
alter table risk_scores enable row level security;
alter table reports enable row level security;
alter table documents enable row level security;
alter table consents enable row level security;
alter table access_relationships enable row level security;
alter table lawful_basis_records enable row level security;
alter table privacy_notices enable row level security;
alter table privacy_notice_acceptances enable row level security;
alter table data_subject_requests enable row level security;
alter table processing_restrictions enable row level security;
alter table retention_policies enable row level security;
alter table safeguarding_alerts enable row level security;
alter table safeguarding_actions enable row level security;
alter table file_security_scans enable row level security;
alter table ai_interaction_logs enable row level security;
alter table security_events enable row level security;
alter table tasks enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table professionals enable row level security;
alter table evidence_embeddings enable row level security;

create policy "Users can read own profile" on users for select using (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);
create policy "Notifications are private" on notifications for select using (auth.uid() = user_id);
create policy "Parents can view linked children" on children for select using (primary_parent_id = auth.uid());
create policy "Creators can view own observations" on observations for select using (created_by = auth.uid());
create policy "Creators can insert observations" on observations for insert with check (created_by = auth.uid());
create policy "Creators can view own journal entries" on journal_entries for select using (created_by = auth.uid());
create policy "Creators can insert journal entries" on journal_entries for insert with check (created_by = auth.uid());

create index observations_child_time_idx on observations(child_id, occurred_at desc);
create index mood_logs_child_time_idx on mood_logs(child_id, created_at desc);
create index risk_scores_child_time_idx on risk_scores(child_id, calculated_at desc);
create index reports_child_type_idx on reports(child_id, report_type);
create index audit_logs_entity_idx on audit_logs(entity_table, entity_id, created_at desc);


create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from users where id = auth.uid() and role = 'administrator');
$$;

create or replace function has_child_access(target_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from children where id = target_child_id and primary_parent_id = auth.uid()
  ) or exists (
    select 1 from access_relationships
    where subject_child_id = target_child_id
      and user_id = auth.uid()
      and (valid_until is null or valid_until > now())
  ) or is_admin();
$$;

create or replace function has_adult_access(target_adult_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from adults where id = target_adult_id and user_id = auth.uid()
  ) or exists (
    select 1 from access_relationships
    where subject_adult_id = target_adult_id
      and user_id = auth.uid()
      and (valid_until is null or valid_until > now())
  ) or is_admin();
$$;

create policy "Organisation members can read organisation" on organisations for select using (
  is_admin() or exists (select 1 from users where users.organisation_id = organisations.id and users.id = auth.uid())
);
create policy "Organisation members can read schools" on schools for select using (
  is_admin() or exists (select 1 from users where users.organisation_id = schools.organisation_id and users.id = auth.uid())
);
create policy "Professionals can read own professional profile" on professionals for select using (user_id = auth.uid() or is_admin());
create policy "Access relationships visible to assigned users" on access_relationships for select using (user_id = auth.uid() or is_admin());

create policy "Relationship based child reads" on children for select using (has_child_access(id));
create policy "Adults can read own adult record" on adults for select using (has_adult_access(id));
create policy "Relationship based observation reads" on observations for select using (
  (child_id is not null and has_child_access(child_id)) or (adult_id is not null and has_adult_access(adult_id))
);
create policy "Relationship based journal reads" on journal_entries for select using (
  (child_id is not null and has_child_access(child_id)) or (adult_id is not null and has_adult_access(adult_id))
);
create policy "Relationship based mood reads" on mood_logs for select using (
  (child_id is not null and has_child_access(child_id)) or (adult_id is not null and has_adult_access(adult_id))
);
create policy "Relationship based risk reads" on risk_scores for select using (
  (child_id is not null and has_child_access(child_id)) or (adult_id is not null and has_adult_access(adult_id))
);
create policy "Relationship based report reads" on reports for select using (
  (child_id is not null and has_child_access(child_id)) or (adult_id is not null and has_adult_access(adult_id))
);
create policy "Relationship based document reads" on documents for select using (
  (child_id is not null and has_child_access(child_id)) or (adult_id is not null and has_adult_access(adult_id))
);
create policy "Relationship based task reads" on tasks for select using (
  assigned_to = auth.uid() or created_by = auth.uid() or (child_id is not null and has_child_access(child_id)) or (adult_id is not null and has_adult_access(adult_id))
);
create policy "Safeguarding alerts restricted to authorised users" on safeguarding_alerts for select using (
  (child_id is not null and has_child_access(child_id)) or (adult_id is not null and has_adult_access(adult_id))
);
create policy "Safeguarding actions restricted to authorised users" on safeguarding_actions for select using (
  exists (select 1 from safeguarding_alerts where safeguarding_alerts.id = safeguarding_actions.alert_id and ((safeguarding_alerts.child_id is not null and has_child_access(safeguarding_alerts.child_id)) or (safeguarding_alerts.adult_id is not null and has_adult_access(safeguarding_alerts.adult_id))))
);
create policy "Lawful basis admin read" on lawful_basis_records for select using (is_admin());
create policy "Privacy notices are readable" on privacy_notices for select using (true);
create policy "Users read own privacy notice acceptances" on privacy_notice_acceptances for select using (user_id = auth.uid() or is_admin());
create policy "Users can create own data subject requests" on data_subject_requests for insert with check (requester_user_id = auth.uid());
create policy "Users can read own data subject requests" on data_subject_requests for select using (requester_user_id = auth.uid() or is_admin());
create policy "Processing restrictions admin read" on processing_restrictions for select using (is_admin());
create policy "Retention policies admin read" on retention_policies for select using (is_admin());
create policy "File scan admin read" on file_security_scans for select using (is_admin());
create policy "AI logs admin read" on ai_interaction_logs for select using (is_admin());
create policy "Security events admin read" on security_events for select using (is_admin());
create policy "Audit logs admin read" on audit_logs for select using (is_admin());
create policy "Embeddings service role only" on evidence_embeddings for select using (false);

create or replace function prevent_safeguarding_action_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Safeguarding actions are immutable';
end;
$$;

create trigger safeguarding_actions_no_update
before update or delete on safeguarding_actions
for each row execute function prevent_safeguarding_action_mutation();

create index access_relationships_child_user_idx on access_relationships(subject_child_id, user_id);
create index access_relationships_adult_user_idx on access_relationships(subject_adult_id, user_id);
create index safeguarding_alerts_subject_status_idx on safeguarding_alerts(child_id, adult_id, status, opened_at desc);
create index ai_interaction_logs_actor_time_idx on ai_interaction_logs(actor_user_id, created_at desc);
create index security_events_type_time_idx on security_events(event_type, created_at desc);
