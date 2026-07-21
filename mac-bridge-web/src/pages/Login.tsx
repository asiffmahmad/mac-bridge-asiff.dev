import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Apple, Wifi, WifiOff, Settings } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const { bridgeUrl, setBridgeUrl } = useSettingsStore();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [localBridgeUrl, setLocalBridgeUrl] = useState(bridgeUrl);

  useEffect(() => {
    checkBridge(localBridgeUrl);
  }, [localBridgeUrl]);

  const checkBridge = async (url: string) => {
    setBridgeStatus('checking');
    try {
      await apiClient.get(`${url}/api/bridge/info`, { timeout: 3000 });
      setBridgeStatus('online');
    } catch (err) {
      setBridgeStatus('offline');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalBridgeUrl(e.target.value);
  };

  const handleUrlBlur = () => {
    if (localBridgeUrl !== bridgeUrl) {
      setBridgeUrl(localBridgeUrl);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiClient.post(`${localBridgeUrl}/api/auth/login`, { username, password });
        login(data.token, data.refreshToken, data.hostname, data.version);
        navigate('/');
      } catch (err: any) {
        setError(err.response?.data || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-black p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm z-10 space-y-4"
      >
        <Card className="glass-panel border-white/10 shadow-2xl overflow-hidden">
          <CardHeader className="space-y-3 pb-4 pt-8 text-center relative">
            <Link to="/pair" className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
            <div className="mx-auto bg-white/10 p-3 rounded-2xl w-fit mb-2 shadow-inner relative">
              <Apple className="w-8 h-8 text-white" />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black flex items-center justify-center ${
                bridgeStatus === 'online' ? 'bg-green-500' : 
                bridgeStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
              }`}>
                {bridgeStatus === 'online' && <Wifi className="w-2 h-2 text-white" />}
                {bridgeStatus === 'offline' && <WifiOff className="w-2 h-2 text-white" />}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Mac Bridge
            </CardTitle>
            <p className="text-sm text-gray-400">Sign in to control your Mac remotely</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="Bridge URL (e.g. https://...)"
                  value={localBridgeUrl}
                  onChange={handleUrlChange}
                  onBlur={handleUrlBlur}
                  className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500 ${
                    bridgeStatus === 'offline' ? 'border-red-500/50' : ''
                  }`}
                  required
                />
                {bridgeStatus === 'offline' && (
                  <p className="text-xs text-red-400">Cannot reach Bridge at this URL</p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm font-medium">{error}</div>
              )}
              <Button 
                type="submit" 
                disabled={loading || bridgeStatus === 'offline'} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-11 mt-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Link to="/pair" className="text-sm text-gray-400 hover:text-white transition-colors">
            Pair new device via QR Code →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
