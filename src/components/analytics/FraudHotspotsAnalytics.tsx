import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Smartphone,
  CreditCard,
  Building2,
  Banknote,
  CircleDollarSign,
  MapPin,
} from 'lucide-react';

interface ChannelStats {
  channel: string;
  count: number;
  avgRiskScore: number;
  totalAmount: number;
  highRiskCount: number;
}

interface RecipientStats {
  recipient: string;
  count: number;
  avgRiskScore: number;
  totalAmount: number;
  riskLevel: string;
}

const channelIcons: Record<string, React.ReactNode> = {
  BKASH: <Smartphone className="h-4 w-4 text-pink-500" />,
  NAGAD: <Smartphone className="h-4 w-4 text-orange-500" />,
  CARD: <CreditCard className="h-4 w-4 text-blue-500" />,
  BANK: <Building2 className="h-4 w-4 text-green-600" />,
  CASH: <Banknote className="h-4 w-4 text-emerald-500" />,
  OTHER: <CircleDollarSign className="h-4 w-4 text-gray-500" />,
};

const channelColors: Record<string, string> = {
  BKASH: 'bg-pink-100 text-pink-700 border-pink-200',
  NAGAD: 'bg-orange-100 text-orange-700 border-orange-200',
  CARD: 'bg-blue-100 text-blue-700 border-blue-200',
  BANK: 'bg-green-100 text-green-700 border-green-200',
  CASH: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  OTHER: 'bg-gray-100 text-gray-700 border-gray-200',
};

const riskColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
};

export default function FraudHotspotsAnalytics() {
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [recipientStats, setRecipientStats] = useState<RecipientStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSuspicious, setTotalSuspicious] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    try {
      // Fetch all suspicious transactions with their transaction details
      const { data: suspData, error: suspError } = await supabase
        .from('suspicious_transactions')
        .select('txn_id, risk_score, risk_level');

      if (suspError) {
        console.error('Error fetching suspicious transactions:', suspError);
        setLoading(false);
        return;
      }

      if (!suspData || suspData.length === 0) {
        setLoading(false);
        return;
      }

      setTotalSuspicious(suspData.length);

      // Get transaction IDs
      const txnIds = suspData.map((s) => s.txn_id);

      // Fetch corresponding transactions
      const { data: txnData, error: txnError } = await supabase
        .from('transactions')
        .select('txn_id, txn_channel, txn_amount, txn_location, recipient_account')
        .in('txn_id', txnIds);

      if (txnError) {
        console.error('Error fetching transactions:', txnError);
        setLoading(false);
        return;
      }

      // Create a map for quick lookup
      const txnMap = new Map(txnData?.map((t) => [t.txn_id, t]) || []);

      // A) Channel-wise statistics
      const channelMap = new Map<string, { count: number; totalScore: number; totalAmount: number; highRiskCount: number }>();

      suspData.forEach((susp) => {
        const txn = txnMap.get(susp.txn_id);
        if (!txn) return;

        const channel = txn.txn_channel || 'OTHER';
        const existing = channelMap.get(channel) || { count: 0, totalScore: 0, totalAmount: 0, highRiskCount: 0 };

        channelMap.set(channel, {
          count: existing.count + 1,
          totalScore: existing.totalScore + (susp.risk_score || 0),
          totalAmount: existing.totalAmount + (Number(txn.txn_amount) || 0),
          highRiskCount: existing.highRiskCount + (susp.risk_level === 'HIGH' ? 1 : 0),
        });
      });

      const channelStatsArray: ChannelStats[] = Array.from(channelMap.entries())
        .map(([channel, stats]) => ({
          channel,
          count: stats.count,
          avgRiskScore: Math.round(stats.totalScore / stats.count),
          totalAmount: stats.totalAmount,
          highRiskCount: stats.highRiskCount,
        }))
        .sort((a, b) => b.count - a.count);

      setChannelStats(channelStatsArray);

      // B) Top Recipients (using recipient_account field, fallback to txn_location)
      const recipientMap = new Map<string, { count: number; totalScore: number; totalAmount: number; riskLevels: string[] }>();

      suspData.forEach((susp) => {
        const txn = txnMap.get(susp.txn_id);
        if (!txn) return;

        // Prefer recipient_account, fallback to txn_location
        const recipient = (txn as any).recipient_account || txn.txn_location || 'Unknown';
        const existing = recipientMap.get(recipient) || { count: 0, totalScore: 0, totalAmount: 0, riskLevels: [] };

        recipientMap.set(recipient, {
          count: existing.count + 1,
          totalScore: existing.totalScore + (susp.risk_score || 0),
          totalAmount: existing.totalAmount + (Number(txn.txn_amount) || 0),
          riskLevels: [...existing.riskLevels, susp.risk_level],
        });
      });

      const recipientStatsArray: RecipientStats[] = Array.from(recipientMap.entries())
        .map(([recipient, stats]) => {
          // Determine dominant risk level
          const highCount = stats.riskLevels.filter((r) => r === 'HIGH').length;
          const medCount = stats.riskLevels.filter((r) => r === 'MEDIUM').length;
          let dominantRisk = 'LOW';
          if (highCount > 0) dominantRisk = 'HIGH';
          else if (medCount > 0) dominantRisk = 'MEDIUM';

          return {
            recipient,
            count: stats.count,
            avgRiskScore: Math.round(stats.totalScore / stats.count),
            totalAmount: stats.totalAmount,
            riskLevel: dominantRisk,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 recipients

      setRecipientStats(recipientStatsArray);
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMaxCount = () => {
    if (channelStats.length === 0) return 1;
    return Math.max(...channelStats.map((c) => c.count));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="glass-card">
          <CardContent className="p-8 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (totalSuspicious === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Suspicious Transactions</h3>
          <p className="text-muted-foreground mt-1">
            Analytics will appear once suspicious transactions are detected.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-500/10">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Fraud Hotspots Analytics</h2>
          <p className="text-sm text-muted-foreground">
            {totalSuspicious} suspicious transactions analyzed
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A) Channel-wise Suspicious Ranking */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Channel-wise Suspicious Ranking</CardTitle>
            </div>
            <CardDescription>
              Which payment channels have the most flagged transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {channelStats.map((stat, index) => (
              <div key={stat.channel} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Badge variant="outline" className={channelColors[stat.channel]}>
                      {channelIcons[stat.channel]}
                      <span className="ml-1">{stat.channel}</span>
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{stat.count}</span>
                    <span className="text-muted-foreground text-sm ml-1">flagged</span>
                  </div>
                </div>

                <Progress
                  value={(stat.count / getMaxCount()) * 100}
                  className="h-2"
                />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Avg Risk Score: <strong className="text-foreground">{stat.avgRiskScore}</strong>
                  </span>
                  <span>
                    Total: <strong className="text-foreground">{formatAmount(stat.totalAmount)}</strong>
                  </span>
                </div>

                {stat.highRiskCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      {stat.highRiskCount} HIGH risk
                    </Badge>
                  </div>
                )}
              </div>
            ))}

            {channelStats.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No channel data available</p>
            )}
          </CardContent>
        </Card>

        {/* B) Top Recipients */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Top Flagged Recipients</CardTitle>
            </div>
            <CardDescription>
              Recipient accounts with the most suspicious transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recipientStats.map((stat, index) => (
                <div
                  key={stat.recipient}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium truncate max-w-[150px]" title={stat.recipient}>
                        {stat.recipient}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.count} reports • Avg Score: {stat.avgRiskScore}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge className={riskColors[stat.riskLevel]}>{stat.riskLevel}</Badge>
                    <p className="text-sm font-medium mt-1">{formatAmount(stat.totalAmount)}</p>
                  </div>
                </div>
              ))}

              {recipientStats.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No recipient data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Flagged</p>
            <p className="text-2xl font-bold">{totalSuspicious}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Most Active Channel</p>
            <p className="text-2xl font-bold">{channelStats[0]?.channel || '—'}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unique Recipients</p>
            <p className="text-2xl font-bold">{recipientStats.length}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Highest Avg Risk</p>
            <p className="text-2xl font-bold">
              {channelStats.length > 0
                ? Math.max(...channelStats.map((c) => c.avgRiskScore))
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
