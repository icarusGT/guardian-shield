import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { XCircle, AlertTriangle, Lock } from 'lucide-react';

interface AdminCloseCaseButtonProps {
  caseId: number;
  currentStatus: string;
  hasCommunicatedDecision: boolean;
  hasApprovedDecision: boolean;
  onStatusChanged?: () => void;
}

export default function AdminCloseCaseButton({
  caseId,
  currentStatus,
  hasCommunicatedDecision,
  hasApprovedDecision,
  onStatusChanged,
}: AdminCloseCaseButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isClosed = currentStatus === 'CLOSED';
  const canClose = hasCommunicatedDecision && hasApprovedDecision;

  const handleClose = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('update_case_status', {
        p_case_id: caseId,
        p_new_status: 'CLOSED' as any,
        p_comment: comment.trim() || 'Case closed by admin',
      });

      if (error) throw error;

      const result = data?.[0];
      if (result && !result.success) {
        toast.error(result.message);
        return;
      }

      toast.success('Case closed successfully');
      setIsOpen(false);
      setComment('');
      onStatusChanged?.();
    } catch (error: any) {
      toast.error(`Failed to close case: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (isClosed) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-4 w-4" />
        This case is closed.
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="destructive"
        size="sm"
        className="w-full gap-2"
        disabled={!canClose}
      >
        <XCircle className="h-4 w-4" />
        Close Case
      </Button>

      {!canClose && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {!hasCommunicatedDecision && !hasApprovedDecision
              ? 'You must communicate and approve the decision before closing the case.'
              : !hasCommunicatedDecision
              ? 'The decision must be communicated before the case can be closed.'
              : 'The decision must be approved before the case can be closed.'}
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Case #{caseId}</DialogTitle>
            <DialogDescription>
              This action will close the case permanently. Closed cases cannot be reopened.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>Comment (optional)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a closing comment..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClose} disabled={submitting}>
              {submitting ? 'Closing...' : 'Confirm Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
