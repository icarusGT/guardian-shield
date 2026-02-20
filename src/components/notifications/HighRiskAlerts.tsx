import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface HighRiskAlert {
  suspicious_id: number;
  txn_id: number;
  risk_score: number;
  risk_level: string;
  reasons: string | null;
  flagged_at: string;
}

export default function HighRiskAlerts() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<HighRiskAlert[]>([]);

  // Only admins see real-time alerts
  const isAdmin = profile?.role_id === 1;

  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to new HIGH risk suspicious transactions
    const channel = supabase
      .channel('high-risk-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'suspicious_transactions',
          filter: 'risk_level=eq.HIGH',
        },
        (payload) => {
          const newAlert = payload.new as HighRiskAlert;
          setAlerts((prev) => [newAlert, ...prev].slice(0, 5)); // Keep last 5

          toast({
            title: '🚨 CRITICAL Risk Transaction Detected!',
            description: `Transaction #${newAlert.txn_id} flagged with score ${newAlert.risk_score}`,
            variant: 'destructive',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, toast]);

  const dismissAlert = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.suspicious_id !== id));
  };

  if (!isAdmin || alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {alerts.map((alert) => (
        <div
          key={alert.suspicious_id}
          className="bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg border border-destructive/50 animate-in slide-in-from-right-5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">CRITICAL Risk Alert</p>
              <p className="text-xs opacity-90">
                TXN #{alert.txn_id} • Score: {alert.risk_score}
              </p>
              {alert.reasons && (
                <p className="text-xs opacity-75 mt-1 truncate">{alert.reasons}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-destructive-foreground/10"
              onClick={() => dismissAlert(alert.suspicious_id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
