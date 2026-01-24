// Last updated: 20th January 2025
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
import { ArrowLeft, FileText, AlertCircle, Loader2, User } from 'lucide-react';
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER' as 'PAYMENT_FRAUD' | 'IDENTITY_THEFT' | 'ACCOUNT_TAKEOVER' | 'SCAM' | 'OTHER',
    severity: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    // All authenticated users can create cases
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
            .select('customer_id')
            .eq('user_id', user.id)
            .single();

          if (customerError) {
            throw customerError;
          }

          if (data) {
            setCustomerId(data.customer_id);
          } else {
            setError('Customer record not found. Please contact support.');
          }
        } else {
          // For Admin, Investigator, and Auditor - fetch list of customers for selection
          setShowCustomerSelector(true);

          // Fetch customers with user info
          const { data: customersData, error: customersError } = await supabase
            .from('customers')
            .select('customer_id, user_id')
            .order('customer_id', { ascending: true });

          if (customersError) {
            throw customersError;
          }

          if (customersData && customersData.length > 0) {
            // Fetch user details for each customer
            // SECURITY: Use users_safe view to exclude password_hash column
            const userIds = customersData.map((c) => c.user_id);
            const { data: usersData } = await supabase
              .from('users_safe')
              .select('user_id, full_name, email')
              .in('user_id', userIds);

            // Combine customer and user data
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

            // Auto-select first customer if available
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

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('fraud_cases')
        .insert({
          customer_id: customerId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          severity: formData.severity,
          status: 'OPEN',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Case created successfully!');
      navigate(`/cases/${data.case_id}`);
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
              <h1 className="text-3xl font-bold">Create New Case</h1>
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
            <h1 className="text-3xl font-bold">Create New Case</h1>
            <p className="text-muted-foreground mt-1">
              {isCustomer
                ? 'Report a new fraud case for investigation'
                : `Create a new fraud case as ${getRoleName()}`}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg gradient-primary">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Case Information</CardTitle>
                <CardDescription>
                  Provide details about the fraud case you want to report
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="e.g., Unauthorized transaction on account"
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
                  placeholder="Provide detailed information about the fraud case, including dates, amounts, and any relevant details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
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
                  <p className="text-xs text-muted-foreground">Type of fraud case</p>
                </div>

                {/* Severity */}
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
                  <p className="text-xs text-muted-foreground">Urgency level of the case</p>
                </div>
              </div>

              {/* Info Alert */}
              <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Important Information</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Your case will be reviewed by our investigation team</li>
                    <li>You can upload evidence files after creating the case</li>
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
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  className="gradient-primary flex-1"
                  disabled={submitting || !customerId || loadingCustomer}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Case...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Case
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/cases')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
