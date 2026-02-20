import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Smartphone,
  CreditCard,
  Building2,
  Banknote,
  CircleDollarSign,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface ChannelRanking {
  channel: string;
  total_txn: number;
  suspicious_txn: number;
  avg_risk_score: number;
  suspicious_rate_pct: number;
}

interface ChannelSeverityRanking {
  channel: string;
  severity: string;
  total_txn: number;
  suspicious_txn: number;
  avg_risk_score: number;
  suspicious_rate_pct: number;
}

type DateFilter = '7days' | '30days' | 'all';

const channelIcons: Record<string, React.ReactNode> = {
  BKASH: <Smartphone className="h-4 w-4 text-pink-500" />,
  NAGAD: <Smartphone className="h-4 w-4 text-orange-500" />,
  CARD: <CreditCard className="h-4 w-4 text-blue-500" />,
  BANK: <Building2 className="h-4 w-4 text-green-600" />,
  CASH: <Banknote className="h-4 w-4 text-emerald-500" />,
  OTHER: <CircleDollarSign className="h-4 w-4 text-muted-foreground" />,
};

const channelColors: Record<string, string> = {
  BKASH: 'bg-pink-100 text-pink-700 border-pink-200',
  NAGAD: 'bg-orange-100 text-orange-700 border-orange-200',
  CARD: 'bg-blue-100 text-blue-700 border-blue-200',
  BANK: 'bg-green-100 text-green-700 border-green-200',
  CASH: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  OTHER: 'bg-muted text-muted-foreground border-muted',
};

const severityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
  'No Case': 'bg-muted text-muted-foreground',
};

export default function ChannelSuspiciousRanking() {
  const [channelData, setChannelData] = useState<ChannelRanking[]>([]);
  const [severityData, setSeverityData] = useState<ChannelSeverityRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [groupBySeverity, setGroupBySeverity] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateFilter, groupBySeverity]);

  const fetchData = async () => {
    setLoading(true);
    console.log('[ChannelSuspiciousRanking] Fetching data with filter:', dateFilter, 'groupBySeverity:', groupBySeverity);

    try {
      // Calculate date range based on filter
      let fromDate: string | null = null;
      if (dateFilter === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        fromDate = d.toISOString();
      } else if (dateFilter === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        fromDate = d.toISOString();
      }

      // Fetch transactions (with or without date filter)
      let txnQuery = supabase
        .from('transactions')
        .select('txn_id, txn_channel, customer_id, occurred_at, risk_score, risk_level');

      if (fromDate) {
        txnQuery = txnQuery.gte('occurred_at', fromDate);
      }

      const { data: txnData, error: txnError } = await txnQuery;

      if (txnError) {
        console.error('Error fetching transactions:', txnError);
        setChannelData([]);
        setSeverityData([]);
        setLoading(false);
        return;
      }

      if (!txnData || txnData.length === 0) {
        setChannelData([]);
        setSeverityData([]);
        setLoading(false);
        return;
      }

      const txnIds = txnData.map((t) => t.txn_id);

      // Use risk data directly from transactions table (risk_level is lowercase: 'suspicious', 'high', 'low')
      // No need to query suspicious_transactions — transactions.risk_level is the source of truth
      const txnRiskMap = new Map(
        txnData.map((t) => [t.txn_id, { risk_score: (t as any).risk_score || 0, risk_level: (t as any).risk_level || 'low' }])
      );

      if (groupBySeverity) {
        // Also fetch case_transactions and fraud_cases for severity breakdown
        const { data: caseTransData, error: ctError } = await supabase
          .from('case_transactions')
          .select('txn_id, case_id')
          .in('txn_id', txnIds);

        if (ctError) {
          console.error('Error fetching case_transactions:', ctError);
        }

        const caseIds = [...new Set((caseTransData || []).map((ct) => ct.case_id))];

        let caseSeverityMap = new Map<number, string>();
        if (caseIds.length > 0) {
          const { data: casesData, error: casesError } = await supabase
            .from('fraud_cases')
            .select('case_id, severity')
            .in('case_id', caseIds);

          if (casesError) {
            console.error('Error fetching fraud_cases:', casesError);
          } else if (casesData) {
            caseSeverityMap = new Map(casesData.map((c) => [c.case_id, c.severity]));
          }
        }

        const txnToCaseMap = new Map(
          (caseTransData || []).map((ct) => [ct.txn_id, ct.case_id])
        );

        // Aggregate by channel + severity
        const aggregateMap = new Map<string, {
          total: number;
          suspicious: number;
          totalScore: number;
          scoreCount: number;
        }>();

        txnData.forEach((txn) => {
          const channel = txn.txn_channel || 'OTHER';
          const caseId = txnToCaseMap.get(txn.txn_id);
          const severity = caseId ? (caseSeverityMap.get(caseId) || 'No Case') : 'No Case';
          const suspInfo = txnRiskMap.get(txn.txn_id);

          const key = `${channel}|${severity}`;
          const existing = aggregateMap.get(key) || { total: 0, suspicious: 0, totalScore: 0, scoreCount: 0 };

          const isSuspicious = suspInfo && (suspInfo.risk_level === 'suspicious' || suspInfo.risk_level === 'high');

          aggregateMap.set(key, {
            total: existing.total + 1,
            suspicious: existing.suspicious + (isSuspicious ? 1 : 0),
            totalScore: existing.totalScore + (suspInfo?.risk_score || 0),
            scoreCount: existing.scoreCount + (suspInfo ? 1 : 0),
          });
        });

        // Convert to array
        const result: ChannelSeverityRanking[] = Array.from(aggregateMap.entries())
          .map(([key, stats]) => {
            const [channel, severity] = key.split('|');
            return {
              channel,
              severity,
              total_txn: stats.total,
              suspicious_txn: stats.suspicious,
              avg_risk_score: stats.scoreCount > 0 ? Math.round((stats.totalScore / stats.scoreCount) * 100) / 100 : 0,
              suspicious_rate_pct: stats.total > 0 ? Math.round((stats.suspicious / stats.total) * 10000) / 100 : 0,
            };
          })
          .sort((a, b) => b.suspicious_txn - a.suspicious_txn || b.avg_risk_score - a.avg_risk_score);

        setSeverityData(result);
      } else {
        // Aggregate by channel only
        const channelMap = new Map<
          string,
          { total: number; suspicious: number; totalScore: number; suspCount: number }
        >();

        txnData.forEach((txn) => {
          const channel = txn.txn_channel || 'OTHER';
          const existing = channelMap.get(channel) || { total: 0, suspicious: 0, totalScore: 0, suspCount: 0 };
          const suspInfo = txnRiskMap.get(txn.txn_id);

          const isSuspicious = suspInfo && (suspInfo.risk_level === 'suspicious' || suspInfo.risk_level === 'high');

          channelMap.set(channel, {
            total: existing.total + 1,
            suspicious: existing.suspicious + (isSuspicious ? 1 : 0),
            totalScore: existing.totalScore + (suspInfo?.risk_score || 0),
            suspCount: existing.suspCount + (suspInfo ? 1 : 0),
          });
        });

        const result: ChannelRanking[] = Array.from(channelMap.entries())
          .map(([channel, stats]) => ({
            channel,
            total_txn: stats.total,
            suspicious_txn: stats.suspicious,
            avg_risk_score: stats.suspCount > 0 ? Math.round((stats.totalScore / stats.suspCount) * 100) / 100 : 0,
            suspicious_rate_pct:
              stats.total > 0 ? Math.round((stats.suspicious / stats.total) * 10000) / 100 : 0,
          }))
          .sort((a, b) => b.suspicious_txn - a.suspicious_txn || b.avg_risk_score - a.avg_risk_score);

        setChannelData(result);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      setChannelData([]);
      setSeverityData([]);
    } finally {
      setLoading(false);
    }
  };

  const getRateColor = (rate: number) => {
    if (rate >= 50) return 'text-red-600 font-bold';
    if (rate >= 25) return 'text-amber-600 font-semibold';
    if (rate >= 10) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 font-bold';
    if (score >= 50) return 'text-amber-600 font-semibold';
    return 'text-muted-foreground';
  };

  const totalTransactions = groupBySeverity
    ? severityData.reduce((sum, d) => sum + d.total_txn, 0)
    : channelData.reduce((sum, d) => sum + d.total_txn, 0);

  const totalSuspicious = groupBySeverity
    ? severityData.reduce((sum, d) => sum + d.suspicious_txn, 0)
    : channelData.reduce((sum, d) => sum + d.suspicious_txn, 0);

  const dataEmpty = groupBySeverity ? severityData.length === 0 : channelData.length === 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <BarChart3 className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Suspicious by Channel
                {totalSuspicious > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {totalSuspicious} flagged
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Channel-wise suspicious transaction ranking
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="group-severity"
                checked={groupBySeverity}
                onCheckedChange={setGroupBySeverity}
              />
              <Label htmlFor="group-severity" className="text-sm cursor-pointer">
                Group by Severity
              </Label>
            </div>

            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : dataEmpty ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No transaction data available for the selected period.</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {!groupBySeverity && <TableHead className="w-12">#</TableHead>}
                    <TableHead>Channel</TableHead>
                    {groupBySeverity && <TableHead>Severity</TableHead>}
                    <TableHead className="text-right">Total Txn</TableHead>
                    <TableHead className="text-right">Suspicious Txn</TableHead>
                    <TableHead className="text-right">Avg Risk Score</TableHead>
                    <TableHead className="text-right">Suspicious Rate (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupBySeverity
                    ? severityData.map((row, index) => (
                        <TableRow key={`${row.channel}-${row.severity}-${index}`} className="hover:bg-muted/30">
                          <TableCell>
                            <Badge variant="outline" className={`${channelColors[row.channel]} gap-1`}>
                              {channelIcons[row.channel]}
                              {row.channel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={severityColors[row.severity] || severityColors['No Case']}>
                              {row.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{row.total_txn}</TableCell>
                          <TableCell className="text-right">
                            {row.suspicious_txn > 0 ? (
                              <Badge variant="destructive">{row.suspicious_txn}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-right ${getScoreColor(row.avg_risk_score)}`}>
                            {row.avg_risk_score > 0 ? row.avg_risk_score.toFixed(2) : '—'}
                          </TableCell>
                          <TableCell className={`text-right ${getRateColor(row.suspicious_rate_pct)}`}>
                            {row.suspicious_rate_pct > 0 ? `${row.suspicious_rate_pct.toFixed(2)}%` : '0%'}
                          </TableCell>
                        </TableRow>
                      ))
                    : channelData.map((row, index) => (
                        <TableRow key={row.channel} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${channelColors[row.channel]} gap-1`}>
                              {channelIcons[row.channel]}
                              {row.channel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{row.total_txn}</TableCell>
                          <TableCell className="text-right">
                            {row.suspicious_txn > 0 ? (
                              <Badge variant="destructive">{row.suspicious_txn}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-right ${getScoreColor(row.avg_risk_score)}`}>
                            {row.avg_risk_score > 0 ? row.avg_risk_score.toFixed(2) : '—'}
                          </TableCell>
                          <TableCell className={`text-right ${getRateColor(row.suspicious_rate_pct)}`}>
                            {row.suspicious_rate_pct > 0 ? `${row.suspicious_rate_pct.toFixed(2)}%` : '0%'}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary footer */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                Total: <strong className="text-foreground">{totalTransactions}</strong> transactions
              </span>
              <span>•</span>
              <span>
                Flagged: <strong className="text-foreground">{totalSuspicious}</strong> suspicious
              </span>
              {totalTransactions > 0 && (
                <>
                  <span>•</span>
                  <span>
                    Overall Rate:{' '}
                    <strong className="text-foreground">
                      {((totalSuspicious / totalTransactions) * 100).toFixed(2)}%
                    </strong>
                  </span>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
