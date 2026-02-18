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
import { Star, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseRatingModalProps {
  caseId: number;
  investigatorId: number;
  customerId: number;
  open: boolean;
  onClose: () => void;
}

export default function CaseRatingModal({
  caseId,
  investigatorId,
  customerId,
  open,
  onClose,
}: CaseRatingModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
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
      .from('case_ratings')
      .select('id')
      .eq('case_id', caseId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (data) {
      setAlreadyRated(true);
    }
  };

  const getSatisfactionLabel = (r: number) => {
    if (r <= 2) return { label: 'Low Satisfaction', color: 'text-destructive' };
    if (r === 3) return { label: 'Neutral', color: 'text-warning' };
    return { label: 'High Satisfaction', color: 'text-green-600' };
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (feedback.trim().length > 0 && feedback.trim().length < 10) {
      setFeedbackError('Feedback must be at least 10 characters');
      return;
    }
    setFeedbackError('');

    setSubmitting(true);
    try {
      const { error } = await supabase.from('case_ratings').insert({
        case_id: caseId,
        investigator_id: investigatorId,
        customer_id: customerId,
        rating,
        feedback_comment: feedback.trim() || null,
        flagged_for_review: rating <= 2,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Store skip timestamp in localStorage
    localStorage.setItem(`rating_skipped_${caseId}`, new Date().toISOString());
    onClose();
  };

  if (alreadyRated) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center py-8 space-y-4 fade-in-up">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Thank You!</DialogTitle>
            <p className="text-muted-foreground text-center text-sm">
              Your feedback helps us improve our fraud investigation process.
            </p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Rate Your Experience</DialogTitle>
              <DialogDescription>
                Case #{caseId} has been closed. Please rate the investigation quality.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Star Rating */}
              <div className="flex flex-col items-center space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={cn(
                          'h-8 w-8 transition-colors',
                          (hoveredRating || rating) >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground/30'
                        )}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      getSatisfactionLabel(rating).color
                    )}
                  >
                    {getSatisfactionLabel(rating).label}
                  </span>
                )}
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Feedback <span className="text-muted-foreground">(optional)</span>
                </label>
                <Textarea
                  placeholder="Share your experience with the investigation process..."
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value);
                    if (feedbackError) setFeedbackError('');
                  }}
                  rows={3}
                  maxLength={1000}
                />
                {feedbackError && (
                  <p className="text-xs text-destructive">{feedbackError}</p>
                )}
                <p className="text-xs text-muted-foreground text-right">
                  {feedback.length}/1000
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={handleSkip}
                >
                  Skip for now
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
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
