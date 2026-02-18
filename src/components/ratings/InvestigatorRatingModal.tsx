import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle2, User, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvestigatorRatingModalProps {
  caseId: number;
  investigatorId: number;
  customerId: number;
  investigatorName: string;
  badgeNo: string | null;
  open: boolean;
  onClose: () => void;
}

interface RatingCategory {
  key: string;
  label: string;
  value: number;
  hovered: number;
}

export default function InvestigatorRatingModal({
  caseId,
  investigatorId,
  customerId,
  investigatorName,
  badgeNo,
  open,
  onClose,
}: InvestigatorRatingModalProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<RatingCategory[]>([
    { key: 'overall', label: 'Overall Experience', value: 0, hovered: 0 },
    { key: 'communication', label: 'Communication Quality', value: 0, hovered: 0 },
    { key: 'speed', label: 'Resolution Speed', value: 0, hovered: 0 },
    { key: 'professionalism', label: 'Professionalism', value: 0, hovered: 0 },
  ]);
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    if (open && user) {
      checkExistingRating();
    }
  }, [open, caseId]);

  const checkExistingRating = async () => {
    const { data } = await supabase
      .from('investigator_ratings')
      .select('id')
      .eq('case_id', caseId)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (data) setAlreadyRated(true);
  };

  const overallRating = categories.find((c) => c.key === 'overall')?.value || 0;
  const allRated = categories.every((c) => c.value > 0);
  const isFeedbackRequired = overallRating <= 2 && overallRating > 0;

  const setRating = (key: string, value: number) => {
    setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, value } : c)));
  };

  const setHovered = (key: string, value: number) => {
    setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, hovered: value } : c)));
  };

  const handleSubmit = async () => {
    if (!allRated) {
      toast.error('Please rate all categories');
      return;
    }

    if (isFeedbackRequired && feedback.trim().length < 10) {
      setFeedbackError('Feedback is required for low ratings (min 10 characters)');
      return;
    }

    if (!isFeedbackRequired && feedback.trim().length > 0 && feedback.trim().length < 10) {
      setFeedbackError('Feedback must be at least 10 characters');
      return;
    }
    setFeedbackError('');

    setSubmitting(true);
    try {
      const vals = Object.fromEntries(categories.map((c) => [c.key, c.value]));
      const { error } = await supabase.from('investigator_ratings').insert({
        case_id: caseId,
        investigator_id: investigatorId,
        customer_id: customerId,
        overall_rating: vals.overall,
        communication_rating: vals.communication,
        speed_rating: vals.speed,
        professionalism_rating: vals.professionalism,
        feedback_comment: feedback.trim() || null,
        flagged_for_review: vals.overall <= 2,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (alreadyRated) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Thank You!</DialogTitle>
            <p className="text-muted-foreground text-center text-sm">
              Your detailed feedback helps us maintain high investigation standards.
            </p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Rate Your Investigator</DialogTitle>
              <DialogDescription>
                Case #{caseId} — Please rate the investigator's performance.
              </DialogDescription>
            </DialogHeader>

            {/* Investigator Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{investigatorName}</p>
                {badgeNo && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <BadgeCheck className="h-3 w-3" />
                    Badge: {badgeNo}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5 py-2">
              {/* Category Ratings */}
              {categories.map((cat) => (
                <div key={cat.key} className="space-y-1">
                  <label className="text-sm font-medium">{cat.label}</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(cat.key, star)}
                        onMouseEnter={() => setHovered(cat.key, star)}
                        onMouseLeave={() => setHovered(cat.key, 0)}
                        className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={cn(
                            'h-6 w-6 transition-colors',
                            (cat.hovered || cat.value) >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      </button>
                    ))}
                    {cat.value > 0 && (
                      <span className={cn(
                        'text-xs ml-2 self-center font-medium',
                        cat.value <= 2 ? 'text-destructive' : cat.value === 3 ? 'text-amber-500' : 'text-green-600'
                      )}>
                        {cat.value <= 2 ? 'Low' : cat.value === 3 ? 'Neutral' : 'High'}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Feedback */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Feedback{' '}
                  <span className="text-muted-foreground">
                    ({isFeedbackRequired ? 'required for low ratings' : 'optional'})
                  </span>
                </label>
                <Textarea
                  placeholder="Share your experience with this investigator..."
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value);
                    if (feedbackError) setFeedbackError('');
                  }}
                  rows={3}
                  maxLength={1000}
                />
                {feedbackError && <p className="text-xs text-destructive">{feedbackError}</p>}
                <p className="text-xs text-muted-foreground text-right">{feedback.length}/1000</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={onClose}>
                  Skip
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting || !allRated}
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
