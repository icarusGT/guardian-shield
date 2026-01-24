import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, DollarSign } from 'lucide-react';

export default function CreateTransaction() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    txn_amount: '',
    txn_location: '',
    txn_channel: 'OTHER' as 'BKASH' | 'NAGAD' | 'CARD' | 'BANK' | 'CASH' | 'OTHER',
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.txn_amount || parseFloat(formData.txn_amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid transaction amount.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Get the customer_id from customers table using auth user id
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (customerError || !customerData) {
        throw new Error('Could not find your customer profile. Please contact support.');
      }

      const { error } = await supabase.from('transactions').insert({
        customer_id: customerData.customer_id,
        txn_amount: parseFloat(formData.txn_amount),
        txn_location: formData.txn_location || null,
        txn_channel: formData.txn_channel,
      });

      if (error) throw error;

      toast({
        title: 'Transaction Submitted',
        description: 'Your transaction request has been sent for review.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit transaction request.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Transaction Request</h1>
            <p className="text-muted-foreground">
              Submit a new transaction for processing
            </p>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Transaction Details
            </CardTitle>
            <CardDescription>
              Fill in the details for your transaction request. It will be reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="txn_amount">Amount (BDT) *</Label>
                <Input
                  id="txn_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter amount"
                  value={formData.txn_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, txn_amount: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="txn_channel">Payment Channel *</Label>
                <Select
                  value={formData.txn_channel}
                  onValueChange={(value: typeof formData.txn_channel) =>
                    setFormData({ ...formData, txn_channel: value })
                  }
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="txn_location">Location (Optional)</Label>
                <Input
                  id="txn_location"
                  type="text"
                  placeholder="Enter location (e.g., Dhaka, Chittagong)"
                  value={formData.txn_location}
                  onChange={(e) =>
                    setFormData({ ...formData, txn_location: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 gradient-primary"
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Transaction
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
