import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertTriangle, DollarSign, Zap, ShieldBan, MapPin } from 'lucide-react';

interface Props {
  riskScore: number;
  riskLevel: string;
  txnAmount: number;
  recipientAccount: string | null;
  txnLocation: string | null;
  reasons?: string | null;
}

const riskColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  suspicious: 'bg-amber-100 text-amber-700',
  normal: 'bg-green-100 text-green-700',
  low: 'bg-green-100 text-green-700',
};

export default function WhyFlagged({ riskScore, riskLevel, txnAmount, recipientAccount, txnLocation, reasons }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Parse which rules fired from the reasons string or infer from data
  const rules: { icon: React.ReactNode; label: string; points: string; fired: boolean }[] = [
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: 'High Amount (≥ ৳10,000)',
      points: '+30',
      fired: txnAmount >= 10000,
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: 'Rapid Frequency (3+ in 5 min)',
      points: '+25',
      fired: reasons?.includes('FREQ_TXN') || false,
    },
    {
      icon: <ShieldBan className="h-4 w-4" />,
      label: 'Blacklisted Recipient',
      points: '+50',
      fired: reasons?.includes('BLACKLIST') || (reasons?.toLowerCase().includes('blacklist') || false),
    },
    {
      icon: <MapPin className="h-4 w-4" />,
      label: 'Location Mismatch',
      points: '+20',
      fired: reasons?.includes('LOC_MISMATCH') || false,
    },
  ];

  const firedRules = rules.filter((r) => r.fired);
  const level = riskLevel.toLowerCase();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge className={riskColors[level] || riskColors.normal}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          {riskLevel.toUpperCase()} Risk
        </Badge>
        <span className="text-sm text-muted-foreground">Score: {riskScore}</span>
        {firedRules.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary hover:underline flex items-center gap-1 ml-auto"
          >
            Why flagged?
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>
      {expanded && firedRules.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          {firedRules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-amber-600">{rule.icon}</span>
              <span>{rule.label}</span>
              <Badge variant="outline" className="ml-auto text-xs">{rule.points}</Badge>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between text-sm font-medium">
            <span>Total Score</span>
            <span>{riskScore}</span>
          </div>
        </div>
      )}
    </div>
  );
}
