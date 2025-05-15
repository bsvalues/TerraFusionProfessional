import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Bot, 
  SendHorizonal, 
  User, 
  Loader2, 
  AlertCircle, 
  MessagesSquare,
  X
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIAssistantDialogProps {
  initialContext?: string;
  agentId?: string;
}

export function AIAssistantDialog({ initialContext, agentId = 'god-tier-builder' }: AIAssistantDialogProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && messages.length === 0) {
      // Add initial welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I'm your AI Assistant for the Benton County Property Appraisal Platform. How can I help you today?",
          timestamp: new Date()
        }
      ]);
      
      // If initial context is provided, add it as a system message
      if (initialContext) {
        setMessages(prev => [
          ...prev,
          {
            id: 'context',
            role: 'system',
            content: initialContext,
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [open, initialContext, messages.length]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setError(null);

    try {
      // Call API endpoint or use direct agent communication
      const response = await fetch('/api/agents/' + agentId + '/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input,
          context: {
            parameters: {
              previousMessages: messages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role, content: m.content }))
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant response
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.output || data.response || "I processed your request, but didn't receive a proper response. Please try again.",
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get response from AI Assistant. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Communication Error',
        description: 'Could not connect to the AI Assistant. Using offline response mode.',
      });
      
      // Add fallback response
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-fallback-${Date.now()}`,
          role: 'assistant',
          content: "I apologize, but I'm currently experiencing connection issues. Please try again in a moment or check with your system administrator.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessagesSquare className="h-4 w-4" />
          AI Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Ask questions about properties, data analysis, or get help with the platform
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 mb-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    rounded-lg px-4 py-2 max-w-[80%] 
                    ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 
                     message.role === 'system' ? 'bg-muted text-muted-foreground text-xs italic' : 
                     'bg-muted text-foreground border'}
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === 'user' ? (
                      <User className="h-3 w-3" />
                    ) : message.role === 'assistant' ? (
                      <Bot className="h-3 w-3" />
                    ) : null}
                    <span className="text-xs opacity-70">
                      {message.role === 'user' ? 'You' : 
                       message.role === 'assistant' ? 'Assistant' : 
                       'System'}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-2 rounded flex items-start mb-4">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 ml-auto" 
              onClick={() => setError(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <div className="mt-auto">
          <div className="relative">
            <Textarea
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-10 resize-none min-h-[80px]"
              disabled={isProcessing}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-2 bottom-2"
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {isProcessing ? 'Processing...' : 'Press Enter to send'}
            </span>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs">AI-powered</Badge>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}