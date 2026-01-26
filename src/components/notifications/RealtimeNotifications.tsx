// Real-time notifications for Admins (new cases) and Investigators (case assignments)
import { useEffect, useState, useRef, useCallback } from 'react';
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
  const isSubscribedRef = useRef(false);

  // Fetch investigator_id if user is an investigator
  useEffect(() => {
    const fetchInvestigatorId = async () => {
      if (profile?.role_id === 2 && user?.id) {
        const { data } = await supabase
          .from('investigators')
          .select('investigator_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setMyInvestigatorId(data.investigator_id);
          console.log('[RealtimeNotifications] Investigator ID:', data.investigator_id);
        }
      }
    };

    fetchInvestigatorId();
  }, [profile?.role_id, user?.id]);

  // Memoized navigation handlers to avoid stale closures
  const handleViewCase = useCallback((caseId: number) => {
    navigate(`/cases/${caseId}`);
  }, [navigate]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!profile?.role_id || !user?.id) {
      console.log('[RealtimeNotifications] No profile or user, skipping subscription');
      return;
    }

    const isAdmin = profile.role_id === 1;
    const isInvestigator = profile.role_id === 2;

    // Only set up listeners for admins and investigators
    if (!isAdmin && !isInvestigator) {
      console.log('[RealtimeNotifications] User is not admin or investigator, skipping');
      return;
    }

    // For investigators, wait until we have their ID
    if (isInvestigator && myInvestigatorId === null) {
      console.log('[RealtimeNotifications] Waiting for investigator ID...');
      return;
    }

    // Prevent duplicate subscriptions
    if (isSubscribedRef.current && channelRef.current) {
      console.log('[RealtimeNotifications] Already subscribed, skipping');
      return;
    }

    console.log('[RealtimeNotifications] Setting up realtime subscription for role:', profile.role_id);

    // Create a unique channel name
    const channelName = `realtime-notifications-${user.id}`;
    const channel = supabase.channel(channelName);

    // Admin: Listen for new fraud cases
    if (isAdmin) {
      console.log('[RealtimeNotifications] Admin: Subscribing to fraud_cases INSERT');
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fraud_cases',
        },
        (payload) => {
          console.log('[RealtimeNotifications] New case received:', payload);
          const newCase = payload.new as { case_id: number; title: string };
          
          toast({
            title: '📋 New Case Created',
            description: `Case #${newCase.case_id} - ${newCase.title}`,
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewCase(newCase.case_id)}
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
    if (isInvestigator && myInvestigatorId) {
      console.log('[RealtimeNotifications] Investigator: Subscribing to case_assignments INSERT, myId:', myInvestigatorId);
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_assignments',
        },
        (payload) => {
          console.log('[RealtimeNotifications] New assignment received:', payload);
          const assignment = payload.new as { 
            case_id: number; 
            investigator_id: number;
          };

          // Only show notification if assigned to current investigator
          if (assignment.investigator_id === myInvestigatorId) {
            console.log('[RealtimeNotifications] Assignment is for me, showing toast');
            toast({
              title: '🔔 New Case Assigned',
              description: `Case #${assignment.case_id} assigned to you`,
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewCase(assignment.case_id)}
                  className="gap-1"
                >
                  <UserCheck className="h-3 w-3" />
                  Open
                </Button>
              ),
              duration: 10000,
            });
          } else {
            console.log('[RealtimeNotifications] Assignment is for different investigator:', assignment.investigator_id);
          }
        }
      );
    }

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('[RealtimeNotifications] Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
      }
    });
    
    channelRef.current = channel;

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log('[RealtimeNotifications] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [profile?.role_id, user?.id, myInvestigatorId, toast, handleViewCase]);

  // This component doesn't render anything visible
  return null;
}
