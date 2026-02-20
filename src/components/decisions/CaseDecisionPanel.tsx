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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  AlertTriangle,
  ThumbsUp,
} from 'lucide-react';

interface CaseDecision {
  decision_id: number;
  category: string;
  status: string;
  customer_message: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  admin_user_id: string;
  communicated_at: string | null;
  admin_approved: boolean;
  approved_at: string | null;
}

interface CaseDecisionPanelProps {
  caseId: number;
  decisions: CaseDecision[];
  onDecisionChanged?: () => void;
  caseStatus?: string;
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

export default function CaseDecisionPanel({ caseId, decisions, onDecisionChanged, caseStatus }: CaseDecisionPanelProps) {
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
  const [approving, setApproving] = useState(false);
  const [confirmCommunicateDecision, setConfirmCommunicateDecision] = useState<CaseDecision | null>(null);

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
    if (decision.status !== 'FINAL') {
      toast.error('Only finalized decisions can be communicated');
      return;
    }
    setCommunicating(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('case_decisions')
        .update({
          status: 'COMMUNICATED' as any,
          communicated_at: now,
          updated_at: now,
        } as any)
        .eq('decision_id', decision.decision_id);
      if (error) throw error;

      // No manual history insert — status history is only created by actual status changes

      toast.success('Decision communicated to customer');
      setConfirmCommunicateDecision(null);
      onDecisionChanged?.();
    } catch (error: any) {
      toast.error(`Failed to communicate: ${error.message}`);
    } finally {
      setCommunicating(false);
    }
  };

  const handleApprove = async (decision: CaseDecision) => {
    if (decision.status !== 'COMMUNICATED') {
      toast.error('Only communicated decisions can be approved');
      return;
    }
    setApproving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('case_decisions')
        .update({
          admin_approved: true,
          approved_at: now,
          updated_at: now,
        } as any)
        .eq('decision_id', decision.decision_id);
      if (error) throw error;
      toast.success('Decision approved');
      onDecisionChanged?.();
    } catch (error: any) {
      toast.error(`Failed to approve: ${error.message}`);
    } finally {
      setApproving(false);
    }
  };

  const isCaseOpen = caseStatus === 'OPEN';
  const canCreateDecision = isInvestigator && !hasFinalizedDecision && !isCaseOpen;
  const canEditDecision = (d: CaseDecision) =>
    isInvestigator && d.status === 'DRAFT' && d.admin_user_id === user?.id && !isCaseOpen;
  const canFinalizeDecision = (d: CaseDecision) =>
    isInvestigator && d.status === 'DRAFT' && d.admin_user_id === user?.id && !isCaseOpen;
  const canCommunicate = (d: CaseDecision) =>
    isAdmin && d.status === 'FINAL';
  const canApprove = (d: CaseDecision) =>
    isAdmin && d.status === 'COMMUNICATED' && !d.admin_approved;

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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gavel className="h-4 w-4" />
            Investigator Decision
            {decisions.length > 0 && (() => {
              const topDecision = decisions.reduce((best, d) => {
                const p: Record<string, number> = { DRAFT: 1, FINAL: 2, COMMUNICATED: 3 };
                return (p[d.status] || 0) > (p[best.status] || 0) ? d : best;
              }, decisions[0]);
              const stat = statusLabels[topDecision.status];
              return stat ? (
                <Badge className={stat.color} variant="outline">
                  {stat.label}
                </Badge>
              ) : null;
            })()}
          </CardTitle>
          {canCreateDecision && !hasDraftDecision && (
            <Button
              onClick={() => { resetForm(); setIsCreateOpen(true); }}
              size="sm"
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white border-0"
            >
              <Gavel className="h-4 w-4" />
              Create Decision
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isCaseOpen && isInvestigator ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-600" />
            <p className="text-sm font-medium text-amber-700">Action Required</p>
            <p className="text-xs text-amber-600 mt-1">
              You must move the case to <strong>Under Investigation</strong> before creating or editing a decision.
            </p>
          </div>
        ) : decisions.length === 0 ? (
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

                  {/* Admin action: Communicate Decision (only on FINAL) */}
                  {canCommunicate(decision) && (
                    <div className="flex gap-2 pt-1 animate-fade-in">
                      <Button
                        size="sm"
                        onClick={() => setConfirmCommunicateDecision(decision)}
                        disabled={communicating}
                        className="gap-1 bg-orange-500 hover:bg-orange-600 text-white border-0"
                      >
                        <Megaphone className="h-3 w-3" />
                        Communicate Decision
                      </Button>
                    </div>
                  )}

                  {/* Communicated success badge */}
                  {decision.status === 'COMMUNICATED' && (
                    <div className="flex flex-col gap-1 pt-1 animate-fade-in">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" />
                          Decision Communicated
                        </Badge>
                        {decision.admin_approved && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 w-fit">
                            <ThumbsUp className="h-3 w-3" />
                            Approved
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Communicated at: {new Date(decision.communicated_at || decision.updated_at).toLocaleString()}
                      </span>
                      {decision.admin_approved && decision.approved_at && (
                        <span className="text-xs text-muted-foreground">
                          Approved at: {new Date(decision.approved_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Admin action: Approve Decision (only on COMMUNICATED + not yet approved) */}
                  {canApprove(decision) && (
                    <div className="flex gap-2 pt-1 animate-fade-in">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(decision)}
                        disabled={approving}
                        className="gap-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        {approving ? 'Approving...' : 'Approve Decision'}
                      </Button>
                    </div>
                  )}

                  {/* Finalized read-only message */}
                  {decision.status === 'FINAL' && !canCommunicate(decision) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Read-only — Decision finalized
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

      {/* Communicate Confirmation Dialog */}
      <AlertDialog open={!!confirmCommunicateDecision} onOpenChange={(open) => { if (!open) setConfirmCommunicateDecision(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Communicate Decision
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this decision as communicated to the customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={communicating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCommunicateDecision && handleCommunicate(confirmCommunicateDecision)}
              disabled={communicating}
              className="btn-glow-green bg-green-600 hover:bg-green-700"
            >
              {communicating ? 'Communicating...' : 'Yes, Communicate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
