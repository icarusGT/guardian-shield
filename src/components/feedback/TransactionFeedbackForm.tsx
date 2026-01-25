import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, MessageSquare, Clock, Shield } from 'lucide-react';

interface TransactionFeedbackFormProps {
  txnId: number;
  investigatorId: number;
  onFeedbackSubmitted?: () => void;
}

const feedbackCategories = [
  { value: 'CONFIRMED_FRAUD', label: 'Confirmed Fraud', icon: Shield, color: 'bg-red-100 text-red-700' },
  { value: 'FALSE_POSITIVE', label: 'False Positive', icon: XCircle, color: 'bg-green-100 text-green-700' },
  { value: 'REQUIRES_MORE_INFO', label: 'Requires More Info', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
  { value: 'ESCALATE_TO_ADMIN', label: 'Escalate to Admin', icon: MessageSquare, color: 'bg-purple-100 text-purple-700' },
  { value: 'UNDER_REVIEW', label: 'Under Review', icon: Clock, color: 'bg-blue-100 text-blue-700' },
];

const approvalStatuses = [
  { value: 'PENDING', label: 'Pending', color: 'bg-slate-100 text-slate-700' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 text-green-700' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-700' },
  { value: 'ESCALATED', label: 'Escalated', color: 'bg-purple-100 text-purple-700' },
];

export default function TransactionFeedbackForm({ txnId, investigatorId, onFeedbackSubmitted }: TransactionFeedbackFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('PENDING');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!category) {
      toast.error('Please select a feedback category');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('transaction_feedback').insert({
        txn_id: txnId,
        investigator_id: investigatorId,
        category: category as any,
        approval_status: approvalStatus as any,
        comment: comment || null,
      });

      if (error) throw error;

      toast.success('Feedback submitted successfully');
      setIsOpen(false);
      setCategory('');
      setApprovalStatus('PENDING');
      setComment('');
      onFeedbackSubmitted?.();
    } catch (error: any) {
      toast.error(`Failed to submit feedback: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = feedbackCategories.find(c => c.value === category);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="ghost" size="sm" title="Add Feedback">
        <MessageSquare className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Provide Transaction Feedback</DialogTitle>
            <DialogDescription>
              Submit your assessment for Transaction #{txnId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Feedback Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {feedbackCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <Badge className={selectedCategory.color}>
                  {selectedCategory.label}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label>Approval Status</Label>
              <Select value={approvalStatus} onValueChange={setApprovalStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {approvalStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <Badge className={status.color}>{status.label}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Comments (optional)</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any additional notes or observations..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!category || submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Component to display existing transaction feedback
interface TransactionFeedbackListProps {
  txnId: number;
  feedback: Array<{
    feedback_id: number;
    category: string;
    approval_status: string;
    comment: string | null;
    created_at: string;
    investigator_id: number;
  }>;
}

export function TransactionFeedbackList({ txnId, feedback }: TransactionFeedbackListProps) {
  if (feedback.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      {feedback.map((fb) => {
        const cat = feedbackCategories.find(c => c.value === fb.category);
        const status = approvalStatuses.find(s => s.value === fb.approval_status);
        
        return (
          <div key={fb.feedback_id} className="flex items-center gap-2 text-xs">
            {cat && <cat.icon className="h-3 w-3" />}
            <Badge className={`${cat?.color || ''} text-xs py-0`}>{cat?.label || fb.category}</Badge>
            <Badge className={`${status?.color || ''} text-xs py-0`}>{status?.label || fb.approval_status}</Badge>
          </div>
        );
      })}
    </div>
  );
}
