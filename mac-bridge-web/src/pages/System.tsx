import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Cpu, MemoryStick, HardDrive, Info, ShieldAlert, CpuIcon, Hammer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export function System() {
  const [activeTab, setActiveTab] = useState<'specs' | 'processes' | 'ports' | 'tools'>('specs');

  const { data: systemInfo, isLoading: sysLoading } = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/system');
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: healthInfo, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/health');
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: processes, isLoading: procLoading } = useQuery({
    queryKey: ['system-processes'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/system/processes');
      return data;
    },
    enabled: activeTab === 'processes',
    refetchInterval: 5000,
  });

  const { data: ports, isLoading: portsLoading } = useQuery({
    queryKey: ['system-ports'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/system/ports');
      return data;
    },
    enabled: activeTab === 'ports',
    refetchInterval: 10000,
  });

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['system-versions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/system/versions');
      return data;
    },
    enabled: activeTab === 'tools',
  });

  if (sysLoading || healthLoading) {
    return <div className="flex h-full items-center justify-center">Loading system data...</div>;
  }

  const specsSections = [
    {
      title: 'Operating System',
      icon: Monitor,
      items: [
        { label: 'OS Version', value: healthInfo?.os },
        { label: 'Hostname', value: systemInfo?.hostname },
        { label: 'Current User', value: systemInfo?.currentUser },
      ]
    },
    {
      title: 'Hardware',
      icon: Cpu,
      items: [
        { label: 'CPU Cores', value: systemInfo?.cpuCores },
        { label: 'System Load', value: systemInfo?.systemLoadAverage?.toFixed(2) },
      ]
    },
    {
      title: 'Memory (RAM)',
      icon: MemoryStick,
      items: [
        { label: 'Total Memory', value: formatBytes(systemInfo?.totalMemoryBytes || 0) },
        { label: 'Free Memory', value: formatBytes(systemInfo?.freeMemoryBytes || 0) },
      ]
    },
    {
      title: 'Storage (Disk)',
      icon: HardDrive,
      items: [
        { label: 'Total Disk Space', value: formatBytes(systemInfo?.totalDiskSpaceBytes || 0) },
        { label: 'Free Disk Space', value: formatBytes(systemInfo?.freeDiskSpaceBytes || 0) },
      ]
    },
    {
      title: 'Bridge Environment',
      icon: Info,
      items: [
        { label: 'Java Version', value: healthInfo?.java },
        { label: 'Antigravity Status', value: healthInfo?.antigravityStatus },
        { label: 'Integration', value: healthInfo?.selectedIntegration },
      ]
    }
  ];

  return (
    <div className="space-y-4 pb-10">
      <header className="py-2">
        <h1 className="text-2xl font-bold tracking-tight">System Info</h1>
      </header>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'specs' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Specs
        </button>
        <button
          onClick={() => setActiveTab('processes')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'processes' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Processes
        </button>
        <button
          onClick={() => setActiveTab('ports')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'ports' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Ports
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'tools' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Tools
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === 'specs' && (
            <motion.div
              key="specs"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              {specsSections.map((section) => (
                <Card key={section.title} className="glass-panel">
                  <CardHeader className="p-4 pb-2 border-b border-white/5">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-300">
                      <section.icon className="w-4 h-4 text-blue-400" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ul className="space-y-3">
                      {section.items.map((item) => (
                        <li key={item.label} className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">{item.label}</span>
                          <span className="font-medium">{item.value || '-'}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {activeTab === 'processes' && (
            <motion.div
              key="processes"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <Card className="glass-panel">
                <CardHeader className="p-4 pb-2 border-b border-white/5">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-300">
                    <CpuIcon className="w-4 h-4 text-green-400" />
                    Top CPU Processes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {procLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading processes...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-gray-500 uppercase tracking-wider font-semibold">
                            <th className="p-3">PID</th>
                            <th className="p-3">CPU %</th>
                            <th className="p-3">Mem %</th>
                            <th className="p-3">Command</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {processes?.map((proc: any, i: number) => (
                            <tr key={i} className="hover:bg-white/5">
                              <td className="p-3 text-gray-400">{proc.pid}</td>
                              <td className="p-3 text-green-400">{proc.cpu}%</td>
                              <td className="p-3 text-blue-400">{proc.memory}%</td>
                              <td className="p-3 max-w-[150px] truncate text-white" title={proc.command}>
                                {proc.command}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'ports' && (
            <motion.div
              key="ports"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <Card className="glass-panel">
                <CardHeader className="p-4 pb-2 border-b border-white/5">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-300">
                    <ShieldAlert className="w-4 h-4 text-orange-400" />
                    Listening Ports (TCP)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {portsLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading ports...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-gray-500 uppercase tracking-wider font-semibold">
                            <th className="p-3">Port</th>
                            <th className="p-3">Command</th>
                            <th className="p-3">PID</th>
                            <th className="p-3">User</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {ports?.map((port: any, i: number) => (
                            <tr key={i} className="hover:bg-white/5">
                              <td className="p-3 text-orange-400 font-bold">{port.port}</td>
                              <td className="p-3 text-white">{port.command}</td>
                              <td className="p-3 text-gray-400">{port.pid}</td>
                              <td className="p-3 text-gray-400">{port.user}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <Card className="glass-panel">
                <CardHeader className="p-4 pb-2 border-b border-white/5">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-300">
                    <Hammer className="w-4 h-4 text-purple-400" />
                    Developer Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {versionsLoading ? (
                    <div className="p-4 text-center text-sm text-gray-500">Loading versions...</div>
                  ) : (
                    <ul className="space-y-4">
                      {versions && Object.entries(versions).map(([tool, version]: [string, any]) => (
                        <li key={tool} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                          <span className="capitalize font-medium text-gray-300">{tool}</span>
                          <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-xs text-gray-400">
                            {version}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
