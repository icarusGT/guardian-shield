import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, TrendingUp, AlertTriangle, Award, Users, BarChart3, MessageSquare, Shield, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface CaseRatingRow {
  id: number;
  case_id: number;
  investigator_id: number;
  rating: number;
  feedback_comment: string | null;
  flagged_for_review: boolean;
  created_at: string;
}

interface InvestigatorRatingRow {
  id: number;
  case_id: number;
  investigator_id: number;
  overall_rating: number;
  communication_rating: number;
  speed_rating: number;
  professionalism_rating: number;
  feedback_comment: string | null;
  flagged_for_review: boolean;
  created_at: string;
}

interface InvestigatorInfo {
  investigator_id: number;
  badge_no: string | null;
  department: string | null;
  user_id: string;
}

interface UserInfo {
  user_id: string;
  full_name: string;
  email: string;
}

export default function InvestigatorPerformance() {
  const { user, loading, isAdmin, isInvestigator } = useAuth();
  const navigate = useNavigate();
  const [caseRatings, setCaseRatings] = useState<CaseRatingRow[]>([]);
  const [invRatings, setInvRatings] = useState<InvestigatorRatingRow[]>([]);
  const [investigators, setInvestigators] = useState<InvestigatorInfo[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (!loading && user && !isAdmin && !isInvestigator) navigate('/dashboard');
  }, [user, loading, isAdmin, isInvestigator]);

  useEffect(() => {
    if (user && (isAdmin || isInvestigator)) fetchData();
  }, [user, isAdmin, isInvestigator]);

  const fetchData = async () => {
    setLoadingData(true);
    const [crRes, irRes, invRes, usersRes] = await Promise.all([
      supabase.from('case_ratings').select('*').order('created_at', { ascending: false }),
      supabase.from('investigator_ratings').select('*').order('created_at', { ascending: false }),
      supabase.from('investigators').select('investigator_id, badge_no, department, user_id'),
      supabase.from('users_safe').select('user_id, full_name, email'),
    ]);
    if (crRes.data) setCaseRatings(crRes.data as unknown as CaseRatingRow[]);
    if (irRes.data) setInvRatings(irRes.data as unknown as InvestigatorRatingRow[]);
    if (invRes.data) setInvestigators(invRes.data as unknown as InvestigatorInfo[]);
    if (usersRes.data) setUsers(usersRes.data as unknown as UserInfo[]);
    setLoadingData(false);
  };

  const getInvestigatorName = (invId: number) => {
    const inv = investigators.find((i) => i.investigator_id === invId);
    if (!inv) return 'Unknown';
    const u = users.find((u) => u.user_id === inv.user_id);
    return u?.full_name || 'Unknown';
  };

  const getBadgeNo = (invId: number) => {
    return investigators.find((i) => i.investigator_id === invId)?.badge_no || null;
  };

  // Filter helpers
  const filterByInvAndMonth = <T extends { investigator_id: number; created_at: string }>(data: T[]) => {
    let filtered = data;
    if (selectedInvestigator !== 'all') {
      filtered = filtered.filter((r) => r.investigator_id === parseInt(selectedInvestigator));
    }
    if (isInvestigator && !isAdmin) {
      const myInv = investigators.find((i) => i.user_id === user?.id);
      if (myInv) filtered = filtered.filter((r) => r.investigator_id === myInv.investigator_id);
    }
    if (selectedMonth !== 'all') {
      filtered = filtered.filter((r) => {
        const d = new Date(r.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
      });
    }
    return filtered;
  };

  const filteredCaseRatings = useMemo(() => filterByInvAndMonth(caseRatings), [caseRatings, selectedInvestigator, selectedMonth, isInvestigator, isAdmin, investigators, user]);
  const filteredInvRatings = useMemo(() => filterByInvAndMonth(invRatings), [invRatings, selectedInvestigator, selectedMonth, isInvestigator, isAdmin, investigators, user]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    [...caseRatings, ...invRatings].forEach((r) => {
      const d = new Date(r.created_at);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [caseRatings, invRatings]);

  // Case rating stats
  const caseAvgRating = filteredCaseRatings.length > 0
    ? (filteredCaseRatings.reduce((a, b) => a + b.rating, 0) / filteredCaseRatings.length).toFixed(1) : '0.0';
  const caseLowPct = filteredCaseRatings.length > 0
    ? ((filteredCaseRatings.filter((r) => r.rating <= 2).length / filteredCaseRatings.length) * 100).toFixed(1) : '0.0';

  // Investigator rating stats
  const invAvgOverall = filteredInvRatings.length > 0
    ? (filteredInvRatings.reduce((a, b) => a + b.overall_rating, 0) / filteredInvRatings.length).toFixed(1) : '0.0';
  const invAvgComm = filteredInvRatings.length > 0
    ? (filteredInvRatings.reduce((a, b) => a + b.communication_rating, 0) / filteredInvRatings.length).toFixed(1) : '0.0';
  const invAvgSpeed = filteredInvRatings.length > 0
    ? (filteredInvRatings.reduce((a, b) => a + b.speed_rating, 0) / filteredInvRatings.length).toFixed(1) : '0.0';
  const invAvgProf = filteredInvRatings.length > 0
    ? (filteredInvRatings.reduce((a, b) => a + b.professionalism_rating, 0) / filteredInvRatings.length).toFixed(1) : '0.0';

  // Per-investigator combined stats
  const investigatorStats = useMemo(() => {
    const map = new Map<number, {
      caseTotal: number; caseSum: number; caseLow: number;
      invTotal: number; overallSum: number; commSum: number; speedSum: number; profSum: number; invLow: number;
    }>();

    filteredCaseRatings.forEach((r) => {
      const s = map.get(r.investigator_id) || { caseTotal: 0, caseSum: 0, caseLow: 0, invTotal: 0, overallSum: 0, commSum: 0, speedSum: 0, profSum: 0, invLow: 0 };
      s.caseTotal++;
      s.caseSum += r.rating;
      if (r.rating <= 2) s.caseLow++;
      map.set(r.investigator_id, s);
    });

    filteredInvRatings.forEach((r) => {
      const s = map.get(r.investigator_id) || { caseTotal: 0, caseSum: 0, caseLow: 0, invTotal: 0, overallSum: 0, commSum: 0, speedSum: 0, profSum: 0, invLow: 0 };
      s.invTotal++;
      s.overallSum += r.overall_rating;
      s.commSum += r.communication_rating;
      s.speedSum += r.speed_rating;
      s.profSum += r.professionalism_rating;
      if (r.overall_rating <= 2) s.invLow++;
      map.set(r.investigator_id, s);
    });

    return Array.from(map.entries())
      .map(([id, s]) => ({
        investigator_id: id,
        name: getInvestigatorName(id),
        badge: getBadgeNo(id),
        caseAvg: s.caseTotal > 0 ? +(s.caseSum / s.caseTotal).toFixed(2) : null,
        caseTotal: s.caseTotal,
        caseLowPct: s.caseTotal > 0 ? +((s.caseLow / s.caseTotal) * 100).toFixed(1) : 0,
        invAvg: s.invTotal > 0 ? +(s.overallSum / s.invTotal).toFixed(2) : null,
        commAvg: s.invTotal > 0 ? +(s.commSum / s.invTotal).toFixed(2) : null,
        speedAvg: s.invTotal > 0 ? +(s.speedSum / s.invTotal).toFixed(2) : null,
        profAvg: s.invTotal > 0 ? +(s.profSum / s.invTotal).toFixed(2) : null,
        invTotal: s.invTotal,
        invLowPct: s.invTotal > 0 ? +((s.invLow / s.invTotal) * 100).toFixed(1) : 0,
        // Combined weighted average
        combinedAvg: (() => {
          const total = s.caseTotal + s.invTotal;
          if (total === 0) return 0;
          return +((s.caseSum + s.overallSum) / total).toFixed(2);
        })(),
      }))
      .sort((a, b) => b.combinedAvg - a.combinedAvg);
  }, [filteredCaseRatings, filteredInvRatings, investigators, users]);

  // Rating distribution (case ratings)
  const caseDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    filteredCaseRatings.forEach((r) => dist[r.rating - 1]++);
    return dist.map((count, i) => ({ rating: `${i + 1} ★`, count }));
  }, [filteredCaseRatings]);

  // Rating distribution (investigator overall)
  const invDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    filteredInvRatings.forEach((r) => dist[r.overall_rating - 1]++);
    return dist.map((count, i) => ({ rating: `${i + 1} ★`, count }));
  }, [filteredInvRatings]);

  // Category-wise radar data
  const radarData = useMemo(() => [
    { category: 'Overall', value: parseFloat(invAvgOverall) },
    { category: 'Communication', value: parseFloat(invAvgComm) },
    { category: 'Speed', value: parseFloat(invAvgSpeed) },
    { category: 'Professionalism', value: parseFloat(invAvgProf) },
  ], [invAvgOverall, invAvgComm, invAvgSpeed, invAvgProf]);

  // Monthly trend (combined)
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { caseSum: number; caseCount: number; invSum: number; invCount: number }>();
    caseRatings.forEach((r) => {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const s = map.get(key) || { caseSum: 0, caseCount: 0, invSum: 0, invCount: 0 };
      s.caseSum += r.rating;
      s.caseCount++;
      map.set(key, s);
    });
    invRatings.forEach((r) => {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const s = map.get(key) || { caseSum: 0, caseCount: 0, invSum: 0, invCount: 0 };
      s.invSum += r.overall_rating;
      s.invCount++;
      map.set(key, s);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, s]) => ({
        month,
        caseAvg: s.caseCount > 0 ? +(s.caseSum / s.caseCount).toFixed(2) : null,
        invAvg: s.invCount > 0 ? +(s.invSum / s.invCount).toFixed(2) : null,
      }));
  }, [caseRatings, invRatings]);

  const distColors = ['hsl(0, 84%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(38, 92%, 50%)', 'hsl(80, 60%, 45%)', 'hsl(142, 76%, 36%)'];

  if (loading || loadingData) {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Investigator Performance</h1>
            <p className="text-muted-foreground">Case & investigator satisfaction analytics</p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Select value={selectedInvestigator} onValueChange={setSelectedInvestigator}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Investigators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Investigators</SelectItem>
                  {investigators.map((inv) => (
                    <SelectItem key={inv.investigator_id} value={String(inv.investigator_id)}>
                      {getInvestigatorName(inv.investigator_id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {availableMonths.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Case Avg Rating</p>
                  <p className="text-2xl font-bold">{caseAvgRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Investigator Avg</p>
                  <p className="text-2xl font-bold">{invAvgOverall}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Rated %</p>
                  <p className="text-2xl font-bold">{caseLowPct}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Performer</p>
                  <p className="text-lg font-bold truncate">
                    {investigatorStats[0]?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Case vs Investigator Ratings */}
        <Tabs defaultValue="investigator" className="space-y-4">
          <TabsList>
            <TabsTrigger value="case">Case Ratings</TabsTrigger>
            <TabsTrigger value="investigator">Investigator Ratings</TabsTrigger>
          </TabsList>

          <TabsContent value="case" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Case Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={caseDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {caseDistribution.map((_, i) => (
                          <Cell key={i} fill={distColors[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Average Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="caseAvg" name="Case Avg" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="investigator" className="space-y-6">
            {/* Category Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-xs text-muted-foreground">Overall</p>
                  <p className="text-xl font-bold">{invAvgOverall}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <MessageSquare className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-xs text-muted-foreground">Communication</p>
                  <p className="text-xl font-bold">{invAvgComm}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Zap className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-xs text-muted-foreground">Speed</p>
                  <p className="text-xl font-bold">{invAvgSpeed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Shield className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xs text-muted-foreground">Professionalism</p>
                  <p className="text-xl font-bold">{invAvgProf}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredInvRatings.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                        <Radar name="Avg" dataKey="value" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Overall Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={invDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {invDistribution.map((_, i) => (
                          <Cell key={i} fill={distColors[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend for investigator ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Investigator Rating Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="caseAvg" name="Case Avg" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="invAvg" name="Investigator Avg" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Investigator Rankings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              Investigator Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {investigatorStats.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No ratings yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Rank</th>
                      <th className="text-left py-3 px-2">Investigator</th>
                      <th className="text-center py-3 px-2">Case Avg</th>
                      <th className="text-center py-3 px-2">Overall</th>
                      <th className="text-center py-3 px-2">Comm.</th>
                      <th className="text-center py-3 px-2">Speed</th>
                      <th className="text-center py-3 px-2">Prof.</th>
                      <th className="text-center py-3 px-2">Total</th>
                      <th className="text-center py-3 px-2">Low %</th>
                      <th className="text-center py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investigatorStats.map((inv, i) => {
                      const flagged = inv.combinedAvg < 3.0 || inv.invLowPct > 20;
                      return (
                        <tr key={inv.investigator_id} className="border-b last:border-0">
                          <td className="py-3 px-2">
                            {i === 0 && <span className="text-yellow-500">🥇</span>}
                            {i === 1 && <span className="text-gray-400">🥈</span>}
                            {i === 2 && <span className="text-orange-500">🥉</span>}
                            {i > 2 && <span className="text-muted-foreground">#{i + 1}</span>}
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <span className="font-medium">{inv.name}</span>
                              {inv.badge && <span className="text-xs text-muted-foreground ml-1">({inv.badge})</span>}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            {inv.caseAvg !== null ? (
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span>{inv.caseAvg}</span>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-2 text-center font-medium">{inv.invAvg ?? '—'}</td>
                          <td className="py-3 px-2 text-center">{inv.commAvg ?? '—'}</td>
                          <td className="py-3 px-2 text-center">{inv.speedAvg ?? '—'}</td>
                          <td className="py-3 px-2 text-center">{inv.profAvg ?? '—'}</td>
                          <td className="py-3 px-2 text-center">{inv.caseTotal + inv.invTotal}</td>
                          <td className="py-3 px-2 text-center">{inv.invLowPct}%</td>
                          <td className="py-3 px-2 text-center">
                            {flagged ? (
                              <Badge className="bg-red-100 text-red-700">Flagged</Badge>
                            ) : inv.combinedAvg >= 4.0 ? (
                              <Badge className="bg-green-100 text-green-700">Top Performer</Badge>
                            ) : (
                              <Badge variant="outline">Average</Badge>
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
