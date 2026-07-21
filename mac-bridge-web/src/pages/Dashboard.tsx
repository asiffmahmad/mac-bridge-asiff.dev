import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Cpu, HardDrive, MemoryStick, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export function Dashboard() {
  const { data: systemInfo, isError: systemError } = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/system');
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: healthInfo, isError: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/health');
      return data;
    },
    refetchInterval: 5000,
  });

  const isOnline = !systemError && !healthError && systemInfo;

  return (
    <div className="space-y-4">
      <header className="py-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {/* Status Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-panel overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1 h-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
                Mac Status
                {isOnline ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold truncate">
                {systemInfo?.hostname || 'Offline'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {healthInfo?.bridgeStatus || 'Bridge Unreachable'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* CPU Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-panel">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
                CPU Cores
                <Cpu className="w-4 h-4 text-blue-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">
                {systemInfo?.cpuCores || '-'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Load: {systemInfo?.systemLoadAverage ? systemInfo.systemLoadAverage.toFixed(2) : '-'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Memory Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-panel">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
                Memory
                <MemoryStick className="w-4 h-4 text-purple-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">
                {systemInfo ? formatBytes(systemInfo.freeMemoryBytes) : '-'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Free of {systemInfo ? formatBytes(systemInfo.totalMemoryBytes) : '-'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Disk Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-panel">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
                Disk
                <HardDrive className="w-4 h-4 text-orange-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">
                {systemInfo ? formatBytes(systemInfo.freeDiskSpaceBytes) : '-'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Free of {systemInfo ? formatBytes(systemInfo.totalDiskSpaceBytes) : '-'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="glass-panel mt-4">
          <CardHeader className="p-4 pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Running Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex items-center justify-center min-h-[100px] text-gray-500 text-sm">
            {isOnline ? 'No active background tasks' : 'Cannot connect to bridge'}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
