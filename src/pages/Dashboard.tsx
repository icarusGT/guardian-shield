import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, FileWarning, Users, Activity, 
  AlertTriangle, CheckCircle, Clock, LogOut,
  TrendingUp, Eye
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

const severityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700'
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  UNDER_INVESTIGATION: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-green-100 text-green-700'
};

export default function Dashboard() {
  const { user, profile, loading, signOut, isAdmin, isInvestigator, isAuditor } = useAuth();
  const navigate = useNavigate();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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

    // Fetch cases
    const { data: casesData } = await supabase
      .from('fraud_cases')
      .select('case_id, title, category, severity, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (casesData) setCases(casesData as FraudCase[]);
    setLoadingData(false);
  };

  const getRoleName = (roleId: number) => {
    const roles: Record<number, string> = {
      1: 'Administrator',
      2: 'Investigator', 
      3: 'Auditor',
      4: 'Customer'
    };
    return roles[roleId] || 'User';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">FraudGuard</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{getRoleName(profile?.role_id || 4)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* KPI Cards (Admin/Auditor only) */}
        {(isAdmin || isAuditor) && kpi && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
                <FileWarning className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.total_cases}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open Cases</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.open_cases}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Closure Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{((kpi.closure_rate || 0) * 100).toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Close Time</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.avg_close_hours?.toFixed(1) || '—'}h</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cases Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8 text-muted-foreground">Loading cases...</div>
            ) : cases.length === 0 ? (
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
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.case_id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm">#{c.case_id}</td>
                        <td className="py-3 px-4 font-medium">{c.title}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{c.category.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={severityColors[c.severity]}>{c.severity}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={statusColors[c.status]}>{c.status.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
