import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Folder, FileText, ChevronLeft, Upload, Plus, Download, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileItem {
  name: string;
  isDirectory: boolean;
}

export function Files() {
  const [currentPath, setCurrentPath] = useState<string>('~');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const fetchDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const absPath = path.replace('~', '/Users/asiff'); // Same basic MVP expansion
      const { data } = await apiClient.get(`/api/files/list?path=${encodeURIComponent(absPath)}`);
      if (Array.isArray(data)) {
        const parsedItems = data.map(line => {
          const isDir = line.endsWith('/');
          return { name: isDir ? line.slice(0, -1) : line, isDirectory: isDir };
        });
        setItems(parsedItems.sort((a, b) => {
          if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
          return a.isDirectory ? -1 : 1;
        }));
      }
    } catch (err: any) {
      setError(err.response?.data || err.message || 'Error loading directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedFileContent) {
      fetchDirectory(currentPath);
    }
  }, [currentPath, selectedFileContent]);

  const handleItemClick = async (item: FileItem) => {
    const nextPath = currentPath === '~' ? `~/${item.name}` : currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    if (item.isDirectory) {
      setCurrentPath(nextPath);
    } else {
      // Read file
      setLoading(true);
      setError(null);
      try {
        // Resolve absolute path for read API (assuming ~ is a shorthand, might need real absolute path)
        const absPath = nextPath.replace('~', '/Users/asiff'); // Hardcoded based on known discovery for MVP
        const { data } = await apiClient.get(`/api/files/read?path=${encodeURIComponent(absPath)}`);
        setSelectedFileContent(data);
        setSelectedFileName(item.name);
      } catch (err: any) {
        setError(err.response?.data || err.message || 'Error reading file');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (selectedFileContent !== null) {
      setSelectedFileContent(null);
      setSelectedFileName(null);
    } else {
      if (currentPath === '~' || currentPath === '/') return;
      const parts = currentPath.split('/');
      parts.pop();
      setCurrentPath(parts.join('/') || '/');
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    try {
      const absPath = `${currentPath.replace('~', '/Users/asiff')}/${name}`;
      await apiClient.post('/api/files/create-folder', { path: absPath });
      fetchDirectory(currentPath);
    } catch (err: any) {
      alert('Failed to create folder: ' + err.message);
    }
  };

  const handleDownload = () => {
    if (!selectedFileContent || !selectedFileName) return;
    const blob = new Blob([selectedFileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleBack} 
            disabled={currentPath === '~' && selectedFileContent === null}
            className="text-gray-400 hover:text-white shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight truncate">
            {selectedFileName || currentPath}
          </h1>
        </div>
        {!selectedFileContent ? (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={handleCreateFolder} className="text-gray-400 hover:text-white">
              <Plus className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
              <Upload className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <Button size="icon" variant="ghost" onClick={handleDownload} className="text-gray-400 hover:text-white">
            <Download className="w-5 h-5" />
          </Button>
        )}
      </header>

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">Loading...</div>
        ) : selectedFileContent !== null ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
            <Card className="glass-panel h-full flex flex-col">
              <CardContent className="p-0 flex-1 overflow-auto">
                <pre className="p-4 font-mono text-xs text-gray-300">
                  {selectedFileContent}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div 
                  key={item.name}
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleItemClick(item)}
                >
                  <Card className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors cursor-pointer active:scale-[0.98]">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.isDirectory ? (
                          <Folder className="w-5 h-5 text-blue-400 shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{item.name}</span>
                      </div>
                      {item.isDirectory && <ChevronRight className="w-4 h-4 text-gray-600" />}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            {items.length === 0 && !loading && !error && (
              <div className="text-center py-10 text-gray-500 text-sm">Directory is empty</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
