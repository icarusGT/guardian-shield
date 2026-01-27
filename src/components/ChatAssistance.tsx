// Last updated: 20th January 2025
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageCircle, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatAssistance() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Guardian Shield assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getAssistantResponse(inputValue),
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };

  const getAssistantResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('case') || lowerInput.includes('fraud')) {
      return 'I can help you with fraud cases! You can create new cases, view existing ones, or track case status. Would you like me to guide you to the Cases page?';
    }

    if (lowerInput.includes('transaction') || lowerInput.includes('monitor')) {
      return 'For transaction monitoring, you can view suspicious transactions and their risk scores. Navigate to the Transactions page to see all flagged transactions.';
    }

    if (lowerInput.includes('investigation') || lowerInput.includes('investigate')) {
      return 'Investigations help you track and manage fraud cases. Investigators can view assigned cases and update their status. Check the Investigations page for more details.';
    }

    if (lowerInput.includes('dashboard') || lowerInput.includes('overview')) {
      return 'The Dashboard provides an overview of your fraud management metrics, including case statistics, closure rates, and recent activity.';
    }

    if (lowerInput.includes('help') || lowerInput.includes('how')) {
      return 'I can help you with:\n• Creating and managing fraud cases\n• Monitoring suspicious transactions\n• Understanding investigation workflows\n• Navigating the dashboard\n• User management (for admins)\n\nWhat would you like to know more about?';
    }

    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      return 'Hello! I\'m here to help you navigate Guardian Shield. What would you like to know?';
    }

    return 'Thank you for your message! I\'m here to help you with Guardian Shield. You can ask me about cases, transactions, investigations, or how to use specific features.';
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 gradient-primary hover:scale-110 transition-transform"
          size="icon"
          aria-label="Open chat assistance"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card
          className={cn(
            'fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col transition-all duration-300',
            isMinimized && 'h-16'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/favicon.ico"
                  alt="Chat Assistant"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <CardTitle className="text-base">Chat Assistance</CardTitle>
                <p className="text-xs text-muted-foreground">We're here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 pr-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.sender === 'assistant' && (
                        <img
                          src="/favicon.ico"
                          alt="Assistant"
                          className="h-6 w-6 rounded-full object-cover flex-shrink-0 mt-1"
                        />
                      )}
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg px-4 py-2',
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {message.sender === 'user' && (
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-xs text-primary-foreground font-medium">U</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    size="icon"
                    className="gradient-primary"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}

