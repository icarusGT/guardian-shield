import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { displayRiskLabel } from '@/lib/riskLabels';

interface RiskReasons {
  high_amount: number;
  rapid_reports: number;
  blacklisted_recipient: number;
  location_mismatch: number;
}

interface Props {
  riskReasons: RiskReasons | null;
  riskLevel: string;
}

const RULE_LABELS: Record<keyof RiskReasons, { label: string; maxPoints: number }> = {
  high_amount: { label: 'High Amount', maxPoints: 30 },
  rapid_reports: { label: 'Rapid Reports', maxPoints: 25 },
  blacklisted_recipient: { label: 'Blacklisted Recipient', maxPoints: 50 },
  location_mismatch: { label: 'Location Mismatch', maxPoints: 20 },
};

export default function RiskBreakdownCard({ riskReasons, riskLevel }: Props) {
  const reasons = riskReasons ?? { high_amount: 0, rapid_reports: 0, blacklisted_recipient: 0, location_mismatch: 0 };

  // Total is ALWAYS computed from risk_reasons — single source of truth
  const totalScore = reasons.high_amount + reasons.rapid_reports + reasons.blacklisted_recipient + reasons.location_mismatch;

  const levelLabel = displayRiskLabel(riskLevel);
  const levelColor =
    levelLabel === 'CRITICAL' ? 'text-destructive' :
    levelLabel === 'SUSPICIOUS' ? 'text-amber-600' :
    'text-green-600';

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4" />
          Risk Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center pb-2 border-b">
          <p className={`text-3xl font-bold ${levelColor}`}>{totalScore}</p>
           <p className="text-xs text-muted-foreground uppercase tracking-wider">{levelLabel} risk</p>
        </div>
        <div className="space-y-2">
          {(Object.keys(RULE_LABELS) as (keyof RiskReasons)[]).map((key) => {
            const points = reasons[key];
            const fired = points > 0;
            return (
              <div key={key} className={`flex items-center gap-2 text-sm ${fired ? '' : 'text-muted-foreground'}`}>
                {fired ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}
                <span className="flex-1">{RULE_LABELS[key].label}</span>
                <span className={`font-mono text-xs ${fired ? 'font-semibold' : ''}`}>
                  +{points}
                </span>
              </div>
            );
          })}
        </div>
        <div className="pt-2 border-t flex items-center justify-between text-sm font-semibold">
          <span>Total</span>
          <span className={`font-mono ${levelColor}`}>{totalScore}</span>
        </div>
      </CardContent>
    </Card>
  );
}
