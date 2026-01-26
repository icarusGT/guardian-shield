// Real-time notifications for Admins (new cases) and Investigators (case assignments)
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FileText, UserCheck } from 'lucide-react';

export default function RealtimeNotifications() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [myInvestigatorId, setMyInvestigatorId] = useState<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch investigator_id if user is an investigator
  useEffect(() => {
    const fetchInvestigatorId = async () => {
      if (profile?.role_id === 2 && user?.id) {
        const { data } = await supabase
          .from('investigators')
          .select('investigator_id')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setMyInvestigatorId(data.investigator_id);
        }
      }
    };

    fetchInvestigatorId();
  }, [profile?.role_id, user?.id]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!profile?.role_id || !user?.id) return;

    const isAdmin = profile.role_id === 1;
    const isInvestigator = profile.role_id === 2;

    // Only set up listeners for admins and investigators
    if (!isAdmin && !isInvestigator) return;

    // Create a single channel for all notifications
    const channel = supabase.channel('realtime-notifications');

    // Admin: Listen for new fraud cases
    if (isAdmin) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fraud_cases',
        },
        (payload) => {
          const newCase = payload.new as { case_id: number; title: string };
          
          toast({
            title: '📋 New Case Created',
            description: `Case #${newCase.case_id} - ${newCase.title}`,
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/cases/${newCase.case_id}`)}
                className="gap-1"
              >
                <FileText className="h-3 w-3" />
                View Case
              </Button>
            ),
            duration: 10000,
          });
        }
      );
    }

    // Investigator: Listen for case assignments
    if (isInvestigator) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_assignments',
        },
        (payload) => {
          const assignment = payload.new as { 
            case_id: number; 
            investigator_id: number;
          };

          // Only show notification if assigned to current investigator
          if (myInvestigatorId && assignment.investigator_id === myInvestigatorId) {
            toast({
              title: '🔔 New Case Assigned',
              description: `Case #${assignment.case_id} assigned to you`,
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/cases/${assignment.case_id}`)}
                  className="gap-1"
                >
                  <UserCheck className="h-3 w-3" />
                  Open
                </Button>
              ),
              duration: 10000,
            });
          }
        }
      );
    }

    // Subscribe to the channel
    channel.subscribe();
    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile?.role_id, user?.id, myInvestigatorId, toast, navigate]);

  // This component doesn't render anything visible
  return null;
}
