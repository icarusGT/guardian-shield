import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  AlertTriangle,
  RefreshCw,
  UserX,
} from 'lucide-react';

interface UserMultipleCases {
  user_id: string;
  full_name: string;
  total_cases: number;
  last_case_date: string;
}

export default function UsersMultipleCases() {
  const [data, setData] = useState<UserMultipleCases[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    console.log('[UsersMultipleCases] Fetching data...');

    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id, full_name');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        setData([]);
        setLoading(false);
        return;
      }

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('customer_id, user_id');

      if (customersError) {
        console.error('Error fetching customers:', customersError);
        setData([]);
        setLoading(false);
        return;
      }

      // Map user_id to customer_id
      const userToCustomerMap = new Map(
        (customersData || []).map((c) => [c.user_id, c.customer_id])
      );

      // Fetch fraud cases
      const { data: casesData, error: casesError } = await supabase
        .from('fraud_cases')
        .select('case_id, customer_id, created_at');

      if (casesError) {
        console.error('Error fetching fraud_cases:', casesError);
        setData([]);
        setLoading(false);
        return;
      }

      // Group cases by customer_id
      const customerCasesMap = new Map<number, { count: number; lastDate: string }>();
      (casesData || []).forEach((fc) => {
        const existing = customerCasesMap.get(fc.customer_id);
        if (existing) {
          customerCasesMap.set(fc.customer_id, {
            count: existing.count + 1,
            lastDate: fc.created_at > existing.lastDate ? fc.created_at : existing.lastDate,
          });
        } else {
          customerCasesMap.set(fc.customer_id, { count: 1, lastDate: fc.created_at });
        }
      });

      // Build result: users with >= 2 cases
      const result: UserMultipleCases[] = [];
      (usersData || []).forEach((user) => {
        const customerId = userToCustomerMap.get(user.user_id);
        if (customerId) {
          const caseInfo = customerCasesMap.get(customerId);
          if (caseInfo && caseInfo.count >= 2) {
            result.push({
              user_id: user.user_id,
              full_name: user.full_name,
              total_cases: caseInfo.count,
              last_case_date: caseInfo.lastDate,
            });
          }
        }
      });

      // Sort by total_cases desc
      result.sort((a, b) => b.total_cases - a.total_cases);

      setData(result);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getCaseCountColor = (count: number) => {
    if (count >= 5) return 'bg-red-100 text-red-700';
    if (count >= 3) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <UserX className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Users with Multiple Fraud Cases
                {data.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {data.length} users
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Users with 2+ fraud cases (potential repeat offenders)
              </CardDescription>
            </div>
          </div>

          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No users with multiple fraud cases found.</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Total Cases</TableHead>
                  <TableHead className="text-right">Last Case Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.user_id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium">{row.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {row.user_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={getCaseCountColor(row.total_cases)}>
                        {row.total_cases} cases
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(row.last_case_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
