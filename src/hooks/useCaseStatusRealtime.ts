import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to real-time UPDATE events on the fraud_cases table.
 * Calls `onStatusChange` whenever any case row is updated (e.g. status change).
 * Optionally filters to a specific case_id.
 */
export function useCaseStatusRealtime(
  onStatusChange: () => void,
  caseId?: number
) {
  const callbackRef = useRef(onStatusChange);
  callbackRef.current = onStatusChange;

  useEffect(() => {
    const channelName = caseId
      ? `case-status-rt-${caseId}`
      : `case-status-rt-all`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fraud_cases',
          ...(caseId ? { filter: `case_id=eq.${caseId}` } : {}),
        },
        () => {
          callbackRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);
}
