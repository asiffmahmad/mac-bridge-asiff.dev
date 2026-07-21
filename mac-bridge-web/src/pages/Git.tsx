import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, GitCommit, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export function Git() {
  const [gitStatus, setGitStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGitData = async () => {
    setLoading(true);
    setError(null);
    try {
      // The bridge currently only allows specific commands. If git is not allowed, it will return a 403.
      const { data } = await apiClient.post('/api/terminal/run', { command: 'git status' });
      setGitStatus(data);
    } catch (err: any) {
      const errorMsg = err.response?.data || err.message || 'Unknown error';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGitData();
  }, []);

  return (
    <div className="space-y-4">
      <header className="py-2 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Git Status</h1>
        <Button size="icon" variant="ghost" onClick={fetchGitData} disabled={loading} className="text-gray-400 hover:text-white">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      {error ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-red-950/20 border-red-500/20">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Backend Restriction
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm text-red-200/80">
              {error}
              <p className="mt-2 text-xs">
                To view Git status, you need to update the Spring Boot Bridge to allow 'git' commands in the TerminalController.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-panel">
              <CardHeader className="p-4 pb-2 border-b border-white/5">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-400">
                  <GitBranch className="w-4 h-4" />
                  Branch & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap">
                  {gitStatus || 'No status available'}
                </pre>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-panel">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-400" />
                    Changed Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold">N/A</div>
                </CardContent>
              </Card>
              <Card className="glass-panel">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-purple-400" />
                    Recent Commits
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold">N/A</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
