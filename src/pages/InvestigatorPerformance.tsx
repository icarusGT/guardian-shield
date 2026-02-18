import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, TrendingUp, AlertTriangle, Award, Users, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

interface RatingRow {
  id: number;
  case_id: number;
  investigator_id: number;
  rating: number;
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
  const { user, loading, isAdmin, isInvestigator, profile } = useAuth();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<RatingRow[]>([]);
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

    const [ratingsRes, investigatorsRes, usersRes] = await Promise.all([
      supabase.from('case_ratings').select('*').order('created_at', { ascending: false }),
      supabase.from('investigators').select('investigator_id, badge_no, department, user_id'),
      supabase.from('users_safe').select('user_id, full_name, email'),
    ]);

    if (ratingsRes.data) setRatings(ratingsRes.data as unknown as RatingRow[]);
    if (investigatorsRes.data) setInvestigators(investigatorsRes.data as unknown as InvestigatorInfo[]);
    if (usersRes.data) setUsers(usersRes.data as unknown as UserInfo[]);

    setLoadingData(false);
  };

  const getInvestigatorName = (invId: number) => {
    const inv = investigators.find((i) => i.investigator_id === invId);
    if (!inv) return 'Unknown';
    const u = users.find((u) => u.user_id === inv.user_id);
    return u?.full_name || 'Unknown';
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    ratings.forEach((r) => {
      const d = new Date(r.created_at);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [ratings]);

  const filteredRatings = useMemo(() => {
    let filtered = ratings;
    if (selectedInvestigator !== 'all') {
      filtered = filtered.filter((r) => r.investigator_id === parseInt(selectedInvestigator));
    }
    // If investigator role, only show own ratings
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
  }, [ratings, selectedInvestigator, selectedMonth, isInvestigator, isAdmin, investigators, user]);

  const avgRating = filteredRatings.length > 0
    ? (filteredRatings.reduce((a, b) => a + b.rating, 0) / filteredRatings.length).toFixed(1)
    : '0.0';

  const lowRatedPct = filteredRatings.length > 0
    ? ((filteredRatings.filter((r) => r.rating <= 2).length / filteredRatings.length) * 100).toFixed(1)
    : '0.0';

  // Per-investigator stats
  const investigatorStats = useMemo(() => {
    const map = new Map<number, { total: number; sum: number; low: number }>();
    filteredRatings.forEach((r) => {
      const s = map.get(r.investigator_id) || { total: 0, sum: 0, low: 0 };
      s.total++;
      s.sum += r.rating;
      if (r.rating <= 2) s.low++;
      map.set(r.investigator_id, s);
    });
    return Array.from(map.entries())
      .map(([id, s]) => ({
        investigator_id: id,
        name: getInvestigatorName(id),
        avg: +(s.sum / s.total).toFixed(2),
        total: s.total,
        lowPct: +((s.low / s.total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [filteredRatings, investigators, users]);

  // Rating distribution 1-5
  const distribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    filteredRatings.forEach((r) => dist[r.rating - 1]++);
    return dist.map((count, i) => ({ rating: `${i + 1} ★`, count }));
  }, [filteredRatings]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    ratings.forEach((r) => {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const s = map.get(key) || { sum: 0, count: 0 };
      s.sum += r.rating;
      s.count++;
      map.set(key, s);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, s]) => ({
        month,
        avg: +(s.sum / s.count).toFixed(2),
      }));
  }, [ratings]);

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
            <p className="text-muted-foreground">Case satisfaction ratings & analytics</p>
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
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold">{avgRating}</p>
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
                  <p className="text-sm text-muted-foreground">Total Ratings</p>
                  <p className="text-2xl font-bold">{filteredRatings.length}</p>
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
                  <p className="text-2xl font-bold">{lowRatedPct}%</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distribution.map((_, i) => (
                      <Cell key={i} fill={distColors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Average Rating Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avg" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

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
                      <th className="text-center py-3 px-2">Cases Rated</th>
                      <th className="text-center py-3 px-2">Avg Rating</th>
                      <th className="text-center py-3 px-2">Low Rated %</th>
                      <th className="text-center py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investigatorStats.map((inv, i) => (
                      <tr key={inv.investigator_id} className="border-b last:border-0">
                        <td className="py-3 px-2">
                          {i === 0 && <span className="text-yellow-500">🥇</span>}
                          {i === 1 && <span className="text-gray-400">🥈</span>}
                          {i === 2 && <span className="text-orange-500">🥉</span>}
                          {i > 2 && <span className="text-muted-foreground">#{i + 1}</span>}
                        </td>
                        <td className="py-3 px-2 font-medium">{inv.name}</td>
                        <td className="py-3 px-2 text-center">{inv.total}</td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{inv.avg}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">{inv.lowPct}%</td>
                        <td className="py-3 px-2 text-center">
                          {inv.avg < 3.0 ? (
                            <Badge className="bg-red-100 text-red-700">Below Threshold</Badge>
                          ) : inv.avg >= 4.0 ? (
                            <Badge className="bg-green-100 text-green-700">Top Performer</Badge>
                          ) : (
                            <Badge variant="outline">Average</Badge>
                          )}
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
