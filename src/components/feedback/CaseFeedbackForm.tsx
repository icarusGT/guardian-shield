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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, MessageSquare, Clock, Shield } from 'lucide-react';

interface CaseFeedbackFormProps {
  caseId: number;
  investigatorId: number;
  onFeedbackSubmitted?: () => void;
}

const feedbackCategories = [
  { value: 'CONFIRMED_FRAUD', label: 'Evidence Review Note', icon: Shield, color: 'bg-slate-100 text-slate-700' },
  { value: 'FALSE_POSITIVE', label: 'Verification Update', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  { value: 'REQUIRES_MORE_INFO', label: 'Need More Information', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
  { value: 'ESCALATE_TO_ADMIN', label: 'Escalation Request', icon: MessageSquare, color: 'bg-purple-100 text-purple-700' },
  { value: 'UNDER_REVIEW', label: 'Progress Update', icon: Clock, color: 'bg-blue-100 text-blue-700' },
];

const approvalStatuses = [
  { value: 'PENDING', label: 'Pending', color: 'bg-slate-100 text-slate-700' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 text-green-700' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-700' },
  { value: 'ESCALATED', label: 'Escalated', color: 'bg-purple-100 text-purple-700' },
];

export default function CaseFeedbackForm({ caseId, investigatorId, onFeedbackSubmitted }: CaseFeedbackFormProps) {
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
      const { error } = await supabase.from('case_feedback').insert({
        case_id: caseId,
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
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
        <MessageSquare className="h-4 w-4 mr-2" />
        Add Feedback
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Provide Case Feedback</DialogTitle>
            <DialogDescription>
              Submit your assessment for Case #{caseId}
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

// Component to display existing feedback
interface CaseFeedbackListProps {
  caseId: number;
  feedback: Array<{
    feedback_id: number;
    category: string;
    approval_status: string;
    comment: string | null;
    created_at: string;
    investigator_id: number;
  }>;
}

export function CaseFeedbackList({ caseId, feedback }: CaseFeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No feedback submitted yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((fb) => {
        const cat = feedbackCategories.find(c => c.value === fb.category);
        const status = approvalStatuses.find(s => s.value === fb.approval_status);
        
        return (
          <Card key={fb.feedback_id} className="border-l-4" style={{ borderLeftColor: cat?.color.includes('red') ? '#ef4444' : cat?.color.includes('green') ? '#22c55e' : cat?.color.includes('amber') ? '#f59e0b' : '#6366f1' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {cat && <cat.icon className="h-4 w-4" />}
                  <Badge className={cat?.color || ''}>{cat?.label || fb.category}</Badge>
                </div>
                <Badge className={status?.color || ''}>{status?.label || fb.approval_status}</Badge>
              </div>
              {fb.comment && (
                <p className="text-sm text-muted-foreground mt-2">{fb.comment}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(fb.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
