import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { QrCode, ArrowLeft } from 'lucide-react';

export function Pair() {
  const [code, setCode] = useState('');
  const [deviceName, setDeviceName] = useState('My iPhone');
  const pair = useAuthStore((state) => state.pair);
  const navigate = useNavigate();
  const { bridgeUrl } = useSettingsStore();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code && deviceName) {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiClient.post(`${bridgeUrl}/api/pairing/verify`, { 
          code, 
          deviceName 
        });
        pair(data.token, data.refreshToken, data.deviceId);
        navigate('/');
      } catch (err: any) {
        setError(err.response?.data || 'Pairing failed. Check code and URL.');
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
        <Card className="glass-panel border-white/10 shadow-2xl overflow-hidden relative">
          <Link to="/login" className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <CardHeader className="space-y-3 pb-4 pt-10 text-center">
            <div className="mx-auto bg-white/10 p-3 rounded-2xl w-fit mb-2 shadow-inner">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Pair Device
            </CardTitle>
            <p className="text-sm text-gray-400">Enter the 6-digit code shown on your Mac</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePair} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="6-Digit Pairing Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500 text-center text-xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Device Name (e.g. My iPhone)"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm font-medium text-center">{error}</div>
              )}
              <Button 
                type="submit" 
                disabled={loading || code.length < 6} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-11 mt-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Pairing...' : 'Pair'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
