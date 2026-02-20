import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldBan, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  recipientAccount: string | null;
  userId: string;
  onChanged: () => void;
}

export default function BlacklistToggleButton({ recipientAccount, userId, onChanged }: Props) {
  const [isBlacklisted, setIsBlacklisted] = useState<boolean | null>(null);
  const [blacklistId, setBlacklistId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!recipientAccount) return;
    supabase
      .from('blacklisted_recipients')
      .select('id')
      .eq('recipient_value', recipientAccount)
      .maybeSingle()
      .then(({ data }) => {
        setIsBlacklisted(!!data);
        setBlacklistId(data?.id ?? null);
      });
  }, [recipientAccount]);

  if (!recipientAccount) return null;

  const handleAdd = async () => {
    setLoading(true);
    const { error } = await supabase.from('blacklisted_recipients').insert({
      recipient_value: recipientAccount,
      reason: reason.trim() || null,
      created_by: userId,
    } as any);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Already blacklisted' : error.message);
    } else {
      toast.success('Recipient blacklisted — risk scores recalculating');
      setIsBlacklisted(true);
      setDialogOpen(false);
      setReason('');
      onChanged();
    }
    setLoading(false);
  };

  const handleRemove = async () => {
    if (!blacklistId) return;
    setLoading(true);
    const { error } = await supabase.from('blacklisted_recipients').delete().eq('id', blacklistId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Removed from blacklist — risk scores recalculating');
      setIsBlacklisted(false);
      setBlacklistId(null);
      onChanged();
    }
    setLoading(false);
  };

  if (isBlacklisted === null) return null;

  if (isBlacklisted) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRemove}
        disabled={loading}
        className="border-green-300 text-green-700 hover:bg-green-50"
      >
        <ShieldCheck className="h-4 w-4 mr-1" />
        {loading ? 'Removing...' : 'Remove from Blacklist'}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="border-red-300 text-red-700 hover:bg-red-50"
      >
        <ShieldBan className="h-4 w-4 mr-1" />
        Add to Blacklist
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blacklist "{recipientAccount}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will add +50 risk score to all transactions involving this recipient.
            </p>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this recipient being blacklisted?"
              />
            </div>
            <Button onClick={handleAdd} disabled={loading} variant="destructive" className="w-full">
              {loading ? 'Adding...' : 'Confirm Blacklist'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
