import { NavLink, Outlet } from 'react-router-dom';
import { Home, Terminal as TerminalIcon, Folder, GitBranch, Settings, MessageSquare, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useConnectionStore } from '@/store/connection';

export function MobileLayout() {
  const connectionState = useConnectionStore(state => state.state);
  const latency = useConnectionStore(state => state.latency);

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
      <div className="absolute top-0 left-0 right-0 h-8 flex justify-between items-center px-4 bg-gradient-to-b from-black/80 to-transparent z-40 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full backdrop-blur-md">
          {connectionState === 'connected' && <Wifi className="w-3 h-3 text-green-500" />}
          {connectionState === 'reconnecting' && <RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" />}
          {(connectionState === 'disconnected' || connectionState === 'failed') && <WifiOff className="w-3 h-3 text-red-500" />}
          <span className="text-[10px] font-medium text-gray-300 capitalize">{connectionState}</span>
        </div>
        {latency !== null && connectionState === 'connected' && (
          <div className="bg-black/40 px-2 py-1 rounded-full backdrop-blur-md text-[10px] font-medium text-gray-300">
            {latency}ms
          </div>
        )}
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 pt-safe px-4 safe-area-y relative pt-10">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full border-t border-white/10 bg-black/80 backdrop-blur-xl pb-safe pt-2 px-2 z-50">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300',
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
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
