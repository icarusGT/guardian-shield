import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Gavel,
  ShieldCheck,
  ShieldX,
  FileQuestion,
  Send,
  Edit,
  Lock,
  CheckCircle2,
  Megaphone,
} from 'lucide-react';

interface CaseDecision {
  decision_id: number;
  category: string;
  status: string;
  customer_message: string | null;
  internal_notes: string | null;
  created_at: string;
  admin_user_id: string;
}

interface CaseDecisionPanelProps {
  caseId: number;
  decisions: CaseDecision[];
  onDecisionChanged?: () => void;
}

const outcomeOptions = [
  { value: 'FRAUD_CONFIRMED', label: 'Fraud Confirmed', icon: ShieldX, color: 'bg-red-100 text-red-700' },
  { value: 'CLEARED', label: 'Not Fraud / False Alarm', icon: ShieldCheck, color: 'bg-green-100 text-green-700' },
  { value: 'INSUFFICIENT_EVIDENCE', label: 'Insufficient Evidence', icon: FileQuestion, color: 'bg-slate-100 text-slate-700' },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-amber-100 text-amber-700' },
  FINAL: { label: 'Finalized', color: 'bg-blue-100 text-blue-700' },
  COMMUNICATED: { label: 'Communicated', color: 'bg-green-100 text-green-700' },
};

export default function CaseDecisionPanel({ caseId, decisions, onDecisionChanged }: CaseDecisionPanelProps) {
  const { user, isInvestigator, isAdmin } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<CaseDecision | null>(null);

  // Form state
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [communicating, setCommunicating] = useState(false);

  const hasFinalizedDecision = decisions.some(d => d.status === 'FINAL' || d.status === 'COMMUNICATED');
  const hasDraftDecision = decisions.some(d => d.status === 'DRAFT');

  const resetForm = () => {
    setCategory('');
    setReason('');
    setActionTaken('');
  };

  const handleCreate = async () => {
    if (!category) { toast.error('Please select an outcome'); return; }
    if (!reason.trim()) { toast.error('Reason is required'); return; }
    if (!user) { toast.error('You must be logged in'); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('case_decisions').insert({
        case_id: caseId,
        admin_user_id: user.id,
        category: category as any,
        status: 'DRAFT' as any,
        customer_message: reason.trim(),
        internal_notes: actionTaken.trim() || null,
      });
      if (error) throw error;
      toast.success('Decision draft saved');
      setIsCreateOpen(false);
      resetForm();
      onDecisionChanged?.();
    } catch (error: any) {
      toast.error(`Failed to create decision: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (decision: CaseDecision) => {
    setEditingDecision(decision);
    setCategory(decision.category);
    setReason(decision.customer_message || '');
    setActionTaken(decision.internal_notes || '');
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingDecision) return;
    if (!category) { toast.error('Please select an outcome'); return; }
    if (!reason.trim()) { toast.error('Reason is required'); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('case_decisions')
        .update({
          category: category as any,
          customer_message: reason.trim(),
          internal_notes: actionTaken.trim() || null,
        })
        .eq('decision_id', editingDecision.decision_id);
      if (error) throw error;
      toast.success('Decision updated');
      setIsEditOpen(false);
      setEditingDecision(null);
      resetForm();
      onDecisionChanged?.();
    } catch (error: any) {
      toast.error(`Failed to update decision: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async (decision: CaseDecision) => {
    if (!decision.customer_message?.trim()) {
      toast.error('Cannot finalize: reason is required');
      return;
    }

    setFinalizing(true);
    try {
      const { error } = await supabase
        .from('case_decisions')
        .update({ status: 'FINAL' as any })
        .eq('decision_id', decision.decision_id);
      if (error) throw error;
      toast.success('Decision finalized. It is now read-only.');
      onDecisionChanged?.();
    } catch (error: any) {
      toast.error(`Failed to finalize: ${error.message}`);
    } finally {
      setFinalizing(false);
    }
  };

  const handleCommunicate = async (decision: CaseDecision) => {
    setCommunicating(true);
    try {
      const { error } = await supabase
        .from('case_decisions')
        .update({ status: 'COMMUNICATED' as any })
        .eq('decision_id', decision.decision_id);
      if (error) throw error;
      toast.success('Decision marked as communicated');
      onDecisionChanged?.();
    } catch (error: any) {
      toast.error(`Failed to communicate: ${error.message}`);
    } finally {
      setCommunicating(false);
    }
  };

  const canCreateDecision = isInvestigator && !hasFinalizedDecision;
  const canEditDecision = (d: CaseDecision) =>
    isInvestigator && d.status === 'DRAFT' && d.admin_user_id === user?.id;
  const canFinalizeDecision = (d: CaseDecision) =>
    isInvestigator && d.status === 'DRAFT' && d.admin_user_id === user?.id;
  const canCommunicate = (d: CaseDecision) =>
    isAdmin && d.status === 'FINAL';

  // Stable JSX for form fields to avoid re-mounting on keystroke
  const decisionFormFields = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Outcome *</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select outcome..." />
          </SelectTrigger>
          <SelectContent>
            {outcomeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Reason *</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain the reasoning behind this decision..."
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Action Taken (optional)</Label>
        <Textarea
          value={actionTaken}
          onChange={(e) => setActionTaken(e.target.value)}
          placeholder="Describe any actions taken..."
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gavel className="h-4 w-4" />
            Decision
          </CardTitle>
          {canCreateDecision && !hasDraftDecision && (
            <Button
              onClick={() => { resetForm(); setIsCreateOpen(true); }}
              size="sm"
              className="gap-2"
            >
              <Gavel className="h-4 w-4" />
              Create Decision
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {decisions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No decision yet.</p>
        ) : (
          <div className="space-y-3">
            {decisions.map((decision) => {
              const outcome = outcomeOptions.find(o => o.value === decision.category);
              const stat = statusLabels[decision.status] || { label: decision.status, color: '' };
              const isLocked = decision.status === 'FINAL' || decision.status === 'COMMUNICATED';

              return (
                <div key={decision.decision_id} className="p-3 bg-muted/50 rounded-lg border space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      outcome && <outcome.icon className="h-4 w-4" />
                    )}
                    <Badge className={outcome?.color || ''}>
                      {outcome?.label || decision.category}
                    </Badge>
                    <Badge className={stat.color} variant="outline">
                      {stat.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(decision.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {decision.customer_message && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Reason</p>
                      <p className="text-sm">{decision.customer_message}</p>
                    </div>
                  )}

                  {(isAdmin || isInvestigator) && decision.internal_notes && (
                    <div className="border-t pt-2">
                      <p className="text-xs font-medium text-muted-foreground">Action Taken</p>
                      <p className="text-xs text-muted-foreground italic">{decision.internal_notes}</p>
                    </div>
                  )}

                  {/* Investigator actions: Edit + Finalize (only on DRAFT) */}
                  {decision.status === 'DRAFT' && isInvestigator && (
                    <div className="flex gap-2 pt-1">
                      {canEditDecision(decision) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(decision)}
                          className="gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit Draft
                        </Button>
                      )}
                      {canFinalizeDecision(decision) && (
                        <Button
                          size="sm"
                          onClick={() => handleFinalize(decision)}
                          disabled={finalizing}
                          className="gap-1 btn-glow-blue"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {finalizing ? 'Finalizing...' : 'Finalize Decision'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Admin action: Mark as Communicated (only on FINAL) */}
                  {canCommunicate(decision) && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleCommunicate(decision)}
                        disabled={communicating}
                        className="gap-1 btn-glow-green"
                      >
                        <Megaphone className="h-3 w-3" />
                        {communicating ? 'Updating...' : 'Mark as Communicated'}
                      </Button>
                    </div>
                  )}

                  {/* Status message */}
                  {isLocked && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      {decision.status === 'COMMUNICATED'
                        ? 'Decision communicated to customer'
                        : 'Read-only — Decision finalized'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hasFinalizedDecision && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            A finalized decision exists for this case.
          </div>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Save Decision Draft
            </DialogTitle>
            <DialogDescription>
              Create a decision for Case #{caseId}. It will start as a draft and must be finalized before the case can be closed.
            </DialogDescription>
          </DialogHeader>
          {decisionFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!category || !reason.trim() || submitting} className="gap-2 btn-glow-primary">
              {submitting ? 'Saving...' : <><Send className="h-4 w-4" /> Save Draft</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Decision Draft
            </DialogTitle>
            <DialogDescription>
              Update the draft decision for Case #{caseId}.
            </DialogDescription>
          </DialogHeader>
          {decisionFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!category || !reason.trim() || submitting} className="gap-2 btn-glow-primary">
              {submitting ? 'Saving...' : <><Send className="h-4 w-4" /> Save Draft</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
