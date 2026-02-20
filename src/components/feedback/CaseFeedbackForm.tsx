import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [investigationNote, setInvestigationNote] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableSubcategories = useMemo(() => {
    return selectedCategories.flatMap(cat => subcategoryMap[cat] || []);
  }, [selectedCategories]);

  // Recommendation subcategory values for single-select enforcement
  const recommendationSubValues = useMemo(() => 
    (subcategoryMap['RECOMMENDATION'] || []).map(s => s.value), []
  );

  const toggleCategory = (val: string) => {
    setSelectedCategories(prev => {
      const next = prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val];
      // Remove subcategories that no longer belong to selected categories
      const validSubs = next.flatMap(cat => (subcategoryMap[cat] || []).map(s => s.value));
      setSelectedSubcategories(prev => prev.filter(s => validSubs.includes(s)));
      return next;
    });
  };

  const toggleSubcategory = (val: string) => {
    const isRecommendationSub = recommendationSubValues.includes(val);
    setSelectedSubcategories(prev => {
      if (prev.includes(val)) return prev.filter(s => s !== val);
      if (isRecommendationSub) {
        // Remove any other recommendation subcategory (only 1 allowed)
        return [...prev.filter(s => !recommendationSubValues.includes(s)), val];
      }
      return [...prev, val];
    });
  };

  // Check each category has at least one subcategory selected
  const hasSubFromEachCategory = useMemo(() => {
    return categories.every(cat => {
      const catSubs = (subcategoryMap[cat.value] || []).map(s => s.value);
      return catSubs.some(s => selectedSubcategories.includes(s));
    });
  }, [selectedSubcategories]);

  const handleSubmit = async () => {
    if (selectedCategories.length < 3) {
      toast.error('All 3 categories must be selected');
      return;
    }
    if (!hasSubFromEachCategory) {
      toast.error('Please select at least one subcategory from each category');
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
        category: selectedCategories[0] as any,
        selected_categories: selectedCategories.join(','),
        subcategory: selectedSubcategories.join(','),
        investigation_note: investigationNote.trim(),
        comment: comment.trim() || null,
        approval_status: 'PENDING' as any,
      });

      if (error) throw error;

      toast.success('Investigation feedback submitted');
      setIsOpen(false);
      setSelectedCategories([]);
      setSelectedSubcategories([]);
      setInvestigationNote('');
      setComment('');
      onFeedbackSubmitted?.();
    } catch (error: any) {
      toast.error(`Failed to submit feedback: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = selectedCategories.length === 3 && hasSubFromEachCategory && investigationNote.trim();

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0">
        <MessageSquare className="h-4 w-4 mr-2" />
        Add Feedback
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Investigation Feedback</DialogTitle>
            <DialogDescription>
              Submit structured feedback for Case #{caseId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Categories - multi-select checkboxes */}
            <div className="space-y-2">
              <Label>Categories <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground">(all 3 required)</span></Label>
              <div className="space-y-2 rounded-md border p-3">
                {categories.map((cat) => (
                  <label key={cat.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <Checkbox
                      checked={selectedCategories.includes(cat.value)}
                      onCheckedChange={() => toggleCategory(cat.value)}
                    />
                    <cat.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-sm">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subcategories - multi-select checkboxes, conditional */}
            {selectedCategories.length > 0 && availableSubcategories.length > 0 && (
              <div className="space-y-2">
                <Label>Subcategories <span className="text-destructive">*</span></Label>
                <div className="space-y-1.5 rounded-md border p-3 max-h-48 overflow-y-auto">
                  {selectedCategories.map(catVal => {
                    const catInfo = categories.find(c => c.value === catVal);
                    const subs = subcategoryMap[catVal] || [];
                    if (subs.length === 0) return null;
                    return (
                      <div key={catVal} className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-1">
                          {catInfo?.label}
                          {catVal === 'RECOMMENDATION' 
                            ? <span className="ml-1 text-[10px] normal-case text-orange-500">(select only one)</span>
                            : <span className="ml-1 text-[10px] normal-case text-muted-foreground">(select at least one)</span>
                          }
                          {(() => {
                            const catSubs = (subcategoryMap[catVal] || []).map(s => s.value);
                            const hasSel = catSubs.some(s => selectedSubcategories.includes(s));
                            return hasSel ? <span className="ml-1 text-green-500">✓</span> : null;
                          })()}
                        </p>
                        {subs.map(sub => (
                          <label key={sub.value} className="flex items-center gap-2.5 cursor-pointer pl-2">
                            <Checkbox
                              checked={selectedSubcategories.includes(sub.value)}
                              onCheckedChange={() => toggleSubcategory(sub.value)}
                            />
                            <span className="text-sm">{sub.label}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Investigation Note */}
            <div className="space-y-2">
              <Label>Investigation Note <span className="text-destructive">*</span></Label>
              <Textarea
                value={investigationNote}
                onChange={(e) => setInvestigationNote(e.target.value)}
                placeholder="Provide detailed investigation findings..."
                rows={4}
              />
            </div>

            {/* Comment */}
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
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!isValid || submitting}>
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

// Subcategory to category color mapping for badge styling
const subcategoryCategoryMap: Record<string, string> = {};
Object.entries(subcategoryMap).forEach(([cat, subs]) => {
  subs.forEach(sub => { subcategoryCategoryMap[sub.value] = cat; });
});

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
    selected_categories?: string | null;
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
        // Parse multiple categories
        const allCategories = fb.selected_categories
          ? fb.selected_categories.split(',').filter(Boolean)
          : [fb.category];
        
        // Parse multiple subcategories
        const allSubcategories = fb.subcategory
          ? fb.subcategory.split(',').filter(Boolean)
          : [];

        const primaryCat = categoryConfig[allCategories[0]];
        const invName = investigatorNames?.[fb.investigator_id];

        // Determine border color from first category
        const borderColor = primaryCat?.color.includes('blue') ? '#3b82f6' :
          primaryCat?.color.includes('amber') ? '#f59e0b' :
          primaryCat?.color.includes('purple') ? '#8b5cf6' :
          primaryCat?.color.includes('red') ? '#ef4444' :
          primaryCat?.color.includes('green') ? '#22c55e' : '#6366f1';

        return (
          <Card key={fb.feedback_id} className="border-l-4" style={{ borderLeftColor: borderColor }}>
            <CardContent className="p-4 space-y-2">
              {/* Category badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {allCategories.map(catKey => {
                  const cat = categoryConfig[catKey];
                  const CatIcon = cat?.icon || Shield;
                  return (
                    <Badge key={catKey} className={cat?.color || 'bg-muted text-muted-foreground'}>
                      <CatIcon className="h-3 w-3 mr-1" />
                      {cat?.label || catKey}
                    </Badge>
                  );
                })}
              </div>

              {/* Subcategory badges */}
              {allSubcategories.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {allSubcategories.map(subKey => {
                    const parentCat = subcategoryCategoryMap[subKey];
                    const parentConfig = parentCat ? categoryConfig[parentCat] : null;
                    // Use a lighter variant of parent category color
                    const subColor = parentConfig?.color.includes('blue') ? 'border-blue-300 text-blue-600' :
                      parentConfig?.color.includes('amber') ? 'border-amber-300 text-amber-600' :
                      parentConfig?.color.includes('purple') ? 'border-purple-300 text-purple-600' : '';
                    return (
                      <Badge key={subKey} variant="outline" className={`text-xs ${subColor}`}>
                        {subcategoryLabels[subKey] || subKey}
                      </Badge>
                    );
                  })}
                </div>
              )}

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

              {/* Legacy comment */}
              {fb.comment && !fb.investigation_note && (
                <p className="text-sm text-muted-foreground">{fb.comment}</p>
              )}
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
