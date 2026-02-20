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
import { Shield, Users, FileSearch, MessageSquare, User, Clock } from 'lucide-react';

interface CaseFeedbackFormProps {
  caseId: number;
  investigatorId: number;
  onFeedbackSubmitted?: () => void;
}

const categories = [
  { value: 'EVIDENCE_REVIEW', label: 'Evidence Review', icon: FileSearch, color: 'bg-blue-100 text-blue-700' },
  { value: 'CUSTOMER_CLARIFICATION', label: 'Customer Clarification', icon: Users, color: 'bg-amber-100 text-amber-700' },
  { value: 'RECOMMENDATION', label: 'Recommendation', icon: Shield, color: 'bg-purple-100 text-purple-700' },
];

const subcategoryMap: Record<string, { value: string; label: string }[]> = {
  EVIDENCE_REVIEW: [
    { value: 'SCREENSHOT_VERIFIED', label: 'Screenshot Verified' },
    { value: 'TRANSACTION_LOG_CHECKED', label: 'Transaction Log Checked' },
    { value: 'DOCUMENT_VERIFIED', label: 'Document Verified' },
    { value: 'EVIDENCE_INSUFFICIENT', label: 'Evidence Insufficient' },
  ],
  CUSTOMER_CLARIFICATION: [
    { value: 'ADDITIONAL_DOCUMENTS_REQUESTED', label: 'Additional Documents Requested' },
    { value: 'MISSING_INFORMATION', label: 'Missing Information' },
    { value: 'CONTACT_ATTEMPTED', label: 'Contact Attempted' },
    { value: 'IDENTITY_VERIFICATION', label: 'Identity Verification' },
  ],
  RECOMMENDATION: [
    { value: 'CONFIRMED_FRAUD', label: 'Confirmed Fraud' },
    { value: 'LIKELY_FRAUD', label: 'Likely Fraud' },
    { value: 'INSUFFICIENT_EVIDENCE', label: 'Insufficient Evidence' },
    { value: 'REJECT_CASE', label: 'Reject Case' },
    { value: 'ESCALATE_TO_ADMIN', label: 'Escalate to Admin' },
  ],
};

export default function CaseFeedbackForm({ caseId, investigatorId, onFeedbackSubmitted }: CaseFeedbackFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [investigationNote, setInvestigationNote] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setSubcategory('');
  };

  const handleSubmit = async () => {
    if (!category) {
      toast.error('Please select a feedback category');
      return;
    }
    if (!subcategory) {
      toast.error('Please select a subcategory');
      return;
    }
    if (!investigationNote.trim()) {
      toast.error('Investigation Note is required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('case_feedback').insert({
        case_id: caseId,
        investigator_id: investigatorId,
        category: category as any,
        subcategory: subcategory,
        investigation_note: investigationNote.trim(),
        comment: comment.trim() || null,
        approval_status: 'PENDING' as any,
      });

      if (error) throw error;

      toast.success('Investigation feedback submitted');
      setIsOpen(false);
      setCategory('');
      setSubcategory('');
      setInvestigationNote('');
      setComment('');
      onFeedbackSubmitted?.();
    } catch (error: any) {
      toast.error(`Failed to submit feedback: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const availableSubcategories = category ? subcategoryMap[category] || [] : [];

  

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
        <MessageSquare className="h-4 w-4 mr-2" />
        Add Feedback
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Investigation Feedback</DialogTitle>
            <DialogDescription>
              Submit structured feedback for Case #{caseId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Investigation Feedback <span className="text-destructive">*</span></Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory - conditional */}
            {category && availableSubcategories.length > 0 && (
              <div className="space-y-2">
                <Label>Subcategory <span className="text-destructive">*</span></Label>
                <Select value={subcategory} onValueChange={setSubcategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubcategories.map((sub) => (
                      <SelectItem key={sub.value} value={sub.value}>
                        {sub.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Investigation Note - required */}
            <div className="space-y-2">
              <Label>Investigation Note <span className="text-destructive">*</span></Label>
              <Textarea
                value={investigationNote}
                onChange={(e) => setInvestigationNote(e.target.value)}
                placeholder="Provide detailed investigation findings..."
                rows={4}
              />
            </div>

            {/* Comment - optional */}
            <div className="space-y-2">
              <Label>Additional Comments <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any additional remarks..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!category || !subcategory || !investigationNote.trim() || submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Feedback List ───────────────────────────────────────────────

const categoryConfig: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  EVIDENCE_REVIEW: { label: 'Evidence Review', color: 'bg-blue-100 text-blue-700', icon: FileSearch },
  CUSTOMER_CLARIFICATION: { label: 'Customer Clarification', color: 'bg-amber-100 text-amber-700', icon: Users },
  RECOMMENDATION: { label: 'Recommendation', color: 'bg-purple-100 text-purple-700', icon: Shield },
  // Legacy values
  CONFIRMED_FRAUD: { label: 'Confirmed Fraud', color: 'bg-red-100 text-red-700', icon: Shield },
  FALSE_POSITIVE: { label: 'False Positive', color: 'bg-green-100 text-green-700', icon: Shield },
  REQUIRES_MORE_INFO: { label: 'More Info Required', color: 'bg-amber-100 text-amber-700', icon: Users },
  ESCALATE_TO_ADMIN: { label: 'Escalation', color: 'bg-purple-100 text-purple-700', icon: Shield },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-blue-100 text-blue-700', icon: Clock },
};

const subcategoryLabels: Record<string, string> = {
  SCREENSHOT_VERIFIED: 'Screenshot Verified',
  TRANSACTION_LOG_CHECKED: 'Transaction Log Checked',
  DOCUMENT_VERIFIED: 'Document Verified',
  EVIDENCE_INSUFFICIENT: 'Evidence Insufficient',
  ADDITIONAL_DOCUMENTS_REQUESTED: 'Additional Documents Requested',
  MISSING_INFORMATION: 'Missing Information',
  CONTACT_ATTEMPTED: 'Contact Attempted',
  IDENTITY_VERIFICATION: 'Identity Verification',
  CONFIRMED_FRAUD: 'Confirmed Fraud',
  LIKELY_FRAUD: 'Likely Fraud',
  INSUFFICIENT_EVIDENCE: 'Insufficient Evidence',
  REJECT_CASE: 'Reject Case',
  ESCALATE_TO_ADMIN: 'Escalate to Admin',
};

interface CaseFeedbackListProps {
  caseId: number;
  feedback: Array<{
    feedback_id: number;
    category: string;
    approval_status: string;
    comment: string | null;
    created_at: string;
    investigator_id: number;
    subcategory?: string | null;
    investigation_note?: string | null;
  }>;
  investigatorNames?: Record<number, string>;
}

export function CaseFeedbackList({ caseId, feedback, investigatorNames }: CaseFeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No investigation feedback submitted yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((fb) => {
        const cat = categoryConfig[fb.category];
        const CatIcon = cat?.icon || Shield;
        const subLabel = fb.subcategory ? subcategoryLabels[fb.subcategory] || fb.subcategory : null;
        const invName = investigatorNames?.[fb.investigator_id];

        return (
          <Card key={fb.feedback_id} className="border-l-4" style={{
            borderLeftColor: cat?.color.includes('blue') ? '#3b82f6' :
              cat?.color.includes('amber') ? '#f59e0b' :
              cat?.color.includes('purple') ? '#8b5cf6' :
              cat?.color.includes('red') ? '#ef4444' :
              cat?.color.includes('green') ? '#22c55e' : '#6366f1'
          }}>
            <CardContent className="p-4 space-y-2">
              {/* Top row: category + subcategory badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <CatIcon className="h-4 w-4 text-muted-foreground" />
                <Badge className={cat?.color || 'bg-muted text-muted-foreground'}>
                  {cat?.label || fb.category}
                </Badge>
                {subLabel && (
                  <Badge variant="outline" className="text-xs">
                    {subLabel}
                  </Badge>
                )}
              </div>

              {/* Investigator + role */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{invName || `Investigator #${fb.investigator_id}`}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Investigator
                </Badge>
              </div>

              {/* Investigation Note */}
              {fb.investigation_note && (
                <div className="bg-muted/50 rounded-md p-2.5">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Investigation Note</p>
                  <p className="text-sm">{fb.investigation_note}</p>
                </div>
              )}

              {/* Legacy comment display */}
              {fb.comment && !fb.investigation_note && (
                <p className="text-sm text-muted-foreground">{fb.comment}</p>
              )}

              {/* Additional comment if both exist */}
              {fb.comment && fb.investigation_note && (
                <p className="text-xs text-muted-foreground italic">{fb.comment}</p>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(fb.created_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
