import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Terminal as TerminalIcon, Play, Square, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStompClient } from '@/hooks/useStompClient';

interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error';
}

export function Terminal() {
  const [history, setHistory] = useState<TerminalLine[]>([
    { id: 'start', text: 'Mac Bridge Terminal', type: 'output' },
  ]);
  const [command, setCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [cwd, setCwd] = useState('~');
  const [sessionId] = useState<string>(() => Math.random().toString(36).substring(7));
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { client } = useStompClient();

  useEffect(() => {
    scrollToBottom();
  }, [history, isRunning]);

  useEffect(() => {
    if (client) {
      const subscription = client.subscribe(`/topic/terminal/${sessionId}`, (message) => {
        setHistory(prev => [...prev, { id: Date.now().toString() + Math.random(), text: message.body, type: 'output' }]);
      });
      return () => subscription.unsubscribe();
    }
  }, [client, sessionId]);

  const executeCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = command.trim();
    if (!cmd || isRunning) return;

    if (cmd === 'clear') {
      setHistory([]);
      setCommand('');
      return;
    }

    setCmdHistory(prev => [cmd, ...prev]);
    setHistoryIndex(-1);
    
    // Optimistic UI for cd
    if (cmd.startsWith('cd ')) {
      const target = cmd.substring(3).trim();
      setCwd(target);
      // We still run it to verify, but update UI immediately
    }

    setCommand('');
    setHistory(prev => [...prev, { id: Date.now().toString(), text: `${cwd} $ ${cmd}`, type: 'input' }]);
    setIsRunning(true);

    try {
      await apiClient.post('/api/terminal/run', { 
        command: cmd, 
        cwd: cwd === '~' ? '' : cwd,
        sessionId 
      });
      // The websocket streams the output line by line, but the response also contains the full output if needed.
      // We rely on WS for streaming, but if the command fails, the exit code is caught.
      
      // If we did a cd, we could optionally update cwd based on a pwd command run implicitly, 
      // but simple string replacement works for MVP.
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message || 'Unknown error';
      setHistory(prev => [...prev, { id: Date.now().toString(), text: errorMsg, type: 'error' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleInterrupt = async () => {
    if (!isRunning) return;
    try {
      await apiClient.post(`/api/terminal/interrupt/${sessionId}`);
    } catch (e) {
      console.error("Failed to interrupt", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < cmdHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setCommand(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommand(cmdHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full -mx-4 -my-safe pt-safe">
      <header className="px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-green-500" />
          <h1 className="text-lg font-semibold">Terminal</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{cwd}</span>
          <button onClick={() => setHistory([])} className="hover:text-white" title="Clear">
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
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
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-sm px-2 py-3"
            placeholder="Enter command..."
            autoCapitalize="none"
            autoComplete="off"
            spellCheck="false"
          />
          {isRunning ? (
            <button 
              type="button" 
              onClick={handleInterrupt}
              className="p-2 text-red-400 hover:text-red-300"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={!command.trim()}
              className="p-2 text-white/50 hover:text-white disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
