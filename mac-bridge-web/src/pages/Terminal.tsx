import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Terminal as TerminalIcon, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStompClient } from '@/hooks/useStompClient';

interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error';
}

export function Terminal() {
  const [history, setHistory] = useState<TerminalLine[]>([
    { id: 'start', text: 'Mac Bridge Terminal Emulator', type: 'output' },
    { id: 'start2', text: 'Type a command (e.g. ls, pwd, java -version)', type: 'output' }
  ]);
  const [command, setCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { client, connected } = useStompClient();

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  useEffect(() => {
    if (client && connected) {
      const subscription = client.subscribe('/topic/terminal', (message) => {
        setHistory(prev => [...prev, { id: Date.now().toString() + Math.random(), text: message.body, type: 'output' }]);
      });
      return () => subscription.unsubscribe();
    }
  }, [client, connected]);

  const executeCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim();
    if (!cmd || isRunning) return;

    setCommand('');
    setHistory(prev => [...prev, { id: Date.now().toString(), text: `$ ${cmd}`, type: 'input' }]);
    setIsRunning(true);

    try {
      await apiClient.post('/api/terminal/run', { command: cmd });
      // We don't push the output immediately, the WebSocket will stream it!
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message || 'Unknown error';
      setHistory(prev => [...prev, { id: Date.now().toString(), text: errorMsg, type: 'error' }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full -mx-4 -my-safe pt-safe">
      <header className="px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10 flex items-center gap-2">
        <TerminalIcon className="w-5 h-5 text-green-500" />
        <h1 className="text-lg font-semibold">Terminal</h1>
      </header>

      <div className="flex-1 bg-[#1e1e1e] p-4 overflow-y-auto font-mono text-sm pb-32">
        {history.map((line) => (
          <div 
            key={line.id} 
            className={`mb-1 whitespace-pre-wrap break-all ${
              line.type === 'input' ? 'text-green-400 font-bold' : 
              line.type === 'error' ? 'text-red-400' : 'text-gray-300'
            }`}
          >
            {line.text}
          </div>
        ))}
        {isRunning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500 flex items-center gap-2 mt-2">
            <span className="animate-pulse">Running...</span>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+60px)] left-0 w-full p-2 bg-[#2d2d2d] border-t border-white/10">
        <form onSubmit={executeCommand} className="flex items-center gap-2">
          <span className="text-green-500 font-bold pl-2">$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-sm px-2 py-3"
            placeholder="Enter command..."
            disabled={isRunning}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck="false"
          />
          <button 
            type="submit" 
            disabled={!command.trim() || isRunning}
            className="p-2 text-white/50 hover:text-white disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
