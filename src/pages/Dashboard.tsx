// Last updated: 25th January 2026
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FraudHotspotsAnalytics from '@/components/analytics/FraudHotspotsAnalytics';
import ChannelSuspiciousRanking from '@/components/analytics/ChannelSuspiciousRanking';

import UsersMultipleCases from '@/components/analytics/UsersMultipleCases';
import {
  Shield,
  FileWarning,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  ArrowRight,
  DollarSign,
  Zap,
  BarChart3,
  UserCheck,
  FileText,
  ClipboardList,
  Plus,
  Gavel,
  MessageSquare,
} from 'lucide-react';

interface KPI {
  total_cases: number;
  closed_cases: number;
  closure_rate: number;
  avg_close_hours: number;
  open_cases: number;
  under_investigation_cases: number;
}

interface FraudCase {
  case_id: number;
  title: string;
  category: string;
  severity: string;
  status: string;
  created_at: string;
}

interface SuspiciousTransaction {
  suspicious_id: number;
  txn_id: number;
  risk_score: number;
  risk_level: string;
  flagged_at: string;
}

interface DecisionStats {
  draftCount: number;
  finalCount: number;
  communicatedCount: number;
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

const riskColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
};

export default function Dashboard() {
  const { user, profile, loading, isAdmin, isInvestigator, isAuditor, isCustomer } = useAuth();
  const navigate = useNavigate();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [myCases, setMyCases] = useState<FraudCase[]>([]);
  const [suspicious, setSuspicious] = useState<SuspiciousTransaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [assignedCasesCount, setAssignedCasesCount] = useState(0);
  const [decisionStats, setDecisionStats] = useState<DecisionStats>({
    draftCount: 0,
    finalCount: 0,
    communicatedCount: 0,
  });
  const [customerDecisionCount, setCustomerDecisionCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, isInvestigator]);

  const fetchData = async () => {
    setLoadingData(true);

    // Fetch KPI (only for admin/auditor)
    if (isAdmin || isAuditor) {
      const { data: kpiData } = await supabase
        .from('kpi_case_success')
        .select('*')
        .single();
      if (kpiData) setKpi(kpiData as unknown as KPI);
    }

    // Fetch suspicious transactions (for admin/auditor/investigator)
    if (isAdmin || isAuditor || isInvestigator) {
      const { data: suspData } = await supabase
        .from('suspicious_transactions')
        .select('*')
        .order('flagged_at', { ascending: false })
        .limit(10);
      if (suspData) setSuspicious(suspData as unknown as SuspiciousTransaction[]);
    }

    // Fetch decision stats for admin
    if (isAdmin) {
      const [caseDecRes, txnDecRes] = await Promise.all([
        supabase.from('case_decisions').select('status'),
        supabase.from('transaction_decisions').select('status'),
      ]);

      const allDecisions = [
        ...(caseDecRes.data || []),
        ...(txnDecRes.data || []),
      ];

      setDecisionStats({
        draftCount: allDecisions.filter((d) => d.status === 'DRAFT').length,
        finalCount: allDecisions.filter((d) => d.status === 'FINAL').length,
        communicatedCount: allDecisions.filter((d) => d.status === 'COMMUNICATED').length,
      });
    }

    // Fetch cases based on role
    if (isAdmin || isAuditor) {
      // All cases for admin/auditor
      const { data: casesData } = await supabase
        .from('fraud_cases')
        .select('case_id, title, category, severity, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (casesData) setCases(casesData as FraudCase[]);
    } else if (isInvestigator) {
      // Assigned cases for investigator
      const { data: invData } = await supabase
        .from('investigators')
        .select('investigator_id')
        .eq('user_id', user?.id)
        .single();

      if (invData) {
        const { data: assignData } = await supabase
          .from('case_assignments')
          .select('case_id')
          .eq('investigator_id', invData.investigator_id);

        if (assignData && assignData.length > 0) {
          const caseIds = assignData.map((a) => a.case_id);
          const { data: casesData } = await supabase
            .from('fraud_cases')
            .select('case_id, title, category, severity, status, created_at')
            .in('case_id', caseIds)
            .order('created_at', { ascending: false })
            .limit(10);
          if (casesData) {
            setMyCases(casesData as FraudCase[]);
            setAssignedCasesCount(casesData.length);
          }
        }
      }
    } else if (isCustomer) {
      // Customer's own cases
      const { data: customerData } = await supabase
        .from('customers')
        .select('customer_id')
        .eq('user_id', user?.id)
        .single();

      if (customerData) {
        const { data: casesData } = await supabase
          .from('fraud_cases')
          .select('case_id, title, category, severity, status, created_at')
          .eq('customer_id', customerData.customer_id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (casesData) setMyCases(casesData as FraudCase[]);

        // Fetch customer's transactions to check for decisions
        const { data: txnsData } = await supabase
          .from('transactions')
          .select('txn_id')
          .eq('customer_id', customerData.customer_id);

        const caseIds = casesData?.map((c) => c.case_id) || [];
        const txnIds = txnsData?.map((t) => t.txn_id) || [];

        // Count decisions visible to customer (FINAL or COMMUNICATED)
        let totalCustomerDecisions = 0;
        if (caseIds.length > 0) {
          const { data: caseDecisions } = await supabase
            .from('case_decisions')
            .select('decision_id')
            .in('case_id', caseIds);
          totalCustomerDecisions += caseDecisions?.length || 0;
        }
        if (txnIds.length > 0) {
          const { data: txnDecisions } = await supabase
            .from('transaction_decisions')
            .select('decision_id')
            .in('txn_id', txnIds);
          totalCustomerDecisions += txnDecisions?.length || 0;
        }
        setCustomerDecisionCount(totalCustomerDecisions);
      }
    }

    setLoadingData(false);
  };

  const getRoleName = (roleId: number) => {
    const roles: Record<number, string> = {
      1: 'Administrator',
      2: 'Investigator',
      3: 'Auditor',
      4: 'Customer',
    };
    return roles[roleId] || 'User';
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

  const displayCases = isAdmin || isAuditor ? cases : myCases;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'User'}!</h1>
            <p className="text-muted-foreground mt-1">
              {getRoleName(profile?.role_id || 4)} Dashboard
            </p>
          </div>
          <div className="flex gap-2">
            {(isAdmin || isInvestigator) && (
              <Button asChild>
                <Link to="/investigations">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Investigations
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/cases">
                <FileText className="h-4 w-4 mr-2" />
                View All Cases
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards Section */}
        {(isAdmin || isAuditor) && kpi && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Cases
                </CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileWarning className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.total_cases}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open Cases
                </CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.open_cases}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.under_investigation_cases} under investigation
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Closure Rate
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {((kpi.closure_rate || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.closed_cases} cases closed
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Close Time
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {kpi.avg_close_hours?.toFixed(1) || '—'}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average resolution</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Decisions Status */}
        {isAdmin && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-primary" />
                  <CardTitle>Decision Status Overview</CardTitle>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin-decisions">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
                  <div className="p-3 rounded-full bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{decisionStats.draftCount}</p>
                    <p className="text-sm text-muted-foreground">Draft Decisions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
                  <div className="p-3 rounded-full bg-blue-100">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{decisionStats.finalCount}</p>
                    <p className="text-sm text-muted-foreground">Finalized</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
                  <div className="p-3 rounded-full bg-green-100">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{decisionStats.communicatedCount}</p>
                    <p className="text-sm text-muted-foreground">Communicated</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role-Specific Stats */}
        {isInvestigator && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assigned Cases
                </CardTitle>
                <UserCheck className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{assignedCasesCount}</div>
                <Button variant="link" className="p-0 h-auto mt-2" asChild>
                  <Link to="/investigations">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Cases
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {myCases.filter((c) => c.status !== 'CLOSED').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {myCases.filter((c) => c.status === 'CLOSED').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Cases resolved</p>
              </CardContent>
            </Card>
          </div>
        )}

        {isCustomer && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  My Cases
                </CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{myCases.length}</div>
                <Button variant="link" className="p-0 h-auto mt-2" asChild>
                  <Link to="/cases">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open Cases
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {myCases.filter((c) => c.status === 'OPEN').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Resolved
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {myCases.filter((c) => c.status === 'CLOSED').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Cases closed</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Decisions
                </CardTitle>
                <Gavel className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{customerDecisionCount}</div>
                <Button variant="link" className="p-0 h-auto mt-2" asChild>
                  <Link to="/my-decisions">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Suspicious Transactions Alert (Admin/Auditor/Investigator) */}
        {(isAdmin || isAuditor || isInvestigator) && suspicious.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <CardTitle>Recent Suspicious Transactions</CardTitle>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/transactions">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suspicious.slice(0, 5).map((susp) => (
                  <div
                    key={susp.suspicious_id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
                  >
                    <div>
                      <p className="font-medium">Transaction #{susp.txn_id}</p>
                      <p className="text-sm text-muted-foreground">
                        Risk Score: {susp.risk_score} • Flagged{' '}
                        {new Date(susp.flagged_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={riskColors[susp.risk_level]}>{susp.risk_level}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
        </Card>
        )}

        {/* Fraud Hotspots Analytics - Admin Only */}
        {isAdmin && <FraudHotspotsAnalytics />}

        {/* Channel-wise Suspicious Ranking - Admin Only */}
        {isAdmin && <ChannelSuspiciousRanking />}

        {/* Users with Multiple Fraud Cases - Admin Only */}
        {isAdmin && <UsersMultipleCases />}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/cases" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">View Cases</CardTitle>
                    <CardDescription className="text-xs">Browse all fraud cases</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {(isAdmin || isInvestigator) && (
            <Link to="/investigations" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <ClipboardList className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Investigations</CardTitle>
                      <CardDescription className="text-xs">Manage case assignments</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}

          {(isAdmin || isAuditor || isInvestigator) && (
            <Link to="/transactions" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Activity className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Transactions</CardTitle>
                      <CardDescription className="text-xs">Monitor transactions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}

          {isAdmin && (
            <Link to="/users" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Users className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">User Management</CardTitle>
                      <CardDescription className="text-xs">Manage users & roles</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>

        {/* Recent Cases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <CardTitle>
                  {isAdmin || isAuditor ? 'Recent Cases' : 'My Cases'}
                </CardTitle>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/cases">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8 text-muted-foreground">Loading cases...</div>
            ) : displayCases.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No cases found</p>
                <Button asChild>
                  <Link to="/cases/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Case
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Title
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Severity
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayCases.map((c) => (
                      <tr
                        key={c.case_id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-sm">#{c.case_id}</td>
                        <td className="py-3 px-4 font-medium">{c.title}</td>
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
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" asChild>
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
