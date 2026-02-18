import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, CheckCheck, Check, Circle } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  message_id: number;
  case_id: number;
  sender_id: string;
  sender_role: string;
  message_body: string;
  created_at: string;
  seen_at: string | null;
}

interface CaseChatProps {
  caseId: number;
}

export default function CaseChat({ caseId }: CaseChatProps) {
  const { user, profile, isCustomer, isInvestigator } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const senderRole = isCustomer ? 'CUSTOMER' : isInvestigator ? 'INVESTIGATOR' : null;

  // Fetch messages
  useEffect(() => {
    if (!user || !caseId) return;
    fetchMessages();
  }, [user, caseId]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !caseId) return;

    const channel = supabase
      .channel(`case-messages-${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_messages',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.message_id === newMsg.message_id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as seen if it's from the other party
          if (newMsg.sender_id !== user.id) {
            markAsSeen(newMsg.message_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'case_messages',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.message_id === updated.message_id ? updated : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, caseId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update unread count
  useEffect(() => {
    if (!user) return;
    const count = messages.filter(
      (m) => m.sender_id !== user.id && !m.seen_at
    ).length;
    setUnreadCount(count);
  }, [messages, user]);

  // Mark unseen messages as seen when component is visible
  useEffect(() => {
    if (!user) return;
    const unseenFromOthers = messages.filter(
      (m) => m.sender_id !== user.id && !m.seen_at
    );
    unseenFromOthers.forEach((m) => markAsSeen(m.message_id));
  }, [messages, user]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('case_messages')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch messages:', error);
      return;
    }
    setMessages((data as unknown as Message[]) || []);
  };

  const markAsSeen = async (messageId: number) => {
    await supabase
      .from('case_messages')
      .update({ seen_at: new Date().toISOString() })
      .eq('message_id', messageId)
      .is('seen_at', null);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !senderRole) return;
    setSending(true);

    const { error } = await supabase.from('case_messages').insert({
      case_id: caseId,
      sender_id: user.id,
      sender_role: senderRole,
      message_body: newMessage.trim(),
    });

    if (error) {
      toast.error('Failed to send message: ' + error.message);
    } else {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Only customer and investigator can chat
  if (!senderRole) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Case Messages
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs px-2 py-0.5">
              {unreadCount} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Message list */}
        <ScrollArea className="h-[360px] pr-3">
          <div className="space-y-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs">Start the conversation below.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.message_id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      {/* Sender info */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[11px] font-semibold ${
                            isMe ? 'text-primary-foreground/80' : 'text-foreground/70'
                          }`}
                        >
                          {isMe ? 'You' : msg.sender_role === 'CUSTOMER' ? 'Customer' : 'Investigator'}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 h-4 ${
                            isMe
                              ? 'border-primary-foreground/30 text-primary-foreground/70'
                              : 'border-border'
                          }`}
                        >
                          {msg.sender_role}
                        </Badge>
                      </div>

                      {/* Body */}
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message_body}</p>

                      {/* Timestamp + seen status */}
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          isMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span
                          className={`text-[10px] ${
                            isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </span>
                        {isMe && (
                          msg.seen_at ? (
                            <CheckCheck className={`h-3 w-3 ${isMe ? 'text-primary-foreground/60' : 'text-blue-500'}`} />
                          ) : (
                            <Check className={`h-3 w-3 ${isMe ? 'text-primary-foreground/40' : 'text-muted-foreground'}`} />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
