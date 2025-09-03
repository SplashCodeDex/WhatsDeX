import { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  Settings,
  Shield,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Server,
  Database,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import UserManagement from './users';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStats, setSystemStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSystemStats({
        totalUsers: 12543,
        activeUsers: 8921,
        totalCommands: 45632,
        aiRequests: 12847,
        systemUptime: 99.8,
        responseTime: 245,
        errorRate: 0.2,
        revenue: 15420,
        serverLoad: 45,
        memoryUsage: 68,
        databaseSize: 2.4
      });

      setRecentActivity([
        {
          id: 1,
          type: 'user',
          action: 'New user registered',
          user: 'john_doe',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          status: 'success'
        },
        {
          id: 2,
          type: 'system',
          action: 'Database backup completed',
          user: 'System',
          timestamp: new Date(Date.now() - 12 * 60 * 1000),
          status: 'success'
        },
        {
          id: 3,
          type: 'security',
          action: 'Failed login attempt',
          user: 'unknown',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          status: 'warning'
        },
        {
          id: 4,
          type: 'error',
          action: 'Command execution failed',
          user: 'mike_jones',
          timestamp: new Date(Date.now() - 35 * 60 * 1000),
          status: 'error'
        }
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {value}
            </p>
            {change && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {change}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colors[color]} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${colors[color].replace('bg-', 'text-')}`} />
          </div>
        </div>
      </motion.div>
    );
  };

  const ActivityItem = ({ activity }) => {
    const getStatusIcon = (status) => {
      switch (status) {
        case 'success':
          return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'warning':
          return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        case 'error':
          return <XCircle className="w-5 h-5 text-red-500" />;
        default:
          return <Clock className="w-5 h-5 text-gray-500" />;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
      >
        {getStatusIcon(activity.status)}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {activity.action}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {activity.user} • {activity.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </motion.div>
    );
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'analytics', name: 'Analytics', icon: Activity },
    { id: 'system', name: 'System', icon: Server },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                WhatsDeX Admin
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                System administration and monitoring
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  System Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
                        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    ))
                  ) : (
                    <>
                      <StatCard
                        title="Total Users"
                        value={systemStats.totalUsers.toLocaleString()}
                        change="+12.5% from last month"
                        icon={Users}
                        color="blue"
                      />
                      <StatCard
                        title="Active Users"
                        value={systemStats.activeUsers.toLocaleString()}
                        change="+8.2% from last week"
                        icon={Activity}
                        color="green"
                      />
                      <StatCard
                        title="Revenue"
                        value={`$${systemStats.revenue.toLocaleString()}`}
                        change="+23.1% from last month"
                        icon={DollarSign}
                        color="purple"
                      />
                      <StatCard
                        title="System Uptime"
                        value={`${systemStats.systemUptime}%`}
                        change="+0.1% from yesterday"
                        icon={Server}
                        color="green"
                      />
                      <StatCard
                        title="Avg Response Time"
                        value={`${systemStats.responseTime}ms`}
                        change="-5ms from yesterday"
                        icon={Zap}
                        color="yellow"
                      />
                      <StatCard
                        title="Error Rate"
                        value={`${systemStats.errorRate}%`}
                        change="-0.1% from yesterday"
                        icon={AlertTriangle}
                        color="red"
                      />
                      <StatCard
                        title="Server Load"
                        value={`${systemStats.serverLoad}%`}
                        icon={TrendingUp}
                        color="blue"
                      />
                      <StatCard
                        title="Memory Usage"
                        value={`${systemStats.memoryUsage}%`}
                        icon={Database}
                        color="purple"
                      />
                    </>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
                          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      recentActivity.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Manage Users
                      </span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <Activity className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        View Analytics
                      </span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                      <Settings className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        System Settings
                      </span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <Shield className="w-8 h-8 text-red-600 dark:text-red-400 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Security Logs
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && <UserManagement />}

            {activeTab === 'analytics' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Analytics Dashboard
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced analytics and reporting will be implemented here.
                </p>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  System Monitoring
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  System health and performance monitoring will be implemented here.
                </p>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Security Center
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Security monitoring and threat detection will be implemented here.
                </p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  System Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  System configuration and settings will be implemented here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}