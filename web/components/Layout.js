import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  UserGroupIcon,
  CpuChipIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../lib/utils';

const getNavigationItemClass = (item, darkMode) => {
  if (item.current) {
    return darkMode
      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      : 'bg-blue-500/20 text-blue-600 border border-blue-500/30';
  }
  return darkMode
    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50';
};

const Layout = ({ children, title = 'WhatsDeX Dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Simulate new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: `New notification at ${new Date().toLocaleTimeString()}`,
        },
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  const navigation = [
    {
      name: 'Dashboard', href: '/', icon: ChartBarIcon, current: true,
    },
    {
      name: 'Users', href: '/users', icon: UserGroupIcon, current: false,
    },
    {
      name: 'AI Analytics', href: '/ai-analytics', icon: CpuChipIcon, current: false,
    },
    {
      name: 'System', href: '/system', icon: SignalIcon, current: false,
    },
    {
      name: 'Settings', href: '/settings', icon: Cog6ToothIcon, current: false,
    },
  ];

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br transition-all duration-500',
      darkMode
        ? 'from-slate-900 via-slate-800 to-slate-900'
        : 'from-blue-50 via-indigo-50 to-purple-50',
    )}>
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          'absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 animate-float',
          darkMode ? 'bg-blue-500' : 'bg-blue-400',
        )} />
        <div className={cn(
          'absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20 animate-float',
          darkMode ? 'bg-purple-500' : 'bg-purple-400',
        )} style={{ animationDelay: '2s' }} />
        <div className={cn(
          'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 animate-pulse-slow',
          darkMode ? 'bg-indigo-500' : 'bg-indigo-400',
        )} />
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={cn(
                'fixed inset-y-0 left-0 z-50 w-64 backdrop-blur-xl border-r',
                darkMode
                  ? 'bg-slate-900/80 border-slate-700/50'
                  : 'bg-white/80 border-white/20',
              )}
            >
              <SidebarContent
                navigation={navigation}
                darkMode={darkMode}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64">
        <div className={cn(
          'h-full backdrop-blur-xl border-r',
          darkMode
            ? 'bg-slate-900/80 border-slate-700/50'
            : 'bg-white/80 border-white/20',
        )}>
          <SidebarContent navigation={navigation} darkMode={darkMode} />
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navigation */}
        <div className={cn(
          'sticky top-0 z-30 backdrop-blur-xl border-b',
          darkMode
            ? 'bg-slate-900/60 border-slate-700/50'
            : 'bg-white/60 border-white/20',
        )}>
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              type="button"
              className={cn(
                'rounded-lg p-2 transition-all duration-200 hover:scale-105',
                darkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
              )}
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'text-xl font-bold',
                darkMode ? 'text-white' : 'text-slate-900',
              )}
            >
              {title}
            </motion.h1>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className={cn(
                  'rounded-lg p-2 transition-all duration-200',
                  darkMode
                    ? 'text-slate-400 hover:text-yellow-400 hover:bg-slate-700/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
                )}
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </motion.button>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotifications([])}
                className={cn(
                  'relative rounded-lg p-2 transition-all duration-200',
                  darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
                )}
              >
                <BellIcon className="h-5 w-5" />
                {notifications.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-medium"
                  >
                    {notifications.length}
                  </motion.span>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="px-4 py-8 sm:px-6 lg:px-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

// Sidebar Content Component
const SidebarContent = ({ navigation, darkMode, onClose }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex h-16 items-center justify-between px-6"
      >
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              darkMode
                ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                : 'bg-gradient-to-br from-blue-500 to-purple-600',
            )}
          >
            <span className="text-xl font-bold text-white">W</span>
          </motion.div>
          <div>
            <h2 className={cn(
              'text-lg font-bold',
              darkMode ? 'text-white' : 'text-slate-900',
            )}>
              WhatsDeX
            </h2>
            <p className={cn(
              'text-xs',
              darkMode ? 'text-slate-400' : 'text-slate-600',
            )}>
              AI-Powered Bot
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg p-1 transition-colors',
              darkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
            )}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item, index) => (
          <motion.a
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            href={item.href}
            className={cn(
              'group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:scale-105',
              getNavigationItemClass(item, darkMode),
            )}
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
            {item.current && (
              <motion.div
                layoutId="activeTab"
                className="ml-auto h-2 w-2 rounded-full bg-blue-500"
              />
            )}
          </motion.a>
        ))}
      </nav>

      {/* Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="border-t border-slate-700/50 p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-3 w-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-3 w-3 rounded-full bg-green-500"
            />
          </div>
          <div>
            <p className={cn(
              'text-sm font-medium',
              darkMode ? 'text-white' : 'text-slate-900',
            )}>
              System Online
            </p>
            <p className={cn(
              'text-xs',
              darkMode ? 'text-slate-400' : 'text-slate-600',
            )}>
              All services running
            </p>
          </div>
        </div>
      </motion.div>
    </div>
);

export default Layout;
