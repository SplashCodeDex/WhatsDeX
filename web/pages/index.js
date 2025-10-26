import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  CpuChipIcon,
  SignalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@whatsdex/shared/components/ui/GlassCard';
import GlassButton from '@whatsdex/shared/components/ui/GlassButton';
import {
  SkeletonDashboardCard,
  SkeletonChart,
  SkeletonTable,
  Skeleton,
} from '@whatsdex/shared/components/ui/Skeleton';
import Layout from '../components/Layout';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

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
          status: 'success',
        },
        {
          id: 2,
          type: 'ai',
          user: 'sarah_smith',
          action: 'Generated image with DALL-E',
          timestamp: new Date(Date.now() - 12 * 60 * 1000),
          status: 'success',
        },
        {
          id: 3,
          type: 'system',
          user: 'System',
          action: 'Database backup completed',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          status: 'success',
        },
        {
          id: 4,
          type: 'error',
          user: 'mike_jones',
          action: 'Command execution failed',
          timestamp: new Date(Date.now() - 35 * 60 * 1000),
          status: 'error',
        },
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const StatCard = ({
    title, value, change, changeType, icon: Icon, variant = 'default',
  }) => (
    <GlassCard variant={variant} className="p-6" glow={variant === 'accent'}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-3xl font-bold text-slate-900 dark:text-white mt-2"
          >
            {typeof value === 'number' && value > 1000
              ? `${(value / 1000).toFixed(1)}K`
              : value}
          </motion.p>
          {change && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className={cn(
                'flex items-center mt-2 text-sm',
                changeType === 'positive'
                  ? 'text-green-600 dark:text-green-400'
                  : changeType === 'negative'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-400',
              )}
            >
              {changeType === 'positive' && <ArrowUpIcon className="w-4 h-4 mr-1" />}
              {changeType === 'negative' && <ArrowDownIcon className="w-4 h-4 mr-1" />}
              <span>{change}</span>
            </motion.div>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn(
            'p-3 rounded-xl',
            variant === 'accent'
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
              : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-400',
          )}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
      </div>
    </GlassCard>
  );

  const ActivityItem = ({ activity }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 dark:bg-slate-700/30 backdrop-blur-sm border border-white/10 dark:border-slate-600/30"
    >
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        activity.status === 'success'
          ? 'bg-green-500/20 text-green-400'
          : activity.status === 'error'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-blue-500/20 text-blue-400',
      )}>
        {activity.status === 'success' && <CheckCircleIcon className="w-5 h-5" />}
        {activity.status === 'error' && <ExclamationTriangleIcon className="w-5 h-5" />}
        {activity.type === 'command' && <BoltIcon className="w-5 h-5" />}
        {activity.type === 'ai' && <CpuChipIcon className="w-5 h-5" />}
        {activity.type === 'system' && <SignalIcon className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {activity.user}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
          {activity.action}
        </p>
      </div>

      <div className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
        <ClockIcon className="w-4 h-4 inline mr-1" />
        {activity.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </motion.div>
  );

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonDashboardCard key={i} />
            ))
          ) : (
            <>
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                change="+12.5%"
                changeType="positive"
                icon={UsersIcon}
                variant="accent"
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers}
                change="+8.2%"
                changeType="positive"
                icon={SignalIcon}
              />
              <StatCard
                title="AI Requests"
                value={stats.aiRequests}
                change="+23.1%"
                changeType="positive"
                icon={CpuChipIcon}
                variant="success"
              />
              <StatCard
                title="System Uptime"
                value={`${stats.systemUptime}%`}
                change="+0.1%"
                changeType="positive"
                icon={ChartBarIcon}
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Metrics */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Performance Metrics
                </h2>
                <GlassButton variant="ghost" size="sm">
                  View Details
                </GlassButton>
              </div>

              {loading ? (
                <SkeletonChart />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.responseTime}ms
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Avg Response Time
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.cacheHitRate}%
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Cache Hit Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {stats.errorRate}%
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Error Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.totalCommands}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total Commands
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Recent Activity */}
          <div>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h2>
                <GlassButton variant="ghost" size="sm">
                  View All
                </GlassButton>
              </div>

              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="w-12 h-4" />
                    </div>
                  ))
                ) : (
                  recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Quick Actions */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassButton variant="primary" className="h-20 flex-col space-y-2">
              <CpuChipIcon className="w-6 h-6" />
              <span>AI Settings</span>
            </GlassButton>
            <GlassButton variant="success" className="h-20 flex-col space-y-2">
              <UsersIcon className="w-6 h-6" />
              <span>Manage Users</span>
            </GlassButton>
            <GlassButton variant="secondary" className="h-20 flex-col space-y-2">
              <ChartBarIcon className="w-6 h-6" />
              <span>View Analytics</span>
            </GlassButton>
            <GlassButton variant="ghost" className="h-20 flex-col space-y-2">
              <SignalIcon className="w-6 h-6" />
              <span>System Status</span>
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
