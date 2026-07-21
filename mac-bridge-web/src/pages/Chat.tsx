import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useStompClient } from '@/hooks/useStompClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I am connected to your Mac Bridge. How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { client, connected } = useStompClient();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (client && connected) {
      const subscription = client.subscribe('/topic/antigravity', (message) => {
        // If it's the "Sending..." message, we can ignore or update
        // To keep it simple, we just append all incoming messages as assistant
        setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), role: 'assistant', content: message.body }]);
      });
      return () => subscription.unsubscribe();
    }
  }, [client, connected]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await apiClient.post('/api/antigravity/chat', { message });
      return data;
    },
    onSuccess: () => {
      // We don't push the response here because the WebSocket will stream it!
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 'Failed to connect to Antigravity';
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: errorMsg, isError: true }]);
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    
    chatMutation.mutate(userMessage);
  };

  return (
    <div className="flex flex-col h-full -mx-4 -my-safe pt-safe">
      <header className="px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          Antigravity Chat
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : msg.isError 
                    ? 'bg-red-950/50 border border-red-500/30 text-red-200 rounded-bl-sm'
                    : 'bg-white/10 border border-white/5 text-gray-100 rounded-bl-sm'
              }`}>
                {msg.isError && <AlertCircle className="w-4 h-4 mb-2 text-red-400 inline-block mr-2" />}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {chatMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-500/30">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="bg-white/10 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+60px)] left-0 w-full p-4 bg-gradient-to-t from-black via-black to-transparent">
        <form onSubmit={handleSend} className="flex gap-2 max-w-lg mx-auto relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Antigravity..."
            className="flex-1 rounded-full pl-4 pr-12 h-12 bg-gray-900 border-white/20 text-white placeholder:text-gray-500 shadow-xl"
            disabled={chatMutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 top-1 h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500"
            disabled={!input.trim() || chatMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
