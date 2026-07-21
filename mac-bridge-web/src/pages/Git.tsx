import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitBranch, GitCommit, RefreshCw, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface GitStatus {
  branch: string;
  staged: string[];
  modified: string[];
  untracked: string[];
}

interface GitCommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export function Git() {
  const [repoPath, setRepoPath] = useState<string>(() => localStorage.getItem('mac-bridge-git-path') || '~');
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommitInfo[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [commitMessage, setCommitMessage] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchGitData = async () => {
    if (!repoPath) return;
    setLoading(true);
    setError(null);
    localStorage.setItem('mac-bridge-git-path', repoPath);
    
    try {
      const [statusRes, logRes] = await Promise.all([
        apiClient.get(`/api/git/status?path=${encodeURIComponent(repoPath)}`),
        apiClient.get(`/api/git/log?path=${encodeURIComponent(repoPath)}&limit=5`)
      ]);
      
      setStatus(statusRes.data);
      setCommits(logRes.data);
    } catch (err: any) {
      setError(err.response?.data || err.message || 'Error loading git data. Is this a git repository?');
      setStatus(null);
      setCommits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGitData();
  }, []);

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage || !repoPath) return;
    
    setActionLoading('commit');
    try {
      await apiClient.post('/api/git/commit', { repoPath, message: commitMessage });
      setCommitMessage('');
      fetchGitData();
    } catch (err: any) {
      alert('Commit failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (action: 'push' | 'pull') => {
    if (!repoPath) return;
    setActionLoading(action);
    try {
      const { data } = await apiClient.post(`/api/git/${action}`, { path: repoPath });
      alert(`${action} successful:\n${data.message}`);
      fetchGitData();
    } catch (err: any) {
      alert(`${action} failed: ` + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <header className="py-2 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Git</h1>
        <Button size="icon" variant="ghost" onClick={fetchGitData} disabled={loading} className="text-gray-400 hover:text-white">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      <div className="flex gap-2">
        <Input 
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
          placeholder="Repository path (e.g. ~/projects/my-app)"
          className="bg-white/5 border-white/10"
        />
        <Button onClick={fetchGitData} variant="secondary">Load</Button>
      </div>

      {error ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-red-950/20 border-red-500/20">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm text-red-200/80">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </CardContent>
          </Card>
        </motion.div>
      ) : status && (
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-panel">
              <CardHeader className="p-4 pb-2 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-400">
                  <GitBranch className="w-4 h-4" />
                  {status.branch || 'No branch'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400" onClick={() => handleAction('pull')} disabled={!!actionLoading}>
                    <Download className={`w-4 h-4 ${actionLoading === 'pull' ? 'animate-pulse' : ''}`} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-purple-400" onClick={() => handleAction('push')} disabled={!!actionLoading}>
                    <Upload className={`w-4 h-4 ${actionLoading === 'push' ? 'animate-pulse' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Changes</h4>
                    <ul className="text-sm space-y-1">
                      {status.staged.map(f => <li key={f} className="text-green-400 truncate">{f}</li>)}
                      {status.modified.map(f => <li key={f} className="text-yellow-400 truncate">{f}</li>)}
                      {status.untracked.map(f => <li key={f} className="text-red-400 truncate">{f}</li>)}
                      {(status.staged.length + status.modified.length + status.untracked.length === 0) && (
                        <li className="text-gray-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Working tree clean</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                {(status.staged.length > 0 || status.modified.length > 0 || status.untracked.length > 0) && (
                  <form onSubmit={handleCommit} className="pt-2 flex gap-2">
                    <Input 
                      placeholder="Commit message..." 
                      value={commitMessage}
                      onChange={e => setCommitMessage(e.target.value)}
                      className="bg-black/50 border-white/10 text-sm"
                    />
                    <Button type="submit" disabled={!commitMessage || !!actionLoading} className="shrink-0 bg-blue-600 hover:bg-blue-500">
                      Commit
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-panel">
              <CardHeader className="p-4 pb-2 border-b border-white/5">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-400">
                  <GitCommit className="w-4 h-4 text-purple-400" />
                  Recent Commits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-white/5">
                  {commits.map(commit => (
                    <li key={commit.hash} className="p-4 hover:bg-white/5 transition-colors">
                      <p className="text-sm text-white font-medium mb-1">{commit.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{commit.author}</span>
                        <span>{commit.date}</span>
                        <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{commit.hash.substring(0, 7)}</span>
                      </div>
                    </li>
                  ))}
                  {commits.length === 0 && (
                    <li className="p-4 text-sm text-gray-500 text-center">No commits found</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
