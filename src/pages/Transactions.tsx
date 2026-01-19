import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, Search, AlertTriangle, DollarSign } from 'lucide-react';

interface Transaction {
  txn_id: number;
  customer_id: number;
  txn_amount: number;
  txn_location: string | null;
  txn_channel: string;
  occurred_at: string;
}

interface SuspiciousTransaction {
  suspicious_id: number;
  txn_id: number;
  risk_score: number;
  risk_level: string;
  reasons: string | null;
  flagged_at: string;
}

const riskColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
};

const channelColors: Record<string, string> = {
  BKASH: 'bg-pink-100 text-pink-700',
  NAGAD: 'bg-orange-100 text-orange-700',
  CARD: 'bg-purple-100 text-purple-700',
  BANK: 'bg-blue-100 text-blue-700',
  CASH: 'bg-green-100 text-green-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function Transactions() {
  const { user, loading, isAdmin, isAuditor, isInvestigator } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suspicious, setSuspicious] = useState<SuspiciousTransaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [showOnlySuspicious, setShowOnlySuspicious] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && !(isAdmin || isAuditor || isInvestigator)) {
      navigate('/dashboard');
    }
  }, [user, loading, isAdmin, isAuditor, isInvestigator, navigate]);

  useEffect(() => {
    if (user && (isAdmin || isAuditor || isInvestigator)) {
      fetchData();
    }
  }, [user, isAdmin, isAuditor, isInvestigator]);

  const fetchData = async () => {
    setLoadingData(true);

    // Fetch transactions
    const { data: txnData } = await supabase
      .from('transactions')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(200);

    if (txnData) setTransactions(txnData as Transaction[]);

    // Fetch suspicious transactions
    const { data: suspData } = await supabase
      .from('suspicious_transactions')
      .select('*')
      .order('flagged_at', { ascending: false });

    if (suspData) setSuspicious(suspData as SuspiciousTransaction[]);

    setLoadingData(false);
  };

  const suspiciousTxnIds = new Set(suspicious.map((s) => s.txn_id));
  const getSuspiciousInfo = (txnId: number) => suspicious.find((s) => s.txn_id === txnId);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.txn_id.toString().includes(search) ||
      t.txn_location?.toLowerCase().includes(search.toLowerCase());
    const matchesChannel = channelFilter === 'all' || t.txn_channel === channelFilter;
    const matchesSuspicious = !showOnlySuspicious || suspiciousTxnIds.has(t.txn_id);
    return matchesSearch && matchesChannel && matchesSuspicious;
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
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
          <h1 className="text-2xl font-bold">Transaction Monitor</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-50">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {suspicious.length} Flagged
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transactions
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Suspicious
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{suspicious.length}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Risk
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suspicious.filter((s) => s.risk_level === 'HIGH').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="BKASH">bKash</SelectItem>
                  <SelectItem value="NAGAD">Nagad</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK">Bank</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlySuspicious}
                  onChange={(e) => setShowOnlySuspicious(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm">Show only suspicious</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Transactions ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transactions found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Channel</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => {
                      const suspInfo = getSuspiciousInfo(t.txn_id);
                      return (
                        <tr
                          key={t.txn_id}
                          className={`border-b hover:bg-muted/50 transition-colors ${
                            suspInfo ? 'bg-red-50/50' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono text-sm">#{t.txn_id}</td>
                          <td className="py-3 px-4 font-medium">{formatAmount(t.txn_amount)}</td>
                          <td className="py-3 px-4">
                            <Badge className={channelColors[t.txn_channel]}>
                              {t.txn_channel}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {t.txn_location || '—'}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-sm">
                            {new Date(t.occurred_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {suspInfo ? (
                              <div className="flex flex-col gap-1">
                                <Badge className={riskColors[suspInfo.risk_level]}>
                                  {suspInfo.risk_level} ({suspInfo.risk_score})
                                </Badge>
                                {suspInfo.reasons && (
                                  <span className="text-xs text-muted-foreground">
                                    {suspInfo.reasons}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
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
      </div>
    </AppLayout>
  );
}
