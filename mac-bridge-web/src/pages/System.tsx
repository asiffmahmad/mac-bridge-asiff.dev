import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Cpu, MemoryStick, HardDrive, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export function System() {
  const { data: systemInfo, isLoading: sysLoading } = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/system');
      return data;
    },
  });

  const { data: healthInfo, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/health');
      return data;
    },
  });

  if (sysLoading || healthLoading) {
    return <div className="flex h-full items-center justify-center">Loading system data...</div>;
  }

  const sections = [
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
    <div className="space-y-4">
      <header className="py-2">
        <h1 className="text-2xl font-bold tracking-tight">System Info</h1>
      </header>

      <div className="space-y-4 pb-4">
        {sections.map((section, index) => (
          <motion.div 
            key={section.title}
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-panel">
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
