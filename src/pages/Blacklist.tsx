import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldBan, Search, Trash2, Plus, AlertTriangle, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAllBlacklistRecommendations } from '@/hooks/useBlacklistRecommendations';
import BlacklistRecommendationBanner from '@/components/blacklist/BlacklistRecommendationBanner';
import ReviewBlacklistModal from '@/components/blacklist/ReviewBlacklistModal';
import BlacklistSettingsPanel from '@/components/blacklist/BlacklistSettingsPanel';

interface BlacklistEntry {
  id: number;
  recipient_value: string;
  reason: string | null;
  created_at: string;
  created_by: string | null;
}

export default function Blacklist() {
  const { user, loading, isAdmin, isInvestigator } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [newReason, setNewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewRecipient, setReviewRecipient] = useState<string | null>(null);

  const { recommendations, loading: recsLoading, refresh: refreshRecs } = useAllBlacklistRecommendations();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (!loading && user && !isAdmin && !isInvestigator) navigate('/dashboard');
  }, [user, loading, isAdmin, isInvestigator]);

  useEffect(() => {
    if (user && (isAdmin || isInvestigator)) fetchEntries();
  }, [user, isAdmin, isInvestigator]);

  const fetchEntries = async () => {
    setLoadingData(true);
    const { data } = await supabase
      .from('blacklisted_recipients')
      .select('*')
      .order('created_at', { ascending: false });
    setEntries((data as unknown as BlacklistEntry[]) || []);
    setLoadingData(false);
  };

  const handleAdd = async () => {
    if (!newRecipient.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('blacklisted_recipients').insert({
      recipient_value: newRecipient.trim(),
      reason: newReason.trim() || null,
      created_by: user!.id,
    } as any);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Recipient already blacklisted' : error.message);
    } else {
      toast.success('Recipient added to blacklist');
      setNewRecipient('');
      setNewReason('');
      setAddOpen(false);
      fetchEntries();
      refreshRecs();
    }
    setSubmitting(false);
  };

  const handleRemove = async (id: number, recipient: string) => {
    if (!confirm(`Remove "${recipient}" from blacklist?`)) return;
    const { error } = await supabase.from('blacklisted_recipients').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Removed from blacklist');
      fetchEntries();
      refreshRecs();
    }
  };

  const filtered = entries.filter(
    (e) =>
      e.recipient_value.toLowerCase().includes(search.toLowerCase()) ||
      (e.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  // Non-blacklisted recommendations
  const pendingRecs = recommendations.filter(r => !r.isAlreadyBlacklisted);
  const selectedRec = pendingRecs.find(r => r.recipientAccount === reviewRecipient);

  if (loading) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldBan className="h-6 w-6" />
              Recipient Blacklist
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage blacklisted recipients — transactions to these accounts receive +50 risk score.
            </p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Blacklist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Recipient Account</label>
                  <Input
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="e.g. 01712345678"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Reason (optional)</label>
                  <Textarea
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Why is this recipient being blacklisted?"
                  />
                </div>
                <Button onClick={handleAdd} disabled={submitting || !newRecipient.trim()} className="w-full">
                  {submitting ? 'Adding...' : 'Add to Blacklist'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Recommendation Banners */}
        {pendingRecs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Recommended for Blacklisting ({pendingRecs.length})
            </h2>
            {pendingRecs.map((rec) => (
              <div key={rec.recipientAccount} className="space-y-2">
                <BlacklistRecommendationBanner recommendation={rec} />
                {isAdmin && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-400 text-amber-700 hover:bg-amber-50"
                      onClick={() => setReviewRecipient(rec.recipientAccount)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Review & Blacklist
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Admin Settings */}
        {isAdmin && (
          <BlacklistSettingsPanel onThresholdsChanged={refreshRecs} />
        )}

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {loadingData ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {search ? 'No matching entries' : 'No blacklisted recipients yet'}
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map((entry) => {
                  const rec = recommendations.find(r => r.recipientAccount === entry.recipient_value);
                  return (
                    <div key={entry.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium">{entry.recipient_value}</span>
                          <Badge variant="destructive" className="text-xs">Blacklisted</Badge>
                          {rec && (
                            <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                        </div>
                        {entry.reason && (
                          <p className="text-sm text-muted-foreground">{entry.reason}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(entry.id, entry.recipient_value)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review & Blacklist Modal */}
      {selectedRec && user && (
        <ReviewBlacklistModal
          recommendation={selectedRec}
          userId={user.id}
          open={!!reviewRecipient}
          onOpenChange={(open) => { if (!open) setReviewRecipient(null); }}
          onBlacklisted={() => {
            setReviewRecipient(null);
            fetchEntries();
            refreshRecs();
          }}
        />
      )}
    </AppLayout>
  );
}
