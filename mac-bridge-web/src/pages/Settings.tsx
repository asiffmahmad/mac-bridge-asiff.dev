import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, Globe, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export function Settings() {
  const logout = useAuthStore((state) => state.logout);
  const { bridgeUrl, setBridgeUrl, theme, setTheme } = useSettingsStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-4">
      <header className="py-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-panel">
          <CardHeader className="p-4 pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-400">
              <Globe className="w-4 h-4" />
              Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Bridge URL</label>
              <Input
                type="url"
                value={bridgeUrl}
                onChange={(e) => setBridgeUrl(e.target.value)}
                placeholder="https://your-tunnel.trycloudflare.com"
                className="bg-black/50 border-white/10"
              />
              <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                Enter your Tailscale IP, Cloudflare Tunnel URL, or local address. Updates immediately.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-panel">
          <CardHeader className="p-4 pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-400">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex gap-2">
            <Button 
              variant={theme === 'dark' ? 'default' : 'outline'} 
              className={theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-transparent border-white/20'}
              onClick={() => setTheme('dark')}
              size="sm"
            >
              Dark
            </Button>
            <Button 
              variant={theme === 'light' ? 'default' : 'outline'} 
              className={theme === 'light' ? 'bg-white text-black hover:bg-gray-200' : 'bg-transparent border-white/20'}
              onClick={() => setTheme('light')}
              size="sm"
              disabled // MVP is dark mode only
            >
              Light (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button 
          variant="destructive" 
          className="w-full bg-red-900/50 hover:bg-red-900/80 text-red-200 border border-red-900/50" 
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </motion.div>
    </div>
  );
}
