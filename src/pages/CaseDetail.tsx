// Last updated: 26th January 2026
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import CaseFeedbackForm, { CaseFeedbackList } from '@/components/feedback/CaseFeedbackForm';
import CaseDecisionForm, { CaseDecisionList } from '@/components/decisions/CaseDecisionForm';
import CaseChat from '@/components/chat/CaseChat';
import CaseRatingModal from '@/components/ratings/CaseRatingModal';
import InvestigatorRatingModal from '@/components/ratings/InvestigatorRatingModal';
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  User,
  Clock,
  FileImage,
  FileIcon,
  MessageSquare,
  Gavel,
  CreditCard,
  AlertTriangle,
  DollarSign,
  MapPin,
} from 'lucide-react';

interface FraudCase {
  case_id: number;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  status: string;
  created_at: string;
  closed_at: string | null;
}

interface Evidence {
  evidence_id: number;
  file_type: string;
  file_path: string;
  note: string | null;
  uploaded_at: string;
}

interface CaseHistory {
  history_id: number;
  old_status: string;
  new_status: string;
  changed_at: string;
  comment: string | null;
}

interface CaseFeedback {
  feedback_id: number;
  category: string;
  approval_status: string;
  comment: string | null;
  created_at: string;
  investigator_id: number;
}

interface CaseDecision {
  decision_id: number;
  category: string;
  status: string;
  customer_message: string | null;
  internal_notes: string | null;
  created_at: string;
  admin_user_id: string;
}

interface AssignedInvestigator {
  investigator_id: number;
  investigator_name: string | null;
  investigator_email: string | null;
  badge_no: string | null;
  department: string | null;
  assigned_at: string | null;
}

interface LinkedTransaction {
  txn_id: number;
  txn_amount: number;
  txn_channel: string;
  txn_location: string | null;
  recipient_account: string | null;
  occurred_at: string;
  risk_score?: number;
  risk_level?: string;
  reasons?: string;
}

interface ReportedUser {
  user_id: string;
  full_name: string;
  email: string | null;
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

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const { user, loading, isAdmin, isInvestigator, isCustomer } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caseData, setCaseData] = useState<FraudCase | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [history, setHistory] = useState<CaseHistory[]>([]);
  const [investigator, setInvestigator] = useState<AssignedInvestigator | null>(null);
  const [caseFeedback, setCaseFeedback] = useState<CaseFeedback[]>([]);
  const [caseDecisions, setCaseDecisions] = useState<CaseDecision[]>([]);
  const [myInvestigatorId, setMyInvestigatorId] = useState<number | null>(null);
  const [linkedTransactions, setLinkedTransactions] = useState<LinkedTransaction[]>([]);
  const [reportedUser, setReportedUser] = useState<ReportedUser | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [showInvestigatorRating, setShowInvestigatorRating] = useState(false);
  const [ratingCustomerId, setRatingCustomerId] = useState<number | null>(null);
  const [ratingInvestigatorId, setRatingInvestigatorId] = useState<number | null>(null);
  const [ratingInvestigatorName, setRatingInvestigatorName] = useState('');
  const [ratingBadgeNo, setRatingBadgeNo] = useState<string | null>(null);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && caseId) {
      fetchCaseData();
    }
  }, [user, caseId]);

  const fetchCaseData = async () => {
    if (!caseId) return;
    setLoadingData(true);

    // Fetch case details
    const { data: caseResult } = await supabase
      .from('fraud_cases')
      .select('*')
      .eq('case_id', parseInt(caseId))
      .single();

    if (caseResult) {
      const newCase = caseResult as unknown as FraudCase;
      // Detect closure transition for rating popup
      if (previousStatus && previousStatus !== 'CLOSED' && newCase.status === 'CLOSED' && isCustomer) {
        // Trigger rating after data finishes loading
        setTimeout(() => checkAndShowRating(newCase), 500);
      }
      setPreviousStatus(newCase.status);
      setCaseData(newCase);
      
      // Fetch reported user info using secure RPC function
      const { data: reporterData } = await supabase
        .rpc('get_case_reporter', { p_case_id: caseResult.case_id });
      
      if (reporterData && reporterData.length > 0) {
        const reporter = reporterData[0];
        setReportedUser({
          user_id: reporter.user_id,
          full_name: reporter.full_name,
          email: reporter.email,
        });
      }
    }

    // Fetch evidence
    const { data: evidenceResult } = await supabase
      .from('evidence_files')
      .select('*')
      .eq('case_id', parseInt(caseId))
      .order('uploaded_at', { ascending: false });

    if (evidenceResult) {
      setEvidence(evidenceResult as unknown as Evidence[]);
    }

    // Fetch history
    const { data: historyResult } = await supabase
      .from('case_history')
      .select('*')
      .eq('case_id', parseInt(caseId))
      .order('changed_at', { ascending: false });

    if (historyResult) {
      setHistory(historyResult as unknown as CaseHistory[]);
    }

    // Fetch assigned investigator
    const { data: investigatorResult } = await supabase
      .from('v_case_assigned_investigator')
      .select('*')
      .eq('case_id', parseInt(caseId))
      .maybeSingle();

    if (investigatorResult) {
      setInvestigator(investigatorResult as unknown as AssignedInvestigator);
    }

    // Fetch case feedback
    const { data: feedbackResult } = await supabase
      .from('case_feedback')
      .select('*')
      .eq('case_id', parseInt(caseId))
      .order('created_at', { ascending: false });

    if (feedbackResult) {
      setCaseFeedback(feedbackResult as unknown as CaseFeedback[]);
    }

    // Fetch case decisions (admin final decisions)
    const { data: decisionsResult } = await supabase
      .from('case_decisions')
      .select('*')
      .eq('case_id', parseInt(caseId))
      .order('created_at', { ascending: false });

    if (decisionsResult) {
      setCaseDecisions(decisionsResult as unknown as CaseDecision[]);
    }

    // Fetch linked transactions with suspicious info
    const { data: caseTransactions } = await supabase
      .from('case_transactions')
      .select('txn_id')
      .eq('case_id', parseInt(caseId));

    if (caseTransactions && caseTransactions.length > 0) {
      const txnIds = caseTransactions.map((ct) => ct.txn_id);
      
      // Fetch transactions
      const { data: txnData } = await supabase
        .from('transactions')
        .select('*')
        .in('txn_id', txnIds);

      // Fetch suspicious transaction info
      const { data: suspData } = await supabase
        .from('suspicious_transactions')
        .select('txn_id, risk_score, risk_level, reasons')
        .in('txn_id', txnIds);

      if (txnData) {
        const txnsWithRisk: LinkedTransaction[] = txnData.map((txn) => {
          const suspInfo = suspData?.find((s) => s.txn_id === txn.txn_id);
          return {
            txn_id: txn.txn_id,
            txn_amount: txn.txn_amount,
            txn_channel: txn.txn_channel,
            txn_location: txn.txn_location,
            recipient_account: txn.recipient_account,
            occurred_at: txn.occurred_at,
            risk_score: suspInfo?.risk_score,
            risk_level: suspInfo?.risk_level,
            reasons: suspInfo?.reasons,
          };
        });
        setLinkedTransactions(txnsWithRisk);
      }
    } else {
      setLinkedTransactions([]);
    }

    // Fetch my investigator ID if I'm an investigator
    if (isInvestigator && user) {
      const { data: invData } = await supabase
        .from('investigators')
        .select('investigator_id')
        .eq('user_id', user.id)
        .single();
      
      if (invData) {
        setMyInvestigatorId(invData.investigator_id);
      }
    }

    setLoadingData(false);
  };

  const checkAndShowRating = async (c: FraudCase) => {
    if (!caseId) return;
    const id = parseInt(caseId);

    // Check if already rated
    const { data: existingRating } = await supabase
      .from('case_ratings')
      .select('id')
      .eq('case_id', id)
      .maybeSingle();
    if (existingRating) return;

    // Check skip cooldown (24h)
    const skippedAt = localStorage.getItem(`rating_skipped_${id}`);
    if (skippedAt) {
      const skippedTime = new Date(skippedAt).getTime();
      if (Date.now() - skippedTime < 24 * 60 * 60 * 1000) return;
    }

    // Get customer_id and investigator_id
    const { data: custData } = await supabase
      .from('customers')
      .select('customer_id')
      .eq('user_id', user!.id)
      .single();

    const { data: invData } = await supabase
      .from('v_case_assigned_investigator')
      .select('investigator_id, investigator_name, badge_no')
      .eq('case_id', id)
      .maybeSingle();

    if (custData && invData) {
      setRatingCustomerId(custData.customer_id);
      setRatingInvestigatorId(invData.investigator_id);
      setRatingInvestigatorName(invData.investigator_name || 'Investigator');
      setRatingBadgeNo(invData.badge_no || null);
      setShowRating(true);
    }
  };

  // Also check on initial load if case is already closed and needs rating
  useEffect(() => {
    if (caseData && caseData.status === 'CLOSED' && isCustomer && !loadingData && caseId) {
      checkAndShowRating(caseData);
    }
  }, [caseData?.status, isCustomer, loadingData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !caseId || !user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `case_${caseId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Determine file type
      let fileType = 'OTHER';
      if (file.type.startsWith('image/')) fileType = 'SCREENSHOT';
      else if (file.type === 'application/pdf') fileType = 'PDF';

      // Insert evidence record
      const { error: insertError } = await supabase.from('evidence_files').insert({
        case_id: parseInt(caseId),
        file_type: fileType as "SCREENSHOT" | "PDF" | "TRANSACTION_LOG" | "OTHER",
        file_path: filePath,
        note: uploadNote || null,
        uploaded_by: user.id,
      });

      if (insertError) throw insertError;

      toast.success('Evidence uploaded successfully');
      setUploadNote('');
      fetchCaseData();
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (filePath: string) => {
    const { data, error } = await supabase.storage.from('evidence').download(filePath);

    if (error) {
      toast.error('Download failed');
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || 'download';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'SCREENSHOT':
        return <FileImage className="h-4 w-4" />;
      case 'PDF':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  if (loading || loadingData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (!caseData) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">Case not found</h2>
          <Button asChild variant="outline">
            <Link to="/cases">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/cases">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Case #{caseData.case_id}</h1>
            <p className="text-muted-foreground">{caseData.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Case Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Case Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline">{caseData.category.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Severity</p>
                    <Badge className={severityColors[caseData.severity]}>
                      {caseData.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={statusColors[caseData.status]}>
                      {caseData.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {new Date(caseData.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {caseData.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{caseData.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reported By Section */}
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Reported By
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportedUser ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="text-sm font-mono font-medium truncate" title={reportedUser.user_id}>
                        {reportedUser.user_id.slice(0, 8)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="text-sm font-medium">{reportedUser.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">
                        {reportedUser.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Unable to load reporter information.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Transaction Details Section */}
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {linkedTransactions.length > 0 ? (
                  linkedTransactions.map((txn) => (
                    <div
                      key={txn.txn_id}
                      className="p-4 bg-background rounded-lg border space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          <span className="text-lg font-bold">
                            ৳{txn.txn_amount.toLocaleString()} BDT
                          </span>
                          <Badge variant="outline">{txn.txn_channel}</Badge>
                        </div>
                        {txn.risk_level && (
                          <Badge
                            className={
                              txn.risk_level === 'HIGH'
                                ? 'bg-red-100 text-red-700'
                                : txn.risk_level === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {txn.risk_level} Risk
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Transaction ID</p>
                          <p className="font-mono font-medium">#{txn.txn_id}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount (BDT)</p>
                          <p className="font-medium">৳{txn.txn_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment Channel</p>
                          <p className="font-medium">{txn.txn_channel}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Occurred At</p>
                          <p className="font-medium">
                            {new Date(txn.occurred_at).toLocaleString()}
                          </p>
                        </div>
                        {txn.recipient_account && (
                          <div>
                            <p className="text-muted-foreground">Recipient</p>
                            <p className="font-medium">{txn.recipient_account}</p>
                          </div>
                        )}
                        {txn.txn_location && (
                          <div>
                            <p className="text-muted-foreground">Location</p>
                            <p className="font-medium flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {txn.txn_location}
                            </p>
                          </div>
                        )}
                        {txn.risk_score !== undefined && (
                          <div>
                            <p className="text-muted-foreground">Risk Score</p>
                            <p className="font-medium">{txn.risk_score} points</p>
                          </div>
                        )}
                      </div>

                      {txn.reasons && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">
                            Risk Factors
                          </p>
                          <p className="text-sm text-amber-700">{txn.reasons}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No transaction details provided for this case.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Evidence Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Evidence Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Form */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Add a note (optional)"
                    value={uploadNote}
                    onChange={(e) => setUploadNote(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.log,.txt"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>

                {/* Evidence List */}
                {evidence.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No evidence files uploaded yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {evidence.map((e) => (
                      <div
                        key={e.evidence_id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(e.file_type)}
                          <div>
                            <p className="text-sm font-medium">
                              {e.file_path.split('/').pop()}
                            </p>
                            {e.note && (
                              <p className="text-xs text-muted-foreground">{e.note}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(e.uploaded_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(e.file_path)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assigned Investigator */}
            {investigator && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Assigned Investigator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{investigator.investigator_name}</p>
                    <p className="text-sm text-muted-foreground">{investigator.investigator_email}</p>
                    {investigator.badge_no && (
                      <p className="text-sm">Badge: {investigator.badge_no}</p>
                    )}
                    {investigator.department && (
                      <p className="text-sm text-muted-foreground">{investigator.department}</p>
                    )}
                    {investigator.assigned_at && (
                      <p className="text-xs text-muted-foreground">
                        Assigned: {new Date(investigator.assigned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Investigator Feedback Section */}
            {(isInvestigator || isAdmin) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-4 w-4" />
                      Feedback & Approval
                    </CardTitle>
                    {isInvestigator && myInvestigatorId && caseId && (
                      <CaseFeedbackForm
                        caseId={parseInt(caseId)}
                        investigatorId={myInvestigatorId}
                        onFeedbackSubmitted={fetchCaseData}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CaseFeedbackList caseId={parseInt(caseId || '0')} feedback={caseFeedback} />
                </CardContent>
              </Card>
            )}

            {/* Admin Final Decision Section */}
            {isAdmin && caseId && (
              <Card className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Gavel className="h-4 w-4" />
                      Admin Decision
                    </CardTitle>
                    <CaseDecisionForm
                      caseId={parseInt(caseId)}
                      onDecisionSubmitted={fetchCaseData}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <CaseDecisionList decisions={caseDecisions} showInternalNotes={true} />
                </CardContent>
              </Card>
            )}

            {/* Case History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No status changes</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((h) => (
                      <div
                        key={h.history_id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <div>
                          <p>
                            <span className="text-muted-foreground">{h.old_status}</span>
                            {' → '}
                            <span className="font-medium">{h.new_status}</span>
                          </p>
                          {h.comment && (
                            <p className="text-muted-foreground text-xs">{h.comment}</p>
                          )}
                          <p className="text-muted-foreground text-xs">
                            {new Date(h.changed_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* In-Case Messaging */}
            {(isCustomer || isInvestigator) && caseId && (
              <CaseChat caseId={parseInt(caseId)} />
            )}
          </div>
        </div>
      </div>
      {/* Case Rating Modal */}
      {showRating && ratingCustomerId && ratingInvestigatorId && caseId && (
        <CaseRatingModal
          caseId={parseInt(caseId)}
          investigatorId={ratingInvestigatorId}
          customerId={ratingCustomerId}
          open={showRating}
          onClose={() => {
            setShowRating(false);
            // After case rating, show investigator rating
            setTimeout(() => setShowInvestigatorRating(true), 300);
          }}
        />
      )}
      {/* Investigator Rating Modal */}
      {showInvestigatorRating && ratingCustomerId && ratingInvestigatorId && caseId && (
        <InvestigatorRatingModal
          caseId={parseInt(caseId)}
          investigatorId={ratingInvestigatorId}
          customerId={ratingCustomerId}
          investigatorName={ratingInvestigatorName}
          badgeNo={ratingBadgeNo}
          open={showInvestigatorRating}
          onClose={() => setShowInvestigatorRating(false)}
        />
      )}
    </AppLayout>
  );
}
