import { NavLink, Outlet } from 'react-router-dom';
import { Home, Terminal as TerminalIcon, Folder, GitBranch, Settings, MessageSquare, Wifi, WifiOff, RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnectionManager } from '@/hooks/useConnectionManager';
import type { ConnectionStatus } from '@/hooks/useConnectionManager';

function StatusDot({ status }: { status: ConnectionStatus }) {
  if (status === 'online') {
    return (
      <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full backdrop-blur-md">
        <Wifi className="w-3 h-3 text-green-500" />
        <span className="text-[10px] font-medium text-green-400">Online</span>
      </div>
    );
  }
  if (status === 'reconnecting') {
    return (
      <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-1 rounded-full backdrop-blur-md border border-yellow-500/20">
        <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" />
        <span className="text-[10px] font-medium text-yellow-300">Reconnecting...</span>
      </div>
    );
  }
  if (status === 'discovering') {
    return (
      <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded-full backdrop-blur-md border border-blue-500/20">
        <Search className="w-3 h-3 text-blue-400 animate-pulse" />
        <span className="text-[10px] font-medium text-blue-300">Finding Tunnel...</span>
      </div>
    );
  }
  // offline
  return (
    <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-full backdrop-blur-md border border-red-500/20">
      <WifiOff className="w-3 h-3 text-red-400" />
      <span className="text-[10px] font-medium text-red-300">Bridge Offline</span>
    </div>
  );
}

export function MobileLayout() {
  const status = useConnectionManager();

  const navItems = [
    { to: '/', icon: Home, label: 'Dash' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/terminal', icon: TerminalIcon, label: 'Term' },
    { to: '/files', icon: Folder, label: 'Files' },
    { to: '/git', icon: GitBranch, label: 'Git' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-black text-white overflow-hidden">

      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-10 flex justify-between items-center px-3 z-40 pointer-events-none">
        <StatusDot status={status} />
      </div>

      {/* Offline/Reconnecting Banner */}
      <AnimatePresence>
        {status !== 'online' && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed top-10 left-0 right-0 z-30 mx-4 mt-1 rounded-xl px-4 py-2 text-center text-xs font-medium backdrop-blur-md',
              status === 'offline' && 'bg-red-900/60 text-red-100 border border-red-700/40',
              status === 'reconnecting' && 'bg-yellow-900/60 text-yellow-100 border border-yellow-700/40',
              status === 'discovering' && 'bg-blue-900/60 text-blue-100 border border-blue-700/40',
            )}
          >
            {status === 'offline' && '⚠️ Mac Bridge is offline. Retrying...'}
            {status === 'reconnecting' && '🔄 Lost connection. Reconnecting to Mac...'}
            {status === 'discovering' && '🔍 Searching for new tunnel URL automatically...'}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 px-4 relative pt-12">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full border-t border-white/10 bg-black/80 backdrop-blur-xl pb-safe pt-2 px-2 z-50">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative',
                  isActive ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-6 w-6 mb-1', isActive && 'stroke-[2.5px]')} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
