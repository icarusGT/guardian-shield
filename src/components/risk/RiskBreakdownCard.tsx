import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

interface Rule {
  label: string;
  maxPoints: number;
  fired: boolean;
}

interface Props {
  riskScore: number;
  riskLevel: string;
  txnAmount: number;
  reasons?: string | null;
}

export default function RiskBreakdownCard({ riskScore, riskLevel, txnAmount, reasons }: Props) {
  const rules: Rule[] = [
    { label: 'High Amount', maxPoints: 30, fired: txnAmount >= 10000 },
    { label: 'Rapid Reports', maxPoints: 25, fired: reasons?.includes('FREQ_TXN') || false },
    { label: 'Blacklisted Recipient', maxPoints: 50, fired: reasons?.toLowerCase().includes('blacklist') || false },
    { label: 'Location Mismatch', maxPoints: 20, fired: reasons?.includes('LOC_MISMATCH') || false },
  ];

  const levelColor =
    riskLevel === 'high' ? 'text-destructive' :
    riskLevel === 'suspicious' ? 'text-amber-600' :
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
          <p className={`text-3xl font-bold ${levelColor}`}>{riskScore}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{riskLevel} risk</p>
        </div>
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.label} className={`flex items-center gap-2 text-sm ${rule.fired ? '' : 'text-muted-foreground'}`}>
              {rule.fired ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className="flex-1">{rule.label}</span>
              <span className={`font-mono text-xs ${rule.fired ? 'font-semibold' : ''}`}>
                +{rule.fired ? rule.maxPoints : 0}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
