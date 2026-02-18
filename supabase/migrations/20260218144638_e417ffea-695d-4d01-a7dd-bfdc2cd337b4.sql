
-- Create case_messages table for in-case messaging
CREATE TABLE public.case_messages (
  message_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  case_id bigint NOT NULL REFERENCES public.fraud_cases(case_id),
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('CUSTOMER', 'INVESTIGATOR')),
  message_body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  seen_at timestamptz DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is the case owner (customer)
CREATE OR REPLACE FUNCTION public.user_is_case_owner(p_case_id bigint)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM fraud_cases fc
    JOIN customers c ON c.customer_id = fc.customer_id
    WHERE fc.case_id = p_case_id AND c.user_id = auth.uid()
  );
$$;

-- Helper: check if user can access case messages (owner or assigned investigator)
CREATE OR REPLACE FUNCTION public.user_can_access_case_messages(p_case_id bigint)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.user_is_case_owner(p_case_id) OR public.user_is_assigned_investigator(p_case_id);
$$;

-- RLS: Only case owner and assigned investigator can read messages
CREATE POLICY "cm_read" ON public.case_messages FOR SELECT
USING (public.user_can_access_case_messages(case_id));

-- RLS: Only case owner and assigned investigator can insert, must be own sender_id
CREATE POLICY "cm_insert" ON public.case_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.user_can_access_case_messages(case_id)
);

-- RLS: Admin can read all for audit
CREATE POLICY "cm_admin_read" ON public.case_messages FOR SELECT
USING (public.is_admin());

-- RLS: Auditor can read all for compliance
CREATE POLICY "cm_auditor_read" ON public.case_messages FOR SELECT
USING (public.is_auditor());

-- RLS: Only receiver can update seen_at (no editing message_body)
CREATE POLICY "cm_update_seen" ON public.case_messages FOR UPDATE
USING (
  sender_id <> auth.uid()
  AND public.user_can_access_case_messages(case_id)
)
WITH CHECK (
  sender_id <> auth.uid()
  AND public.user_can_access_case_messages(case_id)
);

-- No delete allowed (preserve case integrity)
-- No DELETE policy = no one can delete

-- Index for fast lookups
CREATE INDEX idx_case_messages_case_id ON public.case_messages(case_id, created_at);
CREATE INDEX idx_case_messages_sender ON public.case_messages(sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_messages;
