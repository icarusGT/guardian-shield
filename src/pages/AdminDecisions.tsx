// Last updated: 20th February 2026
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Gavel,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  ArrowUpDown,
} from 'lucide-react';

interface CaseDecision {
  decision_id: number;
  case_id: number;
  category: string;
  status: string;
  customer_message: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  communicated_at: string | null;
  case_title?: string;
}

const categoryColors: Record<string, string> = {
  FRAUD_CONFIRMED: 'bg-red-100 text-red-700',
  CLEARED: 'bg-green-100 text-green-700',
  PARTIAL_FRAUD: 'bg-amber-100 text-amber-700',
  INVESTIGATION_ONGOING: 'bg-blue-100 text-blue-700',
  INSUFFICIENT_EVIDENCE: 'bg-gray-100 text-gray-700',
  REFERRED_TO_AUTHORITIES: 'bg-purple-100 text-purple-700',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-700',
  FINAL: 'bg-blue-100 text-blue-700',
  COMMUNICATED: 'bg-green-100 text-green-700',
};

type SortField = 'created_at' | 'updated_at';
type SortDir = 'asc' | 'desc';

export default function AdminDecisions() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [caseDecisions, setCaseDecisions] = useState<CaseDecision[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && ['DRAFT', 'FINAL', 'COMMUNICATED'].includes(urlStatus)) {
      setStatusFilter(urlStatus);
    }
  }, [searchParams]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchDecisions();
    }
  }, [user, isAdmin]);

  const fetchDecisions = async () => {
    setLoadingData(true);

    const { data: caseDecisionsData } = await supabase
      .from('case_decisions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (caseDecisionsData) {
      const caseIds = caseDecisionsData.map((d) => d.case_id);
      const { data: casesData } = await supabase
        .from('fraud_cases')
        .select('case_id, title')
        .in('case_id', caseIds);

      const caseMap = new Map(casesData?.map((c) => [c.case_id, c.title]) || []);
      const enriched = caseDecisionsData.map((d) => ({
        ...d,
        case_title: caseMap.get(d.case_id) || `Case #${d.case_id}`,
      }));
      setCaseDecisions(enriched as CaseDecision[]);
    }

    setLoadingData(false);
  };

  const filteredCaseDecisions = caseDecisions
    .filter((d) => {
      const matchesSearch =
        searchQuery === '' ||
        (d.case_title || `Case #${d.case_id}`).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      const aVal = new Date(a[sortField]).getTime();
      const bVal = new Date(b[sortField]).getTime();
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

  const pendingCount = caseDecisions.filter((d) => d.status === 'DRAFT').length;
  const finalCount = caseDecisions.filter((d) => d.status === 'FINAL').length;
  const communicatedCount = caseDecisions.filter((d) => d.status === 'COMMUNICATED').length;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gavel className="h-8 w-8" />
              Admin Decisions
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all decisions across cases
            </p>
          </div>
          <Button onClick={fetchDecisions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className={`glass-card cursor-pointer hover:shadow-md transition-all ${statusFilter === 'DRAFT' ? 'ring-2 ring-amber-400' : ''}`}
            onClick={() => handleStatusFilterChange(statusFilter === 'DRAFT' ? 'all' : 'DRAFT')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending (Draft)
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting finalization</p>
            </CardContent>
          </Card>

          <Card
            className={`glass-card cursor-pointer hover:shadow-md transition-all ${statusFilter === 'FINAL' ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => handleStatusFilterChange(statusFilter === 'FINAL' ? 'all' : 'FINAL')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Finalized
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{finalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready to communicate</p>
            </CardContent>
          </Card>

          <Card
            className={`glass-card cursor-pointer hover:shadow-md transition-all ${statusFilter === 'COMMUNICATED' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => handleStatusFilterChange(statusFilter === 'COMMUNICATED' ? 'all' : 'COMMUNICATED')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Communicated
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{communicatedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Sent to customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by case..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="FINAL">Finalized</SelectItem>
                  <SelectItem value="COMMUNICATED">Communicated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="FRAUD_CONFIRMED">Fraud Confirmed</SelectItem>
                  <SelectItem value="CLEARED">Cleared</SelectItem>
                  <SelectItem value="PARTIAL_FRAUD">Partial Fraud</SelectItem>
                  <SelectItem value="INVESTIGATION_ONGOING">Investigation Ongoing</SelectItem>
                  <SelectItem value="INSUFFICIENT_EVIDENCE">Insufficient Evidence</SelectItem>
                  <SelectItem value="REFERRED_TO_AUTHORITIES">Referred to Authorities</SelectItem>
                </SelectContent>
              </Select>
              <Select value={`${sortField}-${sortDir}`} onValueChange={(v) => {
                const [field, dir] = v.split('-') as [SortField, SortDir];
                setSortField(field);
                setSortDir(dir);
              }}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Created (Newest)</SelectItem>
                  <SelectItem value="created_at-asc">Created (Oldest)</SelectItem>
                  <SelectItem value="updated_at-desc">Updated (Newest)</SelectItem>
                  <SelectItem value="updated_at-asc">Updated (Oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Case Decisions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Case Decisions ({filteredCaseDecisions.length})
            </CardTitle>
            <CardDescription>
              All decisions made on fraud cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredCaseDecisions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No case decisions found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort('created_at')}
                    >
                      <span className="flex items-center gap-1">
                        Created <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort('updated_at')}
                    >
                      <span className="flex items-center gap-1">
                        Updated <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCaseDecisions.map((decision) => (
                    <TableRow key={decision.decision_id}>
                      <TableCell className="font-medium">
                        {decision.case_title}
                      </TableCell>
                      <TableCell>
                        <Badge className={categoryColors[decision.category]}>
                          {decision.category.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[decision.status]}>
                          {decision.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(decision.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(decision.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/cases/${decision.case_id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
