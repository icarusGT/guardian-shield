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
import { ArrowLeft, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function CreateCase() {
  const { user, loading, isCustomer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER' as 'PAYMENT_FRAUD' | 'IDENTITY_THEFT' | 'ACCOUNT_TAKEOVER' | 'SCAM' | 'OTHER',
    severity: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    // Only customers and admins can create cases
    if (!loading && user && !isCustomer && !isAdmin) {
      navigate('/dashboard');
    }
  }, [user, loading, isCustomer, isAdmin, navigate]);

  useEffect(() => {
    const fetchCustomerId = async () => {
      if (user) {
        // For customers, get their customer_id
        if (isCustomer) {
          const { data } = await supabase
            .from('customers')
            .select('customer_id')
            .eq('user_id', user.id)
            .single();
          if (data) setCustomerId(data.customer_id);
        } else if (isAdmin) {
          // For admin, we'll need to handle this differently - maybe show a customer selector
          // For now, we'll use the first customer as a placeholder
          // In a real app, you'd want a customer selector
          const { data } = await supabase
            .from('customers')
            .select('customer_id')
            .limit(1)
            .single();
          if (data) setCustomerId(data.customer_id);
        }
      }
    };

    if (user) {
      fetchCustomerId();
    }
  }, [user, isCustomer, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error('Unable to determine customer. Please try again.');
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </AppLayout>
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
              Report a new fraud case for investigation
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
                    <li>An investigator will be assigned to your case shortly</li>
                  </ul>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  className="gradient-primary flex-1"
                  disabled={submitting || !customerId}
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

