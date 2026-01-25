-- Add INSERT policy for customers to create their own transactions
CREATE POLICY "tx_customer_own_insert"
ON public.transactions
FOR INSERT
WITH CHECK (
  is_customer() AND 
  user_owns_customer(customer_id)
);