// Last updated: 26th January 2026
// Standalone transaction creation is deprecated.
// Transactions are now created as part of fraud case reports.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, ArrowRight } from 'lucide-react';

export default function CreateTransaction() {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // Redirect non-customers to transactions list
  if (profile && profile.role_id !== 4) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>
                This page is only available to customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Go Back
              </Button>
              <Button onClick={() => navigate('/transactions')}>
                View Transactions
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Transaction Reporting Has Changed</CardTitle>
                <CardDescription>
                  Transactions are now reported as part of fraud cases
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <p className="text-sm text-muted-foreground">
                To better protect you and streamline our fraud investigation process, 
                suspicious transactions are now reported directly within fraud cases.
              </p>
              <p className="text-sm text-muted-foreground">
                When you create a fraud case, you'll be able to add transaction details 
                as evidence. This helps our investigators understand the full context 
                of your report.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/cases')}
                className="flex-1"
              >
                View My Cases
              </Button>
              <Button
                onClick={() => navigate('/cases/new')}
                className="flex-1 gradient-primary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Report Fraud Case
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How It Works Now</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Click "Report Fraud Case" to create a new case</li>
              <li>Fill in case details (title, description, category)</li>
              <li>Add transaction details in the evidence section</li>
              <li>Our system will automatically analyze the transaction for fraud patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
