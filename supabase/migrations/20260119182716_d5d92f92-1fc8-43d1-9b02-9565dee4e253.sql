-- Last updated: 20th January 2025
-- =========================================================
-- ONLINE FRAUD MANAGEMENT SYSTEM (Supabase/PostgreSQL)
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------
-- 1) APP CONTEXT (optional)
-- ---------------------------
create or replace function public.set_app_context(p_user_id uuid, p_ip text)
returns void
language plpgsql
as $$
begin
  perform set_config('app.user_id', p_user_id::text, true);
  perform set_config('app.ip', p_ip::text, true);
end $$;

create or replace function public.app_user_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    auth.uid(),
    nullif(current_setting('app.user_id', true), '')::uuid
  );
$$;

create or replace function public.app_ip()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.ip', true), '');
$$;

-- ---------------------------
-- 2) ENUM TYPES
-- ---------------------------
create type case_category  as enum ('PAYMENT_FRAUD','IDENTITY_THEFT','ACCOUNT_TAKEOVER','SCAM','OTHER');
create type severity_level as enum ('LOW','MEDIUM','HIGH');
create type case_status    as enum ('OPEN','UNDER_INVESTIGATION','CLOSED');
create type evidence_type  as enum ('SCREENSHOT','PDF','TRANSACTION_LOG','OTHER');
create type txn_channel    as enum ('BKASH','NAGAD','CARD','BANK','CASH','OTHER');
create type risk_level     as enum ('LOW','MEDIUM','HIGH');
create type audit_action   as enum ('INSERT','UPDATE','DELETE');

-- ---------------------------
-- 3) RBAC + USERS
-- ---------------------------
create table public.roles (
  role_id   smallint generated always as identity primary key,
  role_name varchar(30) not null unique
);

insert into public.roles(role_name) values
('ADMIN'),('INVESTIGATOR'),('AUDITOR'),('CUSTOMER');

create table public.users (
  user_id        uuid primary key,
  role_id        smallint not null references public.roles(role_id),
  full_name      varchar(120) not null default 'New User',
  email          varchar(150) not null unique,
  phone          varchar(25),
  password_hash  varchar(255),
  is_active      boolean not null default true,
  is_locked      boolean not null default false,
  locked_until   timestamptz,
  created_at     timestamptz not null default now()
);

create index idx_users_role on public.users(role_id);

create table public.customers (
  customer_id    bigint generated always as identity primary key,
  user_id        uuid not null unique references public.users(user_id),
  nid_number     varchar(30),
  home_location  varchar(100),
  created_at     timestamptz not null default now()
);

create table public.investigators (
  investigator_id  bigint generated always as identity primary key,
  user_id          uuid not null unique references public.users(user_id),
  badge_no         varchar(30),
  department       varchar(80),
  is_available     boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.login_attempts (
  attempt_id     bigint generated always as identity primary key,
  user_id        uuid not null references public.users(user_id),
  attempted_at   timestamptz not null default now(),
  success        boolean not null,
  ip_address     varchar(45)
);

create index idx_login_attempts_user_time on public.login_attempts(user_id, attempted_at);

-- ---------------------------
-- 4) CASES + ASSIGNMENTS + HISTORY + EVIDENCE
-- ---------------------------
create table public.fraud_cases (
  case_id        bigint generated always as identity primary key,
  customer_id    bigint not null references public.customers(customer_id),
  title          varchar(200) not null,
  description    text,
  category       case_category not null default 'OTHER',
  severity       severity_level not null default 'LOW',
  status         case_status not null default 'OPEN',
  created_at     timestamptz not null default now(),
  closed_at      timestamptz
);

create index idx_cases_status   on public.fraud_cases(status);
create index idx_cases_customer on public.fraud_cases(customer_id, created_at);

create table public.case_assignments (
  assignment_id     bigint generated always as identity primary key,
  case_id           bigint not null references public.fraud_cases(case_id),
  investigator_id   bigint not null references public.investigators(investigator_id),
  assigned_by_user  uuid not null references public.users(user_id),
  assigned_at       timestamptz not null default now(),
  note              varchar(255)
);

create index idx_assign_case         on public.case_assignments(case_id, assigned_at);
create index idx_assign_investigator on public.case_assignments(investigator_id, assigned_at);

create table public.case_history (
  history_id      bigint generated always as identity primary key,
  case_id         bigint not null references public.fraud_cases(case_id),
  old_status      case_status not null,
  new_status      case_status not null,
  changed_by_user uuid,
  changed_at      timestamptz not null default now(),
  comment         varchar(255)
);

create index idx_case_hist_case on public.case_history(case_id, changed_at);

create table public.evidence_files (
  evidence_id     bigint generated always as identity primary key,
  case_id         bigint not null references public.fraud_cases(case_id),
  file_type       evidence_type not null default 'OTHER',
  file_path       varchar(500) not null,
  uploaded_by     uuid references public.users(user_id),
  uploaded_at     timestamptz not null default now(),
  note            varchar(255)
);

create index idx_evidence_case on public.evidence_files(case_id, uploaded_at);

-- ---------------------------
-- 5) TRANSACTIONS + RULES + SUSPICIOUS
-- ---------------------------
create table public.transactions (
  txn_id         bigint generated always as identity primary key,
  customer_id    bigint not null references public.customers(customer_id),
  txn_amount     numeric(12,2) not null,
  txn_location   varchar(100),
  txn_channel    txn_channel not null default 'OTHER',
  occurred_at    timestamptz not null default now()
);

create index idx_txn_customer_time on public.transactions(customer_id, occurred_at);
create index idx_txn_amount        on public.transactions(txn_amount);

create table public.fraud_rules (
  rule_id          int generated always as identity primary key,
  rule_code        varchar(30) not null unique,
  description      varchar(255) not null,
  is_active        boolean not null default true,
  amount_threshold numeric(12,2),
  freq_window_min  int,
  freq_count_limit int,
  risk_points      int not null default 10
);

insert into public.fraud_rules(rule_code, description, is_active, amount_threshold, freq_window_min, freq_count_limit, risk_points) values
('HIGH_AMOUNT', 'Amount exceeds threshold', true, 50000.00, null, null, 40),
('FREQ_TXN',    'Too many txns in short time', true, null, 10, 3, 30),
('LOC_MISMATCH','Transaction location mismatches customer home', true, null, null, null, 20);

create table public.suspicious_transactions (
  suspicious_id  bigint generated always as identity primary key,
  txn_id         bigint not null references public.transactions(txn_id),
  risk_score     int not null,
  risk_level     risk_level not null,
  reasons        varchar(500),
  flagged_at     timestamptz not null default now(),
  unique (txn_id, flagged_at)
);

create index idx_susp_level on public.suspicious_transactions(risk_level, flagged_at);

-- ---------------------------
-- 6) AUDIT LOG
-- ---------------------------
create table public.audit_log (
  audit_id      bigint generated always as identity primary key,
  table_name    varchar(64) not null,
  action_type   audit_action not null,
  record_pk     varchar(120) not null,
  old_values    text,
  new_values    text,
  acted_by_user uuid,
  acted_ip      varchar(45),
  acted_at      timestamptz not null default now()
);

create index idx_audit_table_time on public.audit_log(table_name, acted_at);

-- CASE TRANSACTIONS
create table public.case_transactions (
  case_id    bigint not null references public.fraud_cases(case_id),
  txn_id     bigint not null references public.transactions(txn_id),
  created_at timestamptz not null default now(),
  primary key (case_id, txn_id),
  unique (txn_id)
);

-- =========================================================
-- 7) FUNCTIONS + TRIGGERS
-- =========================================================

-- (A) Auto lock account on repeated fail attempts
create or replace function public.trg_login_attempt_lock_fn()
returns trigger
language plpgsql
as $$
declare
  v_fail_count int := 0;
begin
  if new.success = false then
    select count(*)
      into v_fail_count
    from public.login_attempts
    where user_id = new.user_id
      and success = false
      and attempted_at >= (now() - interval '1 hour');

    if v_fail_count >= 5 then
      update public.users
         set is_locked = true,
             locked_until = (now() + interval '1 hour')
       where user_id = new.user_id;
    end if;
  else
    update public.users
       set is_locked = false,
           locked_until = null
     where user_id = new.user_id;
  end if;

  return new;
end $$;

create trigger trg_login_attempt_lock
after insert on public.login_attempts
for each row execute function public.trg_login_attempt_lock_fn();

-- (B) Prevent reopening closed case + auto closed_at
create or replace function public.trg_case_prevent_reopen_fn()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'CLOSED' and new.status <> 'CLOSED' then
    raise exception 'Closed case cannot be reopened.';
  end if;

  if new.status = 'CLOSED' and old.status <> 'CLOSED' then
    new.closed_at := now();
  end if;

  return new;
end $$;

create trigger trg_case_prevent_reopen
before update on public.fraud_cases
for each row execute function public.trg_case_prevent_reopen_fn();

-- (C) Case history on status change
create or replace function public.trg_case_status_history_fn()
returns trigger
language plpgsql
as $$
begin
  if old.status <> new.status then
    insert into public.case_history(case_id, old_status, new_status, changed_by_user, changed_at, comment)
    values (new.case_id, old.status, new.status, public.app_user_id(), now(), 'Status changed');
  end if;
  return new;
end $$;

create trigger trg_case_status_history
after update on public.fraud_cases
for each row execute function public.trg_case_status_history_fn();

-- (D) Evaluate transaction
create or replace function public.evaluate_transaction(p_txn_id bigint)
returns void
language plpgsql
as $$
declare
  v_customer_id bigint;
  v_amount numeric(12,2);
  v_txn_loc varchar(100);
  v_home_loc varchar(100);
  v_score int := 0;
  v_reasons text := '';
  v_amt_thr numeric(12,2);
  v_amt_pts int;
  v_win_min int;
  v_cnt_lim int;
  v_freq_pts int;
  v_freq_cnt int := 0;
  v_loc_pts int;
begin
  select customer_id, txn_amount, txn_location
    into v_customer_id, v_amount, v_txn_loc
  from public.transactions
  where txn_id = p_txn_id;

  if v_customer_id is null then
    return;
  end if;

  select home_location into v_home_loc
  from public.customers
  where customer_id = v_customer_id;

  select amount_threshold, risk_points
    into v_amt_thr, v_amt_pts
  from public.fraud_rules
  where rule_code = 'HIGH_AMOUNT' and is_active = true
  limit 1;

  if v_amt_thr is not null and v_amount > v_amt_thr then
    v_score := v_score + coalesce(v_amt_pts, 0);
    v_reasons := v_reasons || 'HIGH_AMOUNT; ';
  end if;

  select freq_window_min, freq_count_limit, risk_points
    into v_win_min, v_cnt_lim, v_freq_pts
  from public.fraud_rules
  where rule_code = 'FREQ_TXN' and is_active = true
  limit 1;

  if v_win_min is not null and v_cnt_lim is not null then
    select count(*)
      into v_freq_cnt
    from public.transactions
    where customer_id = v_customer_id
      and occurred_at >= (now() - (v_win_min || ' minutes')::interval);

    if v_freq_cnt > v_cnt_lim then
      v_score := v_score + coalesce(v_freq_pts, 0);
      v_reasons := v_reasons || 'FREQ_TXN; ';
    end if;
  end if;

  select risk_points
    into v_loc_pts
  from public.fraud_rules
  where rule_code = 'LOC_MISMATCH' and is_active = true
  limit 1;

  if v_home_loc is not null and v_txn_loc is not null and v_home_loc <> v_txn_loc then
    v_score := v_score + coalesce(v_loc_pts, 0);
    v_reasons := v_reasons || 'LOC_MISMATCH; ';
  end if;

  if v_score >= 50 then
    insert into public.suspicious_transactions(txn_id, risk_score, risk_level, reasons, flagged_at)
    values (
      p_txn_id,
      v_score,
      case
        when v_score >= 80 then 'HIGH'
        when v_score >= 50 then 'MEDIUM'
        else 'LOW'
      end,
      left(v_reasons, 500),
      now()
    );
  end if;
end $$;

-- (E) After insert transaction => auto evaluate
create or replace function public.trg_txn_auto_eval_fn()
returns trigger
language plpgsql
as $$
begin
  perform public.evaluate_transaction(new.txn_id);
  return new;
end $$;

create trigger trg_txn_auto_eval
after insert on public.transactions
for each row execute function public.trg_txn_auto_eval_fn();

-- (G) Auto-create a Fraud Case when suspicious transaction inserted
create or replace function public.trg_suspicious_auto_case_fn()
returns trigger
language plpgsql
as $$
declare
  v_customer_id bigint;
  v_case_id bigint;
  v_severity severity_level := 'LOW';
  v_category case_category := 'PAYMENT_FRAUD';
begin
  select customer_id into v_customer_id
  from public.transactions
  where txn_id = new.txn_id
  limit 1;

  if v_customer_id is null then
    raise exception 'Auto-case failed: transaction not found for suspicious txn_id.';
  end if;

  v_severity := case new.risk_level
    when 'HIGH' then 'HIGH'
    when 'MEDIUM' then 'MEDIUM'
    else 'LOW'
  end;

  insert into public.fraud_cases(customer_id, title, description, category, severity, status, created_at)
  values (
    v_customer_id,
    'Auto Case: Suspicious TXN #'||new.txn_id,
    'Auto-generated from suspicious transaction. Risk score='||new.risk_score||', Level='||new.risk_level||
      coalesce(', Reasons='||new.reasons,''),
    v_category,
    v_severity,
    'OPEN',
    now()
  )
  returning case_id into v_case_id;

  insert into public.case_transactions(case_id, txn_id)
  values (v_case_id, new.txn_id)
  on conflict do nothing;

  return new;
end $$;

create trigger trg_suspicious_auto_case
after insert on public.suspicious_transactions
for each row execute function public.trg_suspicious_auto_case_fn();

-- ---------------------------
-- 8) AUDIT TRIGGERS
-- ---------------------------
create or replace function public.audit_cases_ins_fn()
returns trigger language plpgsql as $$
begin
  insert into public.audit_log(table_name, action_type, record_pk, old_values, new_values, acted_by_user, acted_ip)
  values (
    'fraud_cases','INSERT', new.case_id::text,
    null,
    'status='||new.status||', severity='||new.severity||', category='||new.category,
    public.app_user_id(), public.app_ip()
  );
  return new;
end $$;

create or replace function public.audit_cases_upd_fn()
returns trigger language plpgsql as $$
begin
  insert into public.audit_log(table_name, action_type, record_pk, old_values, new_values, acted_by_user, acted_ip)
  values (
    'fraud_cases','UPDATE', new.case_id::text,
    'status='||old.status||', severity='||old.severity||', category='||old.category,
    'status='||new.status||', severity='||new.severity||', category='||new.category,
    public.app_user_id(), public.app_ip()
  );
  return new;
end $$;

create trigger trg_audit_cases_ins
after insert on public.fraud_cases
for each row execute function public.audit_cases_ins_fn();

create trigger trg_audit_cases_upd
after update on public.fraud_cases
for each row execute function public.audit_cases_upd_fn();

create or replace function public.audit_txn_ins_fn()
returns trigger language plpgsql as $$
begin
  insert into public.audit_log(table_name, action_type, record_pk, old_values, new_values, acted_by_user, acted_ip)
  values (
    'transactions','INSERT', new.txn_id::text,
    null,
    'amount='||new.txn_amount||', loc='||coalesce(new.txn_location,'NULL')||', channel='||new.txn_channel,
    public.app_user_id(), public.app_ip()
  );
  return new;
end $$;

create trigger trg_audit_txn_ins
after insert on public.transactions
for each row execute function public.audit_txn_ins_fn();

create or replace function public.audit_susp_ins_fn()
returns trigger language plpgsql as $$
begin
  insert into public.audit_log(table_name, action_type, record_pk, old_values, new_values, acted_by_user, acted_ip)
  values (
    'suspicious_transactions','INSERT', new.suspicious_id::text,
    null,
    'txn_id='||new.txn_id||', score='||new.risk_score||', level='||new.risk_level,
    public.app_user_id(), public.app_ip()
  );
  return new;
end $$;

create trigger trg_audit_susp_ins
after insert on public.suspicious_transactions
for each row execute function public.audit_susp_ins_fn();

create or replace function public.audit_evidence_ins_fn()
returns trigger language plpgsql as $$
begin
  insert into public.audit_log(table_name, action_type, record_pk, old_values, new_values, acted_by_user, acted_ip)
  values (
    'evidence_files','INSERT', new.evidence_id::text,
    null,
    'case_id='||new.case_id||', type='||new.file_type||', path='||new.file_path,
    public.app_user_id(), public.app_ip()
  );
  return new;
end $$;

create trigger trg_audit_evidence_ins
after insert on public.evidence_files
for each row execute function public.audit_evidence_ins_fn();

-- =========================================================
-- 9) AUTH SYNC TRIGGER: auth.users -> public.users
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id int := 4;
  v_full_name text := 'New User';
begin
  if new.email ilike 'admin%' then
    v_role_id := 1;
  elsif new.email ilike 'inv%' then
    v_role_id := 2;
  elsif new.email ilike 'audit%' then
    v_role_id := 3;
  else
    v_role_id := 4;
  end if;

  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', 'New User');

  insert into public.users (user_id, email, role_id, full_name, is_active, is_locked, created_at)
  values (new.id, new.email, v_role_id, v_full_name, true, false, now())
  on conflict (user_id) do update
    set email     = excluded.email,
        role_id   = excluded.role_id,
        full_name = excluded.full_name,
        is_active = excluded.is_active;

  if v_role_id = 2 then
    begin
      insert into public.investigators (user_id, badge_no, department)
      values (
        new.id,
        'BD-' || lpad((floor(random()*9000)+1000)::int::text, 4, '0'),
        'Fraud Ops'
      )
      on conflict (user_id) do nothing;
    exception when others then
      null;
    end;
  end if;

  if v_role_id = 4 then
    begin
      insert into public.customers (user_id)
      values (new.id)
      on conflict (user_id) do nothing;
    exception when others then
      null;
    end;
  end if;

  return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =========================================================
-- 10) RBAC HELPER FUNCTIONS
-- =========================================================
create or replace function public.current_role_id()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select u.role_id
  from public.users u
  where u.user_id = auth.uid();
$$;

alter function public.current_role_id() owner to postgres;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_id() = 1;
$$;

create or replace function public.is_investigator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_id() = 2;
$$;

create or replace function public.is_auditor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_id() = 3;
$$;

create or replace function public.is_customer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_id() = 4;
$$;

alter function public.is_admin() owner to postgres;
alter function public.is_investigator() owner to postgres;
alter function public.is_auditor() owner to postgres;
alter function public.is_customer() owner to postgres;

-- =========================================================
-- 11) RLS POLICIES
-- =========================================================

-- USERS
alter table public.users enable row level security;

create policy users_select_self_or_admin
on public.users
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or public.is_auditor()
);

create policy users_update_self_or_admin
on public.users
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy users_admin_insert
on public.users
for insert
to authenticated
with check (public.is_admin());

create policy users_admin_delete
on public.users
for delete
to authenticated
using (public.is_admin());

-- CUSTOMERS
alter table public.customers enable row level security;

create policy customers_self_or_admin
on public.customers
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or public.is_auditor()
);

-- INVESTIGATORS
alter table public.investigators enable row level security;

create policy investigators_self_or_admin
on public.investigators
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or public.is_auditor()
);

-- TRANSACTIONS
alter table public.transactions enable row level security;

create policy tx_admin_all
on public.transactions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy tx_auditor_read
on public.transactions
for select
to authenticated
using (public.is_auditor());

create policy tx_customer_own_read
on public.transactions
for select
to authenticated
using (
  public.is_customer()
  and exists (
    select 1
    from public.customers c
    where c.customer_id = transactions.customer_id
      and c.user_id = auth.uid()
  )
);

create policy tx_investigator_assigned_read
on public.transactions
for select
to authenticated
using (
  public.is_investigator()
  and exists (
    select 1
    from public.case_transactions ct
    join public.case_assignments ca on ca.case_id = ct.case_id
    join public.investigators i on i.investigator_id = ca.investigator_id
    where ct.txn_id = transactions.txn_id
      and i.user_id = auth.uid()
  )
);

-- FRAUD CASES
alter table public.fraud_cases enable row level security;

create policy cases_admin_all
on public.fraud_cases
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy cases_auditor_read
on public.fraud_cases
for select
to authenticated
using (public.is_auditor());

create policy cases_customer_own_read
on public.fraud_cases
for select
to authenticated
using (
  public.is_customer()
  and exists (
    select 1
    from public.customers c
    where c.customer_id = fraud_cases.customer_id
      and c.user_id = auth.uid()
  )
);

create policy cases_customer_own_insert
on public.fraud_cases
for insert
to authenticated
with check (
  public.is_customer()
  and exists (
    select 1
    from public.customers c
    where c.customer_id = fraud_cases.customer_id
      and c.user_id = auth.uid()
  )
);

create policy cases_investigator_assigned_read
on public.fraud_cases
for select
to authenticated
using (
  public.is_investigator()
  and exists (
    select 1
    from public.case_assignments ca
    join public.investigators i on i.investigator_id = ca.investigator_id
    where ca.case_id = fraud_cases.case_id
      and i.user_id = auth.uid()
  )
);

-- CASE ASSIGNMENTS
alter table public.case_assignments enable row level security;

create policy ca_admin_all
on public.case_assignments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy ca_investigator_own_read
on public.case_assignments
for select
to authenticated
using (
  public.is_investigator()
  and exists (
    select 1
    from public.investigators i
    where i.investigator_id = case_assignments.investigator_id
      and i.user_id = auth.uid()
  )
);

-- CASE TRANSACTIONS
alter table public.case_transactions enable row level security;

create policy ct_admin_all
on public.case_transactions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy ct_investigator_assigned_read
on public.case_transactions
for select
to authenticated
using (
  public.is_investigator()
  and exists (
    select 1
    from public.case_assignments ca
    join public.investigators i on i.investigator_id = ca.investigator_id
    where ca.case_id = case_transactions.case_id
      and i.user_id = auth.uid()
  )
);

-- EVIDENCE FILES
alter table public.evidence_files enable row level security;

create policy evidence_admin_all
on public.evidence_files
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy evidence_auditor_read
on public.evidence_files
for select
to authenticated
using (public.is_auditor());

create policy evidence_customer_read_own_case
on public.evidence_files
for select
to authenticated
using (
  public.is_customer()
  and exists (
    select 1
    from public.fraud_cases fc
    join public.customers c on c.customer_id = fc.customer_id
    where fc.case_id = evidence_files.case_id
      and c.user_id = auth.uid()
  )
);

create policy evidence_customer_insert_own_case
on public.evidence_files
for insert
to authenticated
with check (
  public.is_customer()
  and uploaded_by = auth.uid()
  and exists (
    select 1
    from public.fraud_cases fc
    join public.customers c on c.customer_id = fc.customer_id
    where fc.case_id = evidence_files.case_id
      and c.user_id = auth.uid()
  )
);

create policy evidence_inv_read_assigned_case
on public.evidence_files
for select
to authenticated
using (
  public.is_investigator()
  and exists (
    select 1
    from public.case_assignments ca
    join public.investigators i on i.investigator_id = ca.investigator_id
    where ca.case_id = evidence_files.case_id
      and i.user_id = auth.uid()
  )
);

create policy evidence_inv_insert_assigned_case
on public.evidence_files
for insert
to authenticated
with check (
  public.is_investigator()
  and uploaded_by = auth.uid()
  and exists (
    select 1
    from public.case_assignments ca
    join public.investigators i on i.investigator_id = ca.investigator_id
    where ca.case_id = evidence_files.case_id
      and i.user_id = auth.uid()
  )
);

-- CASE HISTORY
alter table public.case_history enable row level security;

create policy case_history_admin_all
on public.case_history
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy case_history_auditor_read
on public.case_history
for select
to authenticated
using (public.is_auditor());

create policy case_history_investigator_read
on public.case_history
for select
to authenticated
using (
  public.is_investigator()
  and exists (
    select 1
    from public.case_assignments ca
    join public.investigators i on i.investigator_id = ca.investigator_id
    where ca.case_id = case_history.case_id
      and i.user_id = auth.uid()
  )
);

-- AUDIT LOG
alter table public.audit_log enable row level security;

create policy audit_log_admin_read
on public.audit_log
for select
to authenticated
using (public.is_admin() or public.is_auditor());

-- ROLES (read-only for all authenticated)
alter table public.roles enable row level security;

create policy roles_read_all
on public.roles
for select
to authenticated
using (true);

-- LOGIN ATTEMPTS
alter table public.login_attempts enable row level security;

create policy login_attempts_admin_all
on public.login_attempts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- FRAUD RULES
alter table public.fraud_rules enable row level security;

create policy fraud_rules_admin_all
on public.fraud_rules
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy fraud_rules_read_all
on public.fraud_rules
for select
to authenticated
using (true);

-- SUSPICIOUS TRANSACTIONS
alter table public.suspicious_transactions enable row level security;

create policy susp_admin_all
on public.suspicious_transactions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy susp_auditor_read
on public.suspicious_transactions
for select
to authenticated
using (public.is_auditor());

create policy susp_investigator_read
on public.suspicious_transactions
for select
to authenticated
using (
  public.is_investigator()
  and exists (
    select 1
    from public.case_transactions ct
    join public.case_assignments ca on ca.case_id = ct.case_id
    join public.investigators i on i.investigator_id = ca.investigator_id
    where ct.txn_id = suspicious_transactions.txn_id
      and i.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------
-- KPI VIEW
-- ---------------------------------------------------------
create or replace view public.kpi_case_success as
select
  count(*) as total_cases,
  count(*) filter (where status = 'CLOSED') as closed_cases,
  round(
    (count(*) filter (where status = 'CLOSED'))::numeric / nullif(count(*), 0),
    4
  ) as closure_rate,
  round(
    avg(extract(epoch from (closed_at - created_at)) / 3600.0)
      filter (where status = 'CLOSED'),
    2
  ) as avg_close_hours,
  count(*) filter (where status = 'OPEN') as open_cases,
  count(*) filter (where status = 'UNDER_INVESTIGATION') as under_investigation_cases
from public.fraud_cases;

grant select on public.kpi_case_success to authenticated;

-- Customer case assignment view
create or replace view public.v_case_assigned_investigator as
with latest as (
  select distinct on (ca.case_id)
    ca.case_id,
    ca.investigator_id,
    ca.assigned_at,
    ca.note
  from public.case_assignments ca
  order by ca.case_id, ca.assigned_at desc
)
select
  l.case_id,
  l.assigned_at,
  l.note,
  i.investigator_id,
  i.badge_no,
  i.department,
  u.user_id as investigator_user_id,
  u.full_name as investigator_name,
  u.email as investigator_email
from latest l
join public.investigators i on i.investigator_id = l.investigator_id
join public.users u on u.user_id = i.user_id;

grant select on public.v_case_assigned_investigator to authenticated;

-- Customer can see own case assignments
create policy ca_customer_read_own_case
on public.case_assignments
for select
to authenticated
using (
  public.is_customer()
  and exists (
    select 1
    from public.fraud_cases fc
    join public.customers c on c.customer_id = fc.customer_id
    where fc.case_id = case_assignments.case_id
      and c.user_id = auth.uid()
  )
);

-- Evidence storage bucket
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Helper function for storage path
create or replace function public.case_id_from_path(p_path text)
returns bigint
language sql
stable
as $$
  select nullif((regexp_match(p_path, '^case_([0-9]+)\/'))[1], '')::bigint;
$$;