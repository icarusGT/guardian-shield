import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
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
import { toast } from 'sonner';
import { Gavel, ShieldCheck, ShieldX, Clock, FileQuestion, Scale, Send } from 'lucide-react';

interface TransactionDecisionFormProps {
  txnId: number;
  onDecisionSubmitted?: () => void;
}

const decisionCategories = [
  { value: 'FRAUD_CONFIRMED', label: 'Fraud Confirmed', icon: ShieldX, color: 'bg-red-100 text-red-700' },
  { value: 'CLEARED', label: 'Cleared', icon: ShieldCheck, color: 'bg-green-100 text-green-700' },
  { value: 'PARTIAL_FRAUD', label: 'Partial Fraud', icon: Scale, color: 'bg-amber-100 text-amber-700' },
  { value: 'INVESTIGATION_ONGOING', label: 'Investigation Ongoing', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  { value: 'INSUFFICIENT_EVIDENCE', label: 'Insufficient Evidence', icon: FileQuestion, color: 'bg-slate-100 text-slate-700' },
  { value: 'REFERRED_TO_AUTHORITIES', label: 'Referred to Authorities', icon: Gavel, color: 'bg-purple-100 text-purple-700' },
];

const decisionStatuses = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  { value: 'FINAL', label: 'Final', color: 'bg-blue-100 text-blue-700' },
  { value: 'COMMUNICATED', label: 'Communicated', color: 'bg-green-100 text-green-700' },
];

export default function TransactionDecisionForm({ txnId, onDecisionSubmitted }: TransactionDecisionFormProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [customerMessage, setCustomerMessage] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!category) {
      toast.error('Please select a decision category');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('transaction_decisions').insert({
        txn_id: txnId,
        admin_user_id: user.id,
        category: category as any,
        status: status as any,
        customer_message: customerMessage || null,
        internal_notes: internalNotes || null,
      });

      if (error) throw error;

      toast.success('Decision submitted successfully');
      setIsOpen(false);
      resetForm();
      onDecisionSubmitted?.();
    } catch (error: any) {
      toast.error(`Failed to submit decision: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategory('');
    setStatus('DRAFT');
    setCustomerMessage('');
    setInternalNotes('');
  };

  const selectedCategory = decisionCategories.find(c => c.value === category);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="ghost" size="sm" title="Final Decision">
        <Gavel className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Submit Final Decision
            </DialogTitle>
            <DialogDescription>
              Provide the final decision for Transaction #{txnId}. This will be visible to the customer once marked as Final or Communicated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Decision Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision category..." />
                </SelectTrigger>
                <SelectContent>
                  {decisionCategories.map((cat) => (
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
              <Label>Decision Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {decisionStatuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <Badge className={s.color}>{s.label}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Customers can only see decisions marked as "Final" or "Communicated"
              </p>
            </div>

            <div className="space-y-2">
              <Label>Customer Message</Label>
              <Textarea
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                placeholder="Write a message for the customer explaining the decision..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This message will be visible to the customer
              </p>
            </div>

            <div className="space-y-2">
              <Label>Internal Notes (Admin Only)</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add any internal notes or observations..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Only visible to admins and auditors
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!category || submitting} className="gap-2">
              {submitting ? 'Submitting...' : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Decision
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Component to display transaction decisions
interface TransactionDecision {
  decision_id: number;
  category: string;
  status: string;
  customer_message: string | null;
  internal_notes: string | null;
  created_at: string;
  admin_user_id: string;
}

interface TransactionDecisionListProps {
  decisions: TransactionDecision[];
  showInternalNotes?: boolean;
}

export function TransactionDecisionList({ decisions, showInternalNotes = false }: TransactionDecisionListProps) {
  if (decisions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      {decisions.map((decision) => {
        const cat = decisionCategories.find(c => c.value === decision.category);
        const stat = decisionStatuses.find(s => s.value === decision.status);
        
        return (
          <div key={decision.decision_id} className="flex items-center gap-2 text-xs">
            {cat && <cat.icon className="h-3 w-3" />}
            <Badge className={`${cat?.color || ''} text-xs py-0`}>{cat?.label || decision.category}</Badge>
            <Badge className={`${stat?.color || ''} text-xs py-0`} variant="outline">{stat?.label || decision.status}</Badge>
          </div>
        );
      })}
    </div>
  );
}
