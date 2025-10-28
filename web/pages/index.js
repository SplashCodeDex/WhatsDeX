import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/use-toast';
import {
  ChartBarIcon,
  UsersIcon,
  CpuChipIcon,
  SignalIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';
import { Badge } from '../components/ui/badge';
import Layout from '../components/common/Layout';
import { cn } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';
import { getSocket } from '../socket';
import { AnimatedList } from '@/components/ui/animated-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberTicker } from '@/components/ui/number-ticker';

const getChangeTypeClass = (changeType) => {
  switch (changeType) {
    case 'positive':
      return 'text-green-600 dark:text-green-400';
    case 'negative':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
};

// Activity Status Badge Configuration
const getActivityStatusConfig = (status) => {
  switch (status) {
    case 'success':
      return {
        variant: 'success',
        icon: CheckCircleIcon,
        label: 'Success',
      };
    case 'error':
      return {
        variant: 'error',
        icon: ExclamationTriangleIcon,
        label: 'Error',
      };
    case 'processing':
      return {
        variant: 'info',
        icon: ClockIcon,
        label: 'Processing',
      };
    case 'warning':
      return {
        variant: 'warning',
        icon: ExclamationTriangleIcon,
        label: 'Warning',
      };
    case 'fast':
      return {
        variant: 'success',
        icon: BoltIcon,
        label: 'Fast',
      };
    default:
      return {
        variant: 'default',
        icon: SignalIcon,
        label: 'Unknown',
      };
  }


export const ActivityItem = ({ activity }) => {
  const statusConfig = getActivityStatusConfig(activity.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{activity.user}</CardTitle>
        <Badge variant={statusConfig.variant} className="flex-shrink-0">
          {statusConfig.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground truncate">{activity.action}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {activity.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {activity.duration && (
            <span className="flex items-center gap-1">
              <BoltIcon className="w-3 h-3" />
              {activity.duration}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const StatCard = ({ title, value, change, changeType, icon: Icon, variant = 'default' }) => (
  <Card className={cn('w-full', variant === 'accent' && 'bg-accent/50')}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        <NumberTicker value={value} />
      </div>
      {change && (
        <p className={cn('text-xs text-muted-foreground', getChangeTypeClass(changeType))}>
          {change} from last month
        </p>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    const handleUpdateStats = (newStats) => {
      setStats(newStats);
    };

    const handleNewActivity = (newActivity) => {
      setRecentActivity((prevActivity) => [newActivity, ...prevActivity]);
    };

    if (socket) {
      socket.on('update-stats', handleUpdateStats);
      socket.on('new-activity', handleNewActivity);
    }

    return () => {
      if (socket) {
        socket.off('update-stats', handleUpdateStats);
        socket.off('new-activity', handleNewActivity);
      }
    };
  }, []);

  // Simulate data loading
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setStats({
        totalUsers: 12543,
        activeUsers: 8921,
        totalCommands: 45632,
        aiRequests: 12847,
        systemUptime: 99.8,
        responseTime: 245,
        errorRate: 0.2,
        cacheHitRate: 94.5,
      });

      setRecentActivity([
        {
          id: 1,
          type: 'command',
          user: 'john_doe',
          action: 'Used /gemini command',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          status: 'fast',
          duration: '0.8s',
        },
        {
          id: 2,
          type: 'ai',
          user: 'sarah_smith',
          action: 'Generated image with DALL-E',
          timestamp: new Date(Date.now() - 12 * 60 * 1000),
          status: 'success',
          duration: '4.2s',
        },
        {
          id: 3,
          type: 'system',
          user: 'System',
          action: 'Database backup completed',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          status: 'success',
          duration: '15.3s',
        },
        {
          id: 4,
          type: 'processing',
          user: 'alex_kim',
          action: 'Processing video download',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          status: 'processing',
          duration: '...',
        },
        {
          id: 5,
          type: 'warning',
          user: 'System',
          action: 'High memory usage detected',
          timestamp: new Date(Date.now() - 33 * 60 * 1000),
          status: 'warning',
          duration: '-',
        },
        {
          id: 6,
          type: 'error',
          user: 'mike_jones',
          action: 'Command execution failed',
          timestamp: new Date(Date.now() - 35 * 60 * 1000),
          status: 'error',
          duration: '0.1s',
        },
      ]);

      setLoading(false);
    };

    loadData();
  }, []);





  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">WhatsDeX</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Your AI-powered WhatsApp bot management dashboard
          </p>
        </motion.div>

        {/* Stats Grid */}
        <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <BentoCard className="md:col-span-2 lg:col-span-2">
            <ChartAreaDefault />
          </BentoCard>
          <BentoCard>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <AnimatedList>
                    {recentActivity.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </AnimatedList>
                )}
              </CardContent>
            </Card>
          </BentoCard>
          <BentoCard>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Global Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Globe />
              </CardContent>
            </Card>
          </BentoCard>
        </BentoGrid>

                {/* Main Content Grid */}

                <BentoGrid className="grid-cols-1 lg:grid-cols-3 gap-8">

                  <BentoCard

                    name="Performance Metrics"

                    description="Detailed view of system performance over time."

                    Icon={ChartBarIcon}

                    href="#"

                    cta="View Report"

                    className="lg:col-span-2"

                    background={<ChartAreaDefault />}

                  />

                  <BentoCard

                    name="Recent Activity"

                    description="Latest user interactions and system events."

                    Icon={ClockIcon}

                    href="#"

                    cta="View All"

                    className="lg:col-span-1"

                    background={

                      <Card>

                        <CardHeader>

                          <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>

                        </CardHeader>

                        <CardContent>

                          {loading ? (

                            <Skeleton className="h-64" />

                          ) : (

                            <AnimatedList>

                              {recentActivity.map((activity) => (

                                <ActivityItem key={activity.id} activity={activity} />

                              ))}

                            </AnimatedList>

                          )}

                        </CardContent>

                      </Card>

                    }

                  />

                  <BentoCard

                    name="Global Activity"

                    description="Real-time overview of worldwide bot interactions."

                    Icon={SignalIcon}

                    href="#"

                    cta="Explore Map"

                    className="lg:col-span-2"

                    background={

                      <Card>

                        <CardHeader>

                          <CardTitle className="text-xl font-bold">Global Activity</CardTitle>

                        </CardHeader>

                        <CardContent>

                          <Globe />

                        </CardContent>

                      </Card>

                    }

                  />

                </BentoGrid>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="primary" className="h-20 flex-col space-y-2">
                <CpuChipIcon className="w-6 h-6" />
                <span>AI Settings</span>
              </Button>
              <Button variant="success" className="h-20 flex-col space-y-2">
                <UsersIcon className="w-6 h-6" />
                <span>Manage Users</span>
              </Button>
              <Button variant="secondary" className="h-20 flex-col space-y-2">
                <ChartBarIcon className="w-6 h-6" />
                <span>View Analytics</span>
              </Button>
              <Button variant="ghost" className="h-20 flex-col space-y-2">
                <SignalIcon className="w-6 h-6" />
                <span>System Status</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
