import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { BlacklistRecommendation } from '@/hooks/useBlacklistRecommendations';

interface Props {
  recommendation: BlacklistRecommendation;
}

export default function BlacklistRecommendationBanner({ recommendation }: Props) {
  if (recommendation.isAlreadyBlacklisted) return null;

  return (
    <Alert className="border-amber-400 bg-amber-50 dark:bg-amber-950/20">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-300">
        Blacklist Recommendation
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-400">
        Recipient <span className="font-mono font-semibold">{recommendation.recipientAccount}</span> meets
        blacklist criteria: {recommendation.reasons.join('; ')}.
        <span className="block mt-1 text-xs text-amber-600 dark:text-amber-500">
          {recommendation.complaintCount} complaint{recommendation.complaintCount !== 1 ? 's' : ''} •
          ৳{recommendation.totalReportedAmount.toLocaleString()} BDT total reported
          {recommendation.confirmedFraudCases > 0 && ` • ${recommendation.confirmedFraudCases} confirmed fraud`}
        </span>
      </AlertDescription>
    </Alert>
  );
}
