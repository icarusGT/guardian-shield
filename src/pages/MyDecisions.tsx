// Last updated: 25th January 2026
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Gavel,
  FileText,
  Activity,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  RefreshCw,
  Info,
} from 'lucide-react';

interface CaseDecision {
  decision_id: number;
  case_id: number;
  category: string;
  status: string;
  customer_message: string | null;
  created_at: string;
  updated_at: string;
  case_title?: string;
  case_severity?: string;
}

interface TransactionDecision {
  decision_id: number;
  txn_id: number;
  category: string;
  status: string;
  customer_message: string | null;
  created_at: string;
  updated_at: string;
  txn_amount?: number;
  txn_channel?: string;
}

const categoryLabels: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  FRAUD_CONFIRMED: {
    label: 'Fraud Confirmed',
    icon: AlertCircle,
    color: 'text-red-600',
  },
  CLEARED: {
    label: 'Cleared - No Fraud',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  PARTIAL_FRAUD: {
    label: 'Partial Fraud Detected',
    icon: AlertCircle,
    color: 'text-amber-600',
  },
  INVESTIGATION_ONGOING: {
    label: 'Investigation Ongoing',
    icon: Info,
    color: 'text-blue-600',
  },
  INSUFFICIENT_EVIDENCE: {
    label: 'Insufficient Evidence',
    icon: Info,
    color: 'text-gray-600',
  },
  REFERRED_TO_AUTHORITIES: {
    label: 'Referred to Authorities',
    icon: AlertCircle,
    color: 'text-purple-600',
  },
};

const categoryColors: Record<string, string> = {
  FRAUD_CONFIRMED: 'bg-red-100 text-red-700 border-red-200',
  CLEARED: 'bg-green-100 text-green-700 border-green-200',
  PARTIAL_FRAUD: 'bg-amber-100 text-amber-700 border-amber-200',
  INVESTIGATION_ONGOING: 'bg-blue-100 text-blue-700 border-blue-200',
  INSUFFICIENT_EVIDENCE: 'bg-gray-100 text-gray-700 border-gray-200',
  REFERRED_TO_AUTHORITIES: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function MyDecisions() {
  const { user, loading, isCustomer } = useAuth();
  const navigate = useNavigate();
  const [caseDecisions, setCaseDecisions] = useState<CaseDecision[]>([]);
  const [txnDecisions, setTxnDecisions] = useState<TransactionDecision[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && !isCustomer) {
      navigate('/dashboard');
    }
  }, [user, loading, isCustomer, navigate]);

  useEffect(() => {
    if (user && isCustomer) {
      fetchDecisions();
    }
  }, [user, isCustomer]);

  const fetchDecisions = async () => {
    setLoadingData(true);

    // Get customer ID
    const { data: customerData } = await supabase
      .from('customers')
      .select('customer_id')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (!customerData) {
      setLoadingData(false);
      return;
    }

    // Get customer's cases
    const { data: casesData } = await supabase
      .from('fraud_cases')
      .select('case_id, title, severity')
      .eq('customer_id', customerData.customer_id);

    if (casesData && casesData.length > 0) {
      const caseIds = casesData.map((c) => c.case_id);
      
      // Fetch case decisions (RLS allows FINAL/COMMUNICATED only)
      const { data: caseDecisionsData } = await supabase
        .from('case_decisions')
        .select('*')
        .in('case_id', caseIds)
        .order('updated_at', { ascending: false });

      if (caseDecisionsData) {
        const caseMap = new Map(casesData.map((c) => [c.case_id, c]));
        const enriched = caseDecisionsData.map((d) => ({
          ...d,
          case_title: caseMap.get(d.case_id)?.title || `Case #${d.case_id}`,
          case_severity: caseMap.get(d.case_id)?.severity || 'MEDIUM',
        }));
        setCaseDecisions(enriched as CaseDecision[]);
      }
    }

    // Get customer's transactions
    const { data: txnsData } = await supabase
      .from('transactions')
      .select('txn_id, txn_amount, txn_channel')
      .eq('customer_id', customerData.customer_id);

    if (txnsData && txnsData.length > 0) {
      const txnIds = txnsData.map((t) => t.txn_id);
      
      // Fetch transaction decisions (RLS allows FINAL/COMMUNICATED only)
      const { data: txnDecisionsData } = await supabase
        .from('transaction_decisions')
        .select('*')
        .in('txn_id', txnIds)
        .order('updated_at', { ascending: false });

      if (txnDecisionsData) {
        const txnMap = new Map(txnsData.map((t) => [t.txn_id, t]));
        const enriched = txnDecisionsData.map((d) => ({
          ...d,
          txn_amount: txnMap.get(d.txn_id)?.txn_amount,
          txn_channel: txnMap.get(d.txn_id)?.txn_channel,
        }));
        setTxnDecisions(enriched as TransactionDecision[]);
      }
    }

    setLoadingData(false);
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

  const totalDecisions = caseDecisions.length + txnDecisions.length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gavel className="h-8 w-8" />
              My Decisions
            </h1>
            <p className="text-muted-foreground mt-1">
              View final decisions on your cases and transactions
            </p>
          </div>
          <Button onClick={fetchDecisions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Decision Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-3xl font-bold text-primary">{totalDecisions}</div>
                <p className="text-sm text-muted-foreground">Total Decisions</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{caseDecisions.length}</div>
                <p className="text-sm text-muted-foreground">Case Decisions</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-3xl font-bold text-green-600">{txnDecisions.length}</div>
                <p className="text-sm text-muted-foreground">Transaction Decisions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loadingData ? (
          <div className="text-center py-12 text-muted-foreground">Loading decisions...</div>
        ) : totalDecisions === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Decisions Yet</h3>
              <p className="text-muted-foreground mb-4">
                You'll see final decisions here once your cases or transactions have been reviewed.
              </p>
              <Button asChild>
                <Link to="/cases">View My Cases</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="cases" className="space-y-4">
            <TabsList>
              <TabsTrigger value="cases" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Case Decisions ({caseDecisions.length})
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Transaction Decisions ({txnDecisions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cases">
              {caseDecisions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No case decisions available yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {caseDecisions.map((decision) => {
                    const catInfo = categoryLabels[decision.category] || {
                      label: decision.category,
                      icon: Info,
                      color: 'text-gray-600',
                    };
                    const Icon = catInfo.icon;

                    return (
                      <Card
                        key={decision.decision_id}
                        className={`border-l-4 ${categoryColors[decision.category]}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Icon className={`h-5 w-5 ${catInfo.color}`} />
                                {decision.case_title}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4" />
                                Decision Date:{' '}
                                {new Date(decision.updated_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge className={categoryColors[decision.category]}>
                              {catInfo.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {decision.customer_message ? (
                            <div className="bg-muted/50 rounded-lg p-4">
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Official Message
                              </h4>
                              <p className="text-sm whitespace-pre-wrap">
                                {decision.customer_message}
                              </p>
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              No additional message provided.
                            </p>
                          )}
                          <div className="mt-4">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/cases/${decision.case_id}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Case Details
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="transactions">
              {txnDecisions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No transaction decisions available yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {txnDecisions.map((decision) => {
                    const catInfo = categoryLabels[decision.category] || {
                      label: decision.category,
                      icon: Info,
                      color: 'text-gray-600',
                    };
                    const Icon = catInfo.icon;

                    return (
                      <Card
                        key={decision.decision_id}
                        className={`border-l-4 ${categoryColors[decision.category]}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Icon className={`h-5 w-5 ${catInfo.color}`} />
                                Transaction #{decision.txn_id}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {decision.txn_amount && (
                                  <span className="mr-3">
                                    Amount: ৳{decision.txn_amount.toLocaleString()}
                                  </span>
                                )}
                                {decision.txn_channel && (
                                  <Badge variant="outline">{decision.txn_channel}</Badge>
                                )}
                              </CardDescription>
                            </div>
                            <Badge className={categoryColors[decision.category]}>
                              {catInfo.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground mb-3">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            Decision Date: {new Date(decision.updated_at).toLocaleDateString()}
                          </div>
                          {decision.customer_message ? (
                            <div className="bg-muted/50 rounded-lg p-4">
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Official Message
                              </h4>
                              <p className="text-sm whitespace-pre-wrap">
                                {decision.customer_message}
                              </p>
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              No additional message provided.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
