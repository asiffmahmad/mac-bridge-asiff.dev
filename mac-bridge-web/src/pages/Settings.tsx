import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';
import { useDiscoveryStore } from '@/store/discovery';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { LogOut, Globe, Moon, Sun, Bell, Download, Upload, Laptop, Copy, RefreshCw, PlugZap, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

export function Settings() {
  const logout = useAuthStore((state) => state.logout);
  const hostname = useAuthStore((state) => state.hostname);
  const version = useAuthStore((state) => state.version);
  const { bridgeId } = useDiscoveryStore();

  const { 
    bridgeUrl, setBridgeUrl, 
    tunnelUrl, setTunnelUrl,
    localIp, setLocalIp,
    theme, setTheme,
    autoReconnect, setAutoReconnect,
    notifications, setNotifications,
    exportSettings, importSettings
  } = useSettingsStore();

  const [importStr, setImportStr] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [tunnelStatus, setTunnelStatus] = useState<any>(null);
  const [restarting, setRestarting] = useState(false);

  const fetchTunnelStatus = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/tunnel/status');
      setTunnelStatus(data);
      if (data.tunnelUrl) setTunnelUrl(data.tunnelUrl);
    } catch { /* bridge may be starting */ }
  }, [setTunnelUrl]);

  useEffect(() => {
    fetchTunnelStatus();
    const interval = setInterval(fetchTunnelStatus, 10_000);
    return () => clearInterval(interval);
  }, [fetchTunnelStatus]);

  const handleRestartTunnel = async () => {
    setRestarting(true);
    try {
      await apiClient.post('/api/tunnel/restart');
      setTimeout(fetchTunnelStatus, 4000);
    } finally {
      setTimeout(() => setRestarting(false), 4000);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleExport = () => {
    const data = exportSettings();
    navigator.clipboard.writeText(data);
    alert('Settings copied to clipboard!');
  };

  const handleImport = () => {
    if (!importStr) return;
    const success = importSettings(importStr);
    setImportStatus(success ? 'success' : 'error');
    if (success) {
      setTimeout(() => setImportStatus('idle'), 3000);
      setImportStr('');
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <header className="py-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-panel">
          <CardHeader className="p-4 pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-400">
              <Laptop className="w-4 h-4" />
              Bridge Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Hostname</span>
              <span className="text-white font-medium">{hostname || 'Unknown'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Version</span>
              <span className="text-white font-medium">{version || 'Unknown'}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tunnel Status Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="glass-panel">
          <CardHeader className="p-4 pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-cyan-400">
              <PlugZap className="w-4 h-4" />
              Tunnel Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Status</span>
              <div className="flex items-center gap-1.5">
                {tunnelStatus?.running
                  ? <><Wifi className="w-3 h-3 text-green-400" /><span className="text-green-400 font-medium">Active</span></>
                  : <><WifiOff className="w-3 h-3 text-red-400" /><span className="text-red-400 font-medium">Offline</span></>
                }
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Current Tunnel URL</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white font-mono break-all flex-1">
                  {tunnelStatus?.tunnelUrl || tunnelUrl || 'Starting...'}
                </span>
                {(tunnelStatus?.tunnelUrl || tunnelUrl) && (
                  <button
                    onClick={() => navigator.clipboard.writeText(tunnelStatus?.tunnelUrl || tunnelUrl)}
                    className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            {bridgeId && (
              <div className="space-y-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Bridge ID (Auto-Discovery)</span>
                <p className="text-[10px] text-gray-500 font-mono break-all">{bridgeId.substring(0, 40)}...</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent border-white/15 text-cyan-300 hover:text-white hover:bg-white/10"
              onClick={handleRestartTunnel}
              disabled={restarting}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${restarting ? 'animate-spin' : ''}`} />
              {restarting ? 'Restarting Tunnel...' : 'Restart Tunnel'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>


      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-panel">
          <CardHeader className="p-4 pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-400">
              <Globe className="w-4 h-4" />
              Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Bridge URL (Active)</label>
              <Input
                type="url"
                value={bridgeUrl}
                onChange={(e) => setBridgeUrl(e.target.value)}
                placeholder="https://..."
                className="bg-black/50 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Tunnel URL</label>
              <Input
                type="url"
                value={tunnelUrl}
                onChange={(e) => setTunnelUrl(e.target.value)}
                placeholder="https://your-tunnel.trycloudflare.com"
                className="bg-black/50 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Local IP</label>
              <Input
                type="text"
                value={localIp}
                onChange={(e) => setLocalIp(e.target.value)}
                placeholder="192.168.x.x:8080"
                className="bg-black/50 border-white/10"
              />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <label className="text-sm text-white font-medium">Auto-Reconnect</label>
                <p className="text-xs text-gray-500">Automatically retry connection on drop</p>
              </div>
              <Switch checked={autoReconnect} onCheckedChange={setAutoReconnect} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-panel">
          <CardHeader className="p-4 pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-400">
              <Bell className="w-4 h-4" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm text-white font-medium">Notifications</label>
                <p className="text-xs text-gray-500">Alerts for connections and background tasks</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            
            <div className="pt-2">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-2">Appearance</label>
              <div className="flex gap-2">
                <Button 
                  variant={theme === 'dark' ? 'default' : 'outline'} 
                  className={theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 flex-1' : 'bg-transparent border-white/20 flex-1'}
                  onClick={() => setTheme('dark')}
                  size="sm"
                >
                  <Moon className="w-4 h-4 mr-2" /> Dark
                </Button>
                <Button 
                  variant={theme === 'light' ? 'default' : 'outline'} 
                  className={theme === 'light' ? 'bg-white text-black hover:bg-gray-200 flex-1' : 'bg-transparent border-white/20 flex-1'}
                  onClick={() => setTheme('light')}
                  size="sm"
                  disabled
                >
                  <Sun className="w-4 h-4 mr-2" /> Light (Soon)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass-panel">
          <CardHeader className="p-4 pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-400">
              <Download className="w-4 h-4" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Button variant="outline" className="w-full bg-transparent border-white/20 text-white" onClick={handleExport}>
              <Upload className="w-4 h-4 mr-2" /> Export Settings to Clipboard
            </Button>
            
            <div className="space-y-2">
              <Input
                type="text"
                value={importStr}
                onChange={(e) => setImportStr(e.target.value)}
                placeholder="Paste settings JSON here"
                className="bg-black/50 border-white/10 text-xs font-mono"
              />
              <Button 
                variant="secondary" 
                className={`w-full ${importStatus === 'success' ? 'bg-green-600 text-white' : importStatus === 'error' ? 'bg-red-600 text-white' : ''}`}
                onClick={handleImport}
                disabled={!importStr}
              >
                <Download className="w-4 h-4 mr-2" /> 
                {importStatus === 'success' ? 'Imported Successfully!' : importStatus === 'error' ? 'Import Failed' : 'Import Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Button 
          variant="destructive" 
          className="w-full bg-red-900/50 hover:bg-red-900/80 text-red-200 border border-red-900/50 h-12 rounded-xl" 
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout Device
        </Button>
      </motion.div>
    </div>
  );
}
