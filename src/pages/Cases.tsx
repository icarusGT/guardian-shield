// Last updated: 20th February 2026
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Search, Eye } from 'lucide-react';

interface FraudCase {
  case_id: number;
  title: string;
  category: string;
  severity: string;
  status: string;
  created_at: string;
  description: string | null;
}

interface DecisionInfo {
  case_id: number;
  status: string;
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

const decisionStatusColors: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-700',
  FINAL: 'bg-blue-100 text-blue-700',
  COMMUNICATED: 'bg-green-100 text-green-700',
};

export default function Cases() {
  const { user, loading, isAdmin, isAuditor } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [decisionMap, setDecisionMap] = useState<Map<number, string>>(new Map());
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<string>(searchParams.get('decision') || 'all');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCases();
    }
  }, [user]);

  const fetchCases = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from('fraud_cases')
      .select('case_id, title, category, severity, status, created_at, description')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCases(data as FraudCase[]);

      // Fetch decision statuses for all cases (admin/auditor only see all)
      const caseIds = data.map((c) => c.case_id);
      if (caseIds.length > 0) {
        const { data: decisions } = await supabase
          .from('case_decisions')
          .select('case_id, status')
          .in('case_id', caseIds);

        if (decisions) {
          // Use the latest decision status per case (last one wins since ordered by default)
          const map = new Map<number, string>();
          for (const d of decisions as DecisionInfo[]) {
            // If multiple decisions, prioritize: COMMUNICATED > FINAL > DRAFT
            const existing = map.get(d.case_id);
            const priority: Record<string, number> = { DRAFT: 1, FINAL: 2, COMMUNICATED: 3 };
            if (!existing || (priority[d.status] || 0) > (priority[existing] || 0)) {
              map.set(d.case_id, d.status);
            }
          }
          setDecisionMap(map);
        }
      }
    }
    setLoadingData(false);
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.case_id.toString().includes(search);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || c.severity === severityFilter;
    const caseDecision = decisionMap.get(c.case_id);
    const matchesDecision =
      decisionFilter === 'all' ||
      (decisionFilter === 'none' && !caseDecision) ||
      caseDecision === decisionFilter;
    return matchesSearch && matchesStatus && matchesSeverity && matchesDecision;
  });

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
          <h1 className="text-2xl font-bold">Fraud Cases</h1>
          <Button asChild>
            <Link to="/cases/new">
              <Plus className="h-4 w-4 mr-2" />
              Create New Case
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="UNDER_INVESTIGATION">Under Investigation</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
              <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Decisions</SelectItem>
                  <SelectItem value="none">No Decision</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="FINAL">Finalized</SelectItem>
                  <SelectItem value="COMMUNICATED">Communicated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cases Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cases ({filteredCases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8 text-muted-foreground">Loading cases...</div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No cases found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Severity</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Decision</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((c) => (
                      <tr key={c.case_id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm">#{c.case_id}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{c.title}</p>
                          {c.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {c.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{c.category.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={severityColors[c.severity]}>{c.severity}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={statusColors[c.status]}>
                            {c.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {decisionMap.has(c.case_id) ? (
                            <Badge className={decisionStatusColors[decisionMap.get(c.case_id)!]}>
                              {decisionMap.get(c.case_id)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No Decision</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`/cases/${c.case_id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
