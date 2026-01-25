-- Add recipient_account field to transactions table
ALTER TABLE public.transactions
ADD COLUMN recipient_account VARCHAR(100) NULL;

-- Add index for recipient_account for faster hotspot queries
CREATE INDEX idx_transactions_recipient_account ON public.transactions(recipient_account);

-- Enable realtime for suspicious_transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.suspicious_transactions;