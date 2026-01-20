// Last updated: 20th January 2025
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Trash2,
  User,
  Clock,
  AlertTriangle,
  FileImage,
  FileIcon,
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

interface AssignedInvestigator {
  investigator_name: string | null;
  investigator_email: string | null;
  badge_no: string | null;
  department: string | null;
  assigned_at: string | null;
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
  const { user, loading, isAdmin, isInvestigator } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caseData, setCaseData] = useState<FraudCase | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [history, setHistory] = useState<CaseHistory[]>([]);
  const [investigator, setInvestigator] = useState<AssignedInvestigator | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState('');

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
      setCaseData(caseResult as unknown as FraudCase);
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

    setLoadingData(false);
  };

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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
