// Last updated: 26th January 2026
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, FileText, AlertCircle, Loader2, User, DollarSign, CreditCard, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Customer {
  customer_id: number;
  user_id: string;
  full_name?: string;
  email?: string;
}

export default function CreateCase() {
  const { user, loading, isCustomer, isAdmin, isInvestigator, isAuditor } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER' as 'PAYMENT_FRAUD' | 'IDENTITY_THEFT' | 'ACCOUNT_TAKEOVER' | 'SCAM' | 'OTHER',
    severity: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH',
  });

  // Transaction details (embedded for customers)
  const [txnData, setTxnData] = useState({
    txn_amount: '',
    txn_channel: 'OTHER' as 'BKASH' | 'NAGAD' | 'CARD' | 'BANK' | 'CASH' | 'OTHER',
    recipient_account: '',
    txn_location: '',
    occurred_at: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!user) return;

      setLoadingCustomer(true);
      setError(null);

      try {
        // For customers, get their customer_id
        if (isCustomer) {
          const { data, error: customerError } = await supabase
            .from('customers')
            .select('customer_id, primary_region')
            .eq('user_id', user.id)
            .single();

          if (customerError) {
            throw customerError;
          }

          if (data) {
            setCustomerId(data.customer_id);
            setProfileComplete(!!data.primary_region);
          } else {
            setError('Customer record not found. Please contact support.');
          }
        } else {
          // For Admin, Investigator, and Auditor - fetch list of customers for selection
          setShowCustomerSelector(true);

          const { data: customersData, error: customersError } = await supabase
            .from('customers')
            .select('customer_id, user_id')
            .order('customer_id', { ascending: true });

          if (customersError) {
            throw customersError;
          }

          if (customersData && customersData.length > 0) {
            const userIds = customersData.map((c) => c.user_id);
            const { data: usersData } = await supabase
              .from('users_safe')
              .select('user_id, full_name, email')
              .in('user_id', userIds);

            const customersWithNames = customersData.map((customer) => {
              const userData = usersData?.find((u) => u.user_id === customer.user_id);
              return {
                customer_id: customer.customer_id,
                user_id: customer.user_id,
                full_name: userData?.full_name || 'Unknown',
                email: userData?.email || '',
              };
            });

            setCustomers(customersWithNames);

            if (customersWithNames.length > 0) {
              setCustomerId(customersWithNames[0].customer_id);
            } else {
              setError('No customers found. Please create a customer first.');
            }
          } else {
            setError('No customers found. Please create a customer first.');
          }
        }
      } catch (err: any) {
        console.error('Error fetching customer:', err);
        setError(err.message || 'Failed to load customer information');
      } finally {
        setLoadingCustomer(false);
      }
    };

    if (user) {
      fetchCustomerData();
    }
  }, [user, isCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error('Please select a customer for this case.');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please provide a case title');
      return;
    }

    // For customers, transaction details are required
    if (isCustomer) {
      const amount = parseFloat(txnData.txn_amount);
      if (!txnData.txn_amount || isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid transaction amount');
        return;
      }
      if (amount > 9999999999999.99) {
        toast.error('Transaction amount exceeds maximum allowed value');
        return;
      }
    }

    setSubmitting(true);

    try {
      // Step 1: Create the fraud case
      const { data: caseResult, error: caseError } = await supabase
        .from('fraud_cases')
        .insert({
          customer_id: customerId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          severity: isCustomer ? 'LOW' : formData.severity,
          status: 'OPEN',
        })
        .select()
        .single();

      if (caseError) {
        throw caseError;
      }

      const newCaseId = caseResult.case_id;

      // Step 2: If customer, create the linked transaction
      if (isCustomer && txnData.txn_amount) {
        const txnPayload: {
          customer_id: number;
          txn_amount: number;
          txn_channel: 'BKASH' | 'NAGAD' | 'CARD' | 'BANK' | 'CASH' | 'OTHER';
          recipient_account: string | null;
          txn_location: string | null;
          occurred_at?: string;
        } = {
          customer_id: customerId,
          txn_amount: parseFloat(txnData.txn_amount),
          txn_channel: txnData.txn_channel,
          recipient_account: txnData.recipient_account || null,
          txn_location: txnData.txn_location || null,
        };

        // Add occurred_at if provided
        if (txnData.occurred_at) {
          txnPayload.occurred_at = new Date(txnData.occurred_at).toISOString();
        }

        const { data: txnResult, error: txnError } = await supabase
          .from('transactions')
          .insert(txnPayload)
          .select()
          .single();

        if (txnError) {
          console.error('Transaction creation error:', txnError);
          // Case was created but transaction failed - still navigate but warn
          toast.warning('Case created but transaction details could not be saved. Please add manually.');
          navigate(`/cases/${newCaseId}`);
          return;
        }

        // Step 3: Link transaction to case
        const { error: linkError } = await supabase
          .from('case_transactions')
          .insert({
            case_id: newCaseId,
            txn_id: txnResult.txn_id,
          });

        if (linkError) {
          console.error('Case-transaction link error:', linkError);
          // Transaction was created but link failed
          toast.warning('Case and transaction created but linking failed. Please contact support.');
        }
      }

      toast.success('Case created successfully!');
      navigate(`/cases/${newCaseId}`);
    } catch (error: any) {
      console.error('Error creating case:', error);
      toast.error(`Failed to create case: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleName = () => {
    if (isAdmin) return 'Administrator';
    if (isInvestigator) return 'Investigator';
    if (isAuditor) return 'Auditor';
    if (isCustomer) return 'Customer';
    return 'User';
  };

  if (loading || loadingCustomer) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && !showCustomerSelector) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/cases">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Report Fraud Case</h1>
            </div>
          </div>
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Error</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/cases')}>Back to Cases</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cases">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isCustomer ? 'Report Fraud Case' : 'Create New Case'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isCustomer
                ? 'Report a fraud case with transaction details as evidence'
                : `Create a new fraud case as ${getRoleName()}`}
            </p>
          </div>
        </div>

        {/* Profile completion warning for customers */}
        {isCustomer && !profileComplete && (
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <MapPin className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-1">Complete your profile to submit a case</p>
              <p className="text-amber-800 mb-2">
                You must set your Primary Region in your profile before reporting fraud. This helps us detect unusual activity.
              </p>
              <Link to="/my-profile" className="text-primary font-medium hover:underline">
                Go to My Profile →
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg gradient-primary">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Case Information</CardTitle>
                  <CardDescription>
                    Describe the fraud incident you want to report
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Selector (for non-customers) */}
              {showCustomerSelector && customers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="customer">
                    Customer <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={customerId?.toString() || ''}
                    onValueChange={(value) => setCustomerId(parseInt(value))}
                  >
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select a customer">
                        {customerId &&
                          (() => {
                            const selected = customers.find(
                              (c) => c.customer_id === customerId
                            );
                            return selected
                              ? `${selected.full_name} (${selected.email})`
                              : 'Select customer';
                          })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem
                          key={customer.customer_id}
                          value={customer.customer_id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{customer.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {customer.email} • ID: {customer.customer_id}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the customer this case is associated with
                  </p>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Case Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Unauthorized transaction on my account"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  A brief, descriptive title for the case (max 200 characters)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what happened, when it occurred, and any suspicious details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">
                  Detailed description of the incident (optional, max 2000 characters)
                </p>
              </div>

              {/* Category and Severity Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYMENT_FRAUD">Payment Fraud</SelectItem>
                      <SelectItem value="IDENTITY_THEFT">Identity Theft</SelectItem>
                      <SelectItem value="ACCOUNT_TAKEOVER">Account Takeover</SelectItem>
                      <SelectItem value="SCAM">Scam</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Severity - only editable by admin/investigator */}
                {!isCustomer ? (
                  <div className="space-y-2">
                    <Label htmlFor="severity">
                      Severity <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, severity: value })
                      }
                    >
                      <SelectTrigger id="severity">
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Low
                          </div>
                        </SelectItem>
                        <SelectItem value="MEDIUM">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="HIGH">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            High
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                      <Badge className="bg-muted-foreground/20 text-muted-foreground">
                        Auto-assigned
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Severity is computed automatically based on risk analysis
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details Card - Only for Customers */}
          {isCustomer && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Transaction Details</CardTitle>
                    <CardDescription>
                      Provide details of the suspicious transaction as evidence
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="txn_amount">
                      Amount (BDT) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="txn_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={txnData.txn_amount}
                        onChange={(e) =>
                          setTxnData({ ...txnData, txn_amount: e.target.value })
                        }
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Channel */}
                  <div className="space-y-2">
                    <Label htmlFor="txn_channel">
                      Payment Channel <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={txnData.txn_channel}
                      onValueChange={(value: typeof txnData.txn_channel) =>
                        setTxnData({ ...txnData, txn_channel: value })
                      }
                    >
                      <SelectTrigger id="txn_channel">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BKASH">bKash</SelectItem>
                        <SelectItem value="NAGAD">Nagad</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="BANK">Bank Transfer</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recipient Account */}
                  <div className="space-y-2">
                    <Label htmlFor="recipient_account">Recipient Account/Number</Label>
                    <Input
                      id="recipient_account"
                      type="text"
                      placeholder="e.g., 01XXXXXXXXX"
                      value={txnData.recipient_account}
                      onChange={(e) =>
                        setTxnData({ ...txnData, recipient_account: e.target.value })
                      }
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="txn_location">Transaction Location</Label>
                    <Input
                      id="txn_location"
                      type="text"
                      placeholder="e.g., Dhaka, Chittagong"
                      value={txnData.txn_location}
                      onChange={(e) =>
                        setTxnData({ ...txnData, txn_location: e.target.value })
                      }
                    />
                  </div>

                  {/* Transaction Time */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="occurred_at">Transaction Time (Optional)</Label>
                    <Input
                      id="occurred_at"
                      type="datetime-local"
                      value={txnData.occurred_at}
                      onChange={(e) =>
                        setTxnData({ ...txnData, occurred_at: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      When did the suspicious transaction occur? Leave blank if unknown.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <p className="font-medium mb-1">Transaction as Evidence</p>
                    <p className="text-amber-800">
                      This transaction will be automatically analyzed for fraud patterns. 
                      High-risk transactions may result in case severity being upgraded.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Alert */}
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">What Happens Next</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Your case will be reviewed by our investigation team</li>
                <li>You can upload additional evidence files after creating the case</li>
                <li>Case status updates will be visible in your dashboard</li>
                {isInvestigator || isAdmin ? (
                  <li>You can assign this case to an investigator after creation</li>
                ) : (
                  <li>An investigator will be assigned to your case shortly</li>
                )}
              </ul>
            </div>
          </div>

          {/* Role-specific note */}
          {!isCustomer && customerId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Creating case as {getRoleName()} for customer ID:{' '}
                {customerId}
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/cases')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-primary flex-1"
              disabled={submitting || !customerId || loadingCustomer || (isCustomer && !profileComplete)}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Case...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  {isCustomer ? 'Submit Report' : 'Create Case'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
