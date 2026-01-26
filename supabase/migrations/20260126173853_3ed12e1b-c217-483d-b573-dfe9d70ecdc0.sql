-- Enable realtime for fraud_cases table
ALTER PUBLICATION supabase_realtime ADD TABLE public.fraud_cases;

-- Enable realtime for case_assignments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_assignments;