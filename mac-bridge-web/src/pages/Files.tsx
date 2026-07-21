import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { 
  Folder, FileText, ChevronLeft, Upload, Plus, Download, 
  ChevronRight, Search, MoreVertical, Trash, Edit2, Copy, Move
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: number;
  permissions: string;
  extension: string;
}

export function Files() {
  const [currentPath, setCurrentPath] = useState<string>('~');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenuTarget, setContextMenuTarget] = useState<FileItem | null>(null);

  const fetchDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/api/files/list-detailed?path=${encodeURIComponent(path)}`);
      if (Array.isArray(data)) {
        setItems(data.sort((a, b) => {
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
    if (contextMenuTarget) {
      setContextMenuTarget(null);
      return;
    }
    
    if (item.isDirectory) {
      setCurrentPath(item.path);
      setSearchQuery('');
    } else {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get(`/api/files/read?path=${encodeURIComponent(item.path)}`);
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
      setSearchQuery('');
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    try {
      const absPath = `${currentPath}/${name}`;
      await apiClient.post('/api/files/create-folder', { path: absPath });
      fetchDirectory(currentPath);
    } catch (err: any) {
      alert('Failed to create folder: ' + (err.response?.data || err.message));
    }
  };

  const handleDelete = async (item: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;
    try {
      await apiClient.delete(`/api/files/delete?path=${encodeURIComponent(item.path)}`);
      setContextMenuTarget(null);
      fetchDirectory(currentPath);
    } catch (err: any) {
      alert('Failed to delete: ' + (err.response?.data || err.message));
    }
  };

  const handleRename = async (item: FileItem) => {
    const newName = prompt('Enter new name:', item.name);
    if (!newName || newName === item.name) return;
    try {
      await apiClient.post('/api/files/rename', { path: item.path, newName });
      setContextMenuTarget(null);
      fetchDirectory(currentPath);
    } catch (err: any) {
      alert('Failed to rename: ' + (err.response?.data || err.message));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full space-y-3">
      <header className="py-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleBack} 
              disabled={currentPath === '~' && selectedFileContent === null}
              className="text-gray-400 hover:text-white shrink-0 h-8 w-8"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold tracking-tight truncate">
              {selectedFileName || (currentPath === '~' ? 'Home' : currentPath.split('/').pop() || '/')}
            </h1>
          </div>
          {!selectedFileContent ? (
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={handleCreateFolder} className="text-gray-400 hover:text-white h-8 w-8">
                <Plus className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8">
                <Upload className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8">
              <Download className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        {!selectedFileContent && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <Input 
              placeholder="Search in folder..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 h-9 text-sm rounded-xl"
            />
          </div>
        )}
      </header>

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-4 relative">
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
              {filteredItems.map((item, index) => (
                <motion.div 
                  key={item.path}
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  className="relative"
                >
                  <Card 
                    className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <CardContent className="p-3 pr-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden flex-1" onClick={() => handleItemClick(item)}>
                        {item.isDirectory ? (
                          <Folder className="w-6 h-6 text-blue-400 shrink-0" />
                        ) : (
                          <FileText className="w-6 h-6 text-gray-400 shrink-0" />
                        )}
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate text-white">{item.name}</p>
                          <p className="text-[10px] text-gray-500 flex gap-2">
                            <span>{new Date(item.lastModified).toLocaleDateString()}</span>
                            {!item.isDirectory && <span>{formatSize(item.size)}</span>}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-500 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenuTarget(contextMenuTarget?.path === item.path ? null : item);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Context Menu Dropdown */}
                  {contextMenuTarget?.path === item.path && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-8 top-10 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden w-36"
                    >
                      <button onClick={(e) => { e.stopPropagation(); handleRename(item); }} className="w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 hover:bg-white/5">
                        <Edit2 className="w-3.5 h-3.5" /> Rename
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 hover:bg-white/5 text-red-400 hover:text-red-300 border-t border-white/5">
                        <Trash className="w-3.5 h-3.5" /> Delete
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredItems.length === 0 && !loading && !error && (
              <div className="text-center py-10 text-gray-500 text-sm">
                {searchQuery ? 'No matching files found' : 'Directory is empty'}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Click outside context menu to close */}
      {contextMenuTarget && (
        <div className="fixed inset-0 z-10" onClick={() => setContextMenuTarget(null)} />
      )}
    </div>
  );
}
