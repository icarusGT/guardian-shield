import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldBan, AlertTriangle, Users, DollarSign, Gavel } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { BlacklistRecommendation } from '@/hooks/useBlacklistRecommendations';

interface Props {
  recommendation: BlacklistRecommendation;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlacklisted: () => void;
}

export default function ReviewBlacklistModal({ recommendation, userId, open, onOpenChange, onBlacklisted }: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    const autoReason = `Recommendation Engine: ${recommendation.reasons.join('; ')}`;
    const finalReason = reason.trim() ? `${autoReason}. Admin note: ${reason.trim()}` : autoReason;

    const { error } = await supabase.from('blacklisted_recipients').insert({
      recipient_value: recommendation.recipientAccount,
      reason: finalReason,
      created_by: userId,
    } as any);

    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Already blacklisted' : error.message);
    } else {
      toast.success('Recipient blacklisted — risk scores recalculating');
      onOpenChange(false);
      onBlacklisted();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldBan className="h-5 w-5 text-destructive" />
            Review & Blacklist
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
            <p className="font-mono font-semibold text-sm">{recommendation.recipientAccount}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {recommendation.reasons.map((r, i) => (
                <Badge key={i} variant="outline" className="text-xs border-amber-400 text-amber-700">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {r.split('(')[0].trim()}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-muted/30 rounded-lg">
              <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{recommendation.complaintCount}</p>
              <p className="text-[10px] text-muted-foreground">Complaints</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">৳{(recommendation.totalReportedAmount / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-muted-foreground">Total BDT</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <Gavel className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{recommendation.confirmedFraudCases}</p>
              <p className="text-[10px] text-muted-foreground">Confirmed Fraud</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Additional Notes (optional)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add admin notes for this blacklisting..."
              rows={2}
            />
          </div>

          <Button onClick={handleConfirm} disabled={submitting} variant="destructive" className="w-full">
            {submitting ? 'Blacklisting...' : 'Confirm Blacklist'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
