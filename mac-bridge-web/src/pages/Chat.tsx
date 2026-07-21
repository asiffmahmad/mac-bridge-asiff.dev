import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, AlertCircle, Plus, Trash2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStompClient } from '@/hooks/useStompClient';

interface ChatSession {
  id: string;
  title: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

export function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const { client } = useStompClient();

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending]);

  // Load list of sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await apiClient.get('/api/antigravity/sessions');
        setSessions(data);
        if (data.length > 0) {
          // Select most recent session
          selectSession(data[0].id);
        } else {
          startNewSession();
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
        startNewSession();
      }
    };
    fetchSessions();
  }, []);

  // Listen to WebSocket stream for the selected session
  useEffect(() => {
    if (client && currentSessionId) {
      const subscription = client.subscribe(`/topic/antigravity/${currentSessionId}`, (message) => {
        const event = JSON.parse(message.body);
        
        if (event.type === 'start') {
          // Clear any pending state or prepare
          setMessages(prev => [...prev, { id: 'temp-streaming', role: 'assistant', content: '' }]);
        } else if (event.type === 'token') {
          setMessages(prev => {
            const index = prev.findIndex(m => m.id === 'temp-streaming');
            if (index > -1) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                content: updated[index].content + event.content
              };
              return updated;
            } else {
              return [...prev, { id: 'temp-streaming', role: 'assistant', content: event.content }];
            }
          });
        } else if (event.type === 'end') {
          // Refresh message history from REST to ensure sync, or just finalize temp message id
          setMessages(prev => {
            const index = prev.findIndex(m => m.id === 'temp-streaming');
            if (index > -1) {
              const updated = [...prev];
              updated[index].id = Date.now().toString(); // convert temp to stable id
              return updated;
            }
            return prev;
          });
          setIsPending(false);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [client, currentSessionId]);

  const selectSession = async (id: string) => {
    setCurrentSessionId(id);
    setShowSessions(false);
    try {
      const { data } = await apiClient.get(`/api/antigravity/sessions/${id}`);
      setMessages(data.map((m: any, idx: number) => ({
        id: `msg-${idx}`,
        role: m.role,
        content: m.content
      })));
    } catch (e) {
      setMessages([]);
    }
  };

  const startNewSession = () => {
    const newId = Math.random().toString(36).substring(7);
    setCurrentSessionId(newId);
    setMessages([{ id: 'welcome', role: 'assistant', content: 'Hello! I am Antigravity. Ask me anything about this Mac.' }]);
    setShowSessions(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this session?')) return;
    try {
      await apiClient.delete(`/api/antigravity/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        startNewSession();
      }
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending || !currentSessionId) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsPending(true);

    try {
      await apiClient.post('/api/antigravity/chat', { 
        sessionId: currentSessionId, 
        message: userMessage 
      });
      
      // Update session title list if it was a new session
      const { data } = await apiClient.get('/api/antigravity/sessions');
      setSessions(data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to connect to Antigravity';
      setMessages(prev => {
        // Clean up the temp streaming block if there is one
        const cleaned = prev.filter(m => m.id !== 'temp-streaming');
        return [...cleaned, { id: Date.now().toString(), role: 'assistant', content: errorMsg, isError: true }];
      });
      setIsPending(false);
    }
  };

  const handleCancel = async () => {
    if (!currentSessionId) return;
    try {
      await apiClient.post(`/api/antigravity/cancel/${currentSessionId}`);
      setIsPending(false);
    } catch (e) {}
  };

  return (
    <div className="flex flex-col h-full -mx-4 -my-safe pt-safe relative">
      <header className="px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          Antigravity Chat
        </h1>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-xs text-gray-400 hover:text-white" onClick={() => setShowSessions(!showSessions)}>
            Sessions
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white" onClick={startNewSession}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Sidebar Panel for Sessions */}
      <AnimatePresence>
        {showSessions && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black z-20"
              onClick={() => setShowSessions(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 h-full w-64 bg-[#1e1e1e] border-l border-white/10 z-30 flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Chat Sessions</span>
                <Button size="sm" variant="ghost" onClick={() => setShowSessions(false)} className="text-xs text-gray-400">Close</Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.map(s => (
                  <div 
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    className={`p-3 rounded-lg text-xs flex justify-between items-center cursor-pointer transition-colors ${
                      currentSessionId === s.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    <span className="truncate flex-1 pr-2">{s.title || 'Untitled Session'}</span>
                    <button onClick={(e) => handleDeleteSession(e, s.id)} className="text-gray-600 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                
                {/* Rudimentary Code Block / Markdown renderer */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content.includes("```") ? (
                    msg.content.split("```").map((chunk, idx) => {
                      if (idx % 2 === 1) {
                        return (
                          <pre key={idx} className="bg-black/50 border border-white/10 rounded-xl p-3 my-2 font-mono text-xs text-gray-300 overflow-x-auto">
                            <code>{chunk.replace(/^[a-zA-Z]+\n/, '')}</code>
                          </pre>
                        );
                      }
                      return <span key={idx}>{chunk}</span>;
                    })
                  ) : (
                    msg.content
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isPending && (
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
            disabled={isPending}
          />
          {isPending ? (
            <Button 
              type="button" 
              onClick={handleCancel}
              size="icon" 
              className="absolute right-1 top-1 h-10 w-10 rounded-full bg-red-600 hover:bg-red-500 animate-pulse"
            >
              <StopCircle className="w-4 h-4 text-white" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 top-1 h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500"
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
