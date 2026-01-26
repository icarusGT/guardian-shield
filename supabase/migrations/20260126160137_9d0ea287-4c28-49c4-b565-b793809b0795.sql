-- Create a view for channel-wise suspicious ranking analytics
-- This view joins all transactions with their suspicious_transactions data
-- and aggregates per channel with suspicious counts and rates

CREATE OR REPLACE VIEW public.v_channel_suspicious_ranking AS
SELECT
  t.txn_channel AS channel,
  COUNT(*)::integer AS total_txn,
  COUNT(*) FILTER (WHERE st.risk_level IN ('MEDIUM', 'HIGH'))::integer AS suspicious_txn,
  ROUND(COALESCE(AVG(st.risk_score), 0)::numeric, 2)::numeric AS avg_risk_score,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE st.risk_level IN ('MEDIUM', 'HIGH')) / NULLIF(COUNT(*), 0),
    2
  )::numeric AS suspicious_rate_pct
FROM public.transactions t
LEFT JOIN public.suspicious_transactions st
  ON st.txn_id = t.txn_id
GROUP BY t.txn_channel
ORDER BY suspicious_txn DESC, avg_risk_score DESC;