import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Apple } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiClient.post('/api/auth/login', { username, password });
        login(data.token);
        navigate('/');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Authentication failed');
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
        className="w-full max-w-sm z-10"
      >
        <Card className="glass-panel border-white/10 shadow-2xl overflow-hidden">
          <CardHeader className="space-y-3 pb-6 pt-8 text-center">
            <div className="mx-auto bg-white/10 p-3 rounded-2xl w-fit mb-2 shadow-inner">
              <Apple className="w-8 h-8 text-white" />
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
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-11 mt-4 transition-colors">
                {loading ? 'Connecting...' : 'Connect'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
