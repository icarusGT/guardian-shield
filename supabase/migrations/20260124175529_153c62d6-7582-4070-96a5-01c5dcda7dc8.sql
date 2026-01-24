-- ==============================================================
-- FIX: Audit trigger functions need SECURITY DEFINER to bypass RLS
-- The audit_log table only has a SELECT policy for admins/auditors,
-- so audit triggers (which INSERT) fail for regular users.
-- Making them SECURITY DEFINER allows them to bypass RLS safely.
-- ==============================================================

-- 1) Fix audit_cases_ins_fn
CREATE OR REPLACE FUNCTION public.audit_cases_ins_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.audit_log(table_name, action_type, record_pk, old_values, new_values, acted_by_user, acted_ip)
  values (
    'fraud_cases','INSERT', new.case_id::text,
    null,
    'status='||new.status||', severity='||new.severity||', category='||new.category,
    public.app_user_id(), public.app_ip()
  );
  return new;
end $function$;

-- 2) Fix audit_cases_upd_fn
CREATE OR REPLACE FUNCTION public.audit_cases_upd_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.audit_log(table_name, action_type, record_pk, old_values, new_values, acted_by_user, acted_ip)
  values (
    'fraud_cases','UPDATE', new.case_id::text,
    'status='||old.status||', severity='||old.severity||', category='||old.category,
    'status='||new.status||', severity='||new.severity||', category='||new.category,
    public.app_user_id(), public.app_ip()
  );
  return new;
end $function$;

-- 3) Fix audit_evidence_ins_fn
CREATE OR REPLACE FUNCTION public.audit_evidence_ins_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.audit_log(table_name, action_type, record_pk, old_values, new_values, acted_by_user, acted_ip)
  values (
    'evidence_files','INSERT', new.evidence_id::text,
    null,
    'case_id='||new.case_id||', type='||new.file_type||', path='||new.file_path,
    public.app_user_id(), public.app_ip()
  );
  return new;
end $function$;

-- 4) Fix audit_susp_ins_fn
CREATE OR REPLACE FUNCTION public.audit_susp_ins_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.audit_log(table_name, action_type, record_pk, old_values, new_values, acted_by_user, acted_ip)
  values (
    'suspicious_transactions','INSERT', new.suspicious_id::text,
    null,
    'txn_id='||new.txn_id||', score='||new.risk_score||', level='||new.risk_level,
    public.app_user_id(), public.app_ip()
  );
  return new;
end $function$;

-- 5) Fix audit_txn_ins_fn
CREATE OR REPLACE FUNCTION public.audit_txn_ins_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.audit_log(table_name, action_type, record_pk, old_values, new_values, acted_by_user, acted_ip)
  values (
    'transactions','INSERT', new.txn_id::text,
    null,
    'amount='||new.txn_amount||', loc='||coalesce(new.txn_location,'NULL')||', channel='||new.txn_channel,
    public.app_user_id(), public.app_ip()
  );
  return new;
end $function$;