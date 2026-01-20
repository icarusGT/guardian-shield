// Last updated: 20th January 2025
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ClipboardList,
  Eye,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface FraudCase {
  case_id: number;
  title: string;
  category: string;
  severity: string;
  status: string;
  created_at: string;
}

interface Investigator {
  investigator_id: number;
  user_id: string;
  badge_no: string | null;
  department: string | null;
  is_available: boolean;
  full_name?: string;
}

interface Assignment {
  assignment_id: number;
  case_id: number;
  investigator_id: number;
  assigned_at: string;
  note: string | null;
}

const severityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  UNDER_INVESTIGATION: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-green-100 text-green-700',
};

export default function Investigations() {
  const { user, loading, isAdmin, isInvestigator, profile } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState<FraudCase[]>([]);
  const [investigators, setInvestigators] = useState<Investigator[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Assignment Modal
  const [assignCase, setAssignCase] = useState<FraudCase | null>(null);
  const [selectedInvestigator, setSelectedInvestigator] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Status Update Modal
  const [statusCase, setStatusCase] = useState<FraudCase | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && !(isAdmin || isInvestigator)) {
      navigate('/dashboard');
    }
  }, [user, loading, isAdmin, isInvestigator, navigate]);

  useEffect(() => {
    if (user && (isAdmin || isInvestigator)) {
      fetchData();
    }
  }, [user, isAdmin, isInvestigator]);

  const fetchData = async () => {
    setLoadingData(true);

    try {
      // Fetch cases (open and under investigation for workflow)
      const { data: caseData, error: caseError } = await supabase
        .from('fraud_cases')
        .select('case_id, title, category, severity, status, created_at')
        .in('status', ['OPEN', 'UNDER_INVESTIGATION'])
        .order('created_at', { ascending: false });

      if (caseError) {
        console.error('Error fetching cases:', caseError);
        toast.error(`Failed to load cases: ${caseError.message}`);
      }

      if (caseData) {
        setCases(caseData as FraudCase[]);
      } else {
        setCases([]);
      }

      // Fetch investigators with user names
      const { data: invData, error: invError } = await supabase
        .from('investigators')
        .select('investigator_id, user_id, badge_no, department, is_available');

      if (invError) {
        console.error('Error fetching investigators:', invError);
        toast.error(`Failed to load investigators: ${invError.message}`);
      }

      if (invData) {
        // Get user names
        const userIds = invData.map((i: any) => i.user_id);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_id, full_name')
          .in('user_id', userIds);

        if (userError) {
          console.error('Error fetching user names:', userError);
        }

        const userMap = new Map((userData || []).map((u: any) => [u.user_id, u.full_name]));
        setInvestigators(
          invData.map((i: any) => ({
            ...i,
            full_name: userMap.get(i.user_id) || 'Unknown',
          }))
        );
      } else {
        setInvestigators([]);
      }

      // Fetch assignments
      const { data: assignData, error: assignError } = await supabase
        .from('case_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (assignError) {
        console.error('Error fetching assignments:', assignError);
        toast.error(`Failed to load assignments: ${assignError.message}`);
      }

      if (assignData) {
        setAssignments(assignData as Assignment[]);
      } else {
        setAssignments([]);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching data:', error);
      toast.error(`Failed to load data: ${error.message || 'Unknown error'}`);
      setCases([]);
      setInvestigators([]);
      setAssignments([]);
    } finally {
      setLoadingData(false);
    }
  };

  const getAssignedInvestigator = (caseId: number) => {
    // Get the most recent assignment for this case
    const caseAssignments = assignments
      .filter((a) => a.case_id === caseId)
      .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());
    
    if (caseAssignments.length === 0) return null;
    
    const latestAssignment = caseAssignments[0];
    return investigators.find((i) => i.investigator_id === latestAssignment.investigator_id);
  };

  const handleAssign = async () => {
    if (!assignCase || !selectedInvestigator || !user) {
      toast.error('Please select a case and investigator');
      return;
    }

    setAssigning(true);

    try {
      const { error } = await supabase.from('case_assignments').insert({
        case_id: assignCase.case_id,
        investigator_id: parseInt(selectedInvestigator),
        assigned_by_user: user.id,
        note: assignNote || null,
      });

      if (error) {
        console.error('Assignment error:', error);
        toast.error(`Assignment failed: ${error.message}`);
      } else {
        toast.success('Investigator assigned successfully');
        setAssignCase(null);
        setSelectedInvestigator('');
        setAssignNote('');
        await fetchData();
      }
    } catch (error: any) {
      console.error('Unexpected error assigning investigator:', error);
      toast.error(`Failed to assign investigator: ${error.message || 'Unknown error'}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusCase || !newStatus) {
      toast.error('Please select a case and new status');
      return;
    }

    setUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from('fraud_cases')
        .update({ status: newStatus as "OPEN" | "UNDER_INVESTIGATION" | "CLOSED" })
        .eq('case_id', statusCase.case_id);

      if (error) {
        console.error('Status update error:', error);
        toast.error(`Status update failed: ${error.message}`);
      } else {
        toast.success('Status updated successfully');
        setStatusCase(null);
        setNewStatus('');
        setStatusComment('');
        await fetchData();
      }
    } catch (error: any) {
      console.error('Unexpected error updating status:', error);
      toast.error(`Failed to update status: ${error.message || 'Unknown error'}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Investigation Workflow</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Cases
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cases.filter((c) => c.status === 'OPEN').length}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Under Investigation
              </CardTitle>
              <RefreshCw className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cases.filter((c) => c.status === 'UNDER_INVESTIGATION').length}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Investigators
              </CardTitle>
              <UserPlus className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {investigators.filter((i) => i.is_available).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Active Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : cases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No active cases</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Severity</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Assigned To
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => {
                      const assignedInv = getAssignedInvestigator(c.case_id);
                      return (
                        <tr key={c.case_id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-sm">#{c.case_id}</td>
                          <td className="py-3 px-4 font-medium">{c.title}</td>
                          <td className="py-3 px-4">
                            <Badge className={severityColors[c.severity]}>{c.severity}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={statusColors[c.status]}>
                              {c.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {assignedInv ? (
                              <div>
                                <p className="text-sm font-medium">{assignedInv.full_name}</p>
                                {assignedInv.badge_no && (
                                  <p className="text-xs text-muted-foreground">
                                    Badge: {assignedInv.badge_no}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button asChild size="sm" variant="ghost">
                                <Link to={`/cases/${c.case_id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setAssignCase(c)}
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              )}
                              {(isAdmin || isInvestigator) && c.status !== 'CLOSED' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setStatusCase(c);
                                    setNewStatus(c.status);
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Investigator Dialog */}
        <Dialog open={!!assignCase} onOpenChange={() => setAssignCase(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Investigator</DialogTitle>
              <DialogDescription>
                Assign an investigator to case #{assignCase?.case_id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Investigator</Label>
                <Select value={selectedInvestigator} onValueChange={setSelectedInvestigator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose investigator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {investigators
                      .filter((i) => i.is_available)
                      .map((i) => (
                        <SelectItem key={i.investigator_id} value={i.investigator_id.toString()}>
                          {i.full_name} {i.badge_no && `(${i.badge_no})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="Add any instructions or notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignCase(null)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={!selectedInvestigator || assigning}>
                {assigning ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={!!statusCase} onOpenChange={() => setStatusCase(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Case Status</DialogTitle>
              <DialogDescription>Change status for case #{statusCase?.case_id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="UNDER_INVESTIGATION">Under Investigation</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Comment (optional)</Label>
                <Textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="Add a comment about this status change..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusCase(null)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={!newStatus || updatingStatus}>
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
