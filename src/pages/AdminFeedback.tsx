// Last updated: 25th January 2026
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MessageSquare, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type FeedbackCategory = Database["public"]["Enums"]["feedback_category"];
type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

const feedbackCategories: FeedbackCategory[] = [
  "CONFIRMED_FRAUD",
  "FALSE_POSITIVE",
  "REQUIRES_MORE_INFO",
  "ESCALATE_TO_ADMIN",
  "UNDER_REVIEW",
];

const approvalStatuses: ApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED", "ESCALATED"];

const getCategoryColor = (category: FeedbackCategory) => {
  switch (category) {
    case "CONFIRMED_FRAUD":
      return "bg-destructive text-destructive-foreground";
    case "FALSE_POSITIVE":
      return "bg-secondary text-secondary-foreground";
    case "REQUIRES_MORE_INFO":
      return "bg-accent text-accent-foreground";
    case "ESCALATE_TO_ADMIN":
      return "bg-primary text-primary-foreground";
    case "UNDER_REVIEW":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusColor = (status: ApprovalStatus) => {
  switch (status) {
    case "APPROVED":
      return "bg-green-600 text-white";
    case "REJECTED":
      return "bg-destructive text-destructive-foreground";
    case "ESCALATED":
      return "bg-primary text-primary-foreground";
    case "PENDING":
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatCategory = (category: string) => category.replace(/_/g, " ");

const AdminFeedback = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const isAdmin = profile?.role_id === 1;

  const { data: caseFeedback, isLoading: loadingCaseFeedback } = useQuery({
    queryKey: ["admin-case-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_feedback")
        .select(`
          *,
          fraud_cases:case_id (case_id, title, status, severity),
          investigators:investigator_id (investigator_id, badge_no, department, users:user_id (full_name, email))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: transactionFeedback, isLoading: loadingTxnFeedback } = useQuery({
    queryKey: ["admin-transaction-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_feedback")
        .select(`
          *,
          transactions:txn_id (txn_id, txn_amount, txn_channel, occurred_at),
          investigators:investigator_id (investigator_id, badge_no, department, users:user_id (full_name, email))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const filterFeedback = <T extends { category: FeedbackCategory; approval_status: ApprovalStatus; comment?: string | null }>(
    feedback: T[] | undefined
  ) => {
    if (!feedback) return [];
    return feedback.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.comment?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || item.approval_status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const filteredCaseFeedback = filterFeedback(caseFeedback);
  const filteredTxnFeedback = filterFeedback(transactionFeedback);

  // Stats
  const totalCaseFeedback = caseFeedback?.length || 0;
  const totalTxnFeedback = transactionFeedback?.length || 0;
  const pendingCount = [...(caseFeedback || []), ...(transactionFeedback || [])].filter(
    (f) => f.approval_status === "PENDING"
  ).length;
  const escalatedCount = [...(caseFeedback || []), ...(transactionFeedback || [])].filter(
    (f) => f.approval_status === "ESCALATED" || f.category === "ESCALATE_TO_ADMIN"
  ).length;

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access denied. Admin only.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investigator Feedback</h1>
          <p className="text-muted-foreground">
            Review all investigator feedback across cases and transactions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Case Feedback</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCaseFeedback}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaction Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTxnFeedback}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalated</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{escalatedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by comment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {feedbackCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {formatCategory(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {approvalStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="cases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cases">
              Case Feedback ({filteredCaseFeedback.length})
            </TabsTrigger>
            <TabsTrigger value="transactions">
              Transaction Feedback ({filteredTxnFeedback.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="space-y-4">
            {loadingCaseFeedback ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredCaseFeedback.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No case feedback found matching your filters.
                </CardContent>
              </Card>
            ) : (
              filteredCaseFeedback.map((feedback: any) => (
                <Card key={feedback.feedback_id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          Case #{feedback.fraud_cases?.case_id}: {feedback.fraud_cases?.title}
                        </CardTitle>
                        <Badge variant="outline">{feedback.fraud_cases?.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getCategoryColor(feedback.category)}>
                          {formatCategory(feedback.category)}
                        </Badge>
                        <Badge className={getStatusColor(feedback.approval_status)}>
                          {feedback.approval_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          Investigator: {feedback.investigators?.users?.full_name || "Unknown"} (
                          {feedback.investigators?.badge_no || "N/A"})
                        </span>
                        {feedback.investigators?.department && (
                          <span className="text-xs">• {feedback.investigators.department}</span>
                        )}
                      </div>
                      {feedback.comment && (
                        <p className="text-sm bg-muted p-3 rounded-md">{feedback.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Submitted: {format(new Date(feedback.created_at), "PPpp")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            {loadingTxnFeedback ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredTxnFeedback.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No transaction feedback found matching your filters.
                </CardContent>
              </Card>
            ) : (
              filteredTxnFeedback.map((feedback: any) => (
                <Card key={feedback.feedback_id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          Transaction #{feedback.transactions?.txn_id}
                        </CardTitle>
                        <Badge variant="outline">
                          ৳{feedback.transactions?.txn_amount?.toLocaleString()}
                        </Badge>
                        <Badge variant="secondary">{feedback.transactions?.txn_channel}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getCategoryColor(feedback.category)}>
                          {formatCategory(feedback.category)}
                        </Badge>
                        <Badge className={getStatusColor(feedback.approval_status)}>
                          {feedback.approval_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          Investigator: {feedback.investigators?.users?.full_name || "Unknown"} (
                          {feedback.investigators?.badge_no || "N/A"})
                        </span>
                        {feedback.investigators?.department && (
                          <span className="text-xs">• {feedback.investigators.department}</span>
                        )}
                      </div>
                      {feedback.comment && (
                        <p className="text-sm bg-muted p-3 rounded-md">{feedback.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Submitted: {format(new Date(feedback.created_at), "PPpp")}
                        {feedback.transactions?.occurred_at && (
                          <> • Transaction Date: {format(new Date(feedback.transactions.occurred_at), "PP")}</>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminFeedback;
