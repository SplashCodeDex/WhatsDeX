import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Key,
  Shield,
  Database,
  Mail,
  Bell,
  Zap,
  Server,
  Users,
  DollarSign,
  Eye,
  EyeOff,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import withAuth from '../../components/withAuth';

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);

  // Mock settings data - replace with actual API calls
  useEffect(() => {
    const loadSettings = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockSettings = {
        general: {
          botName: 'WhatsDeX',
          botDescription: 'Advanced WhatsApp Bot with AI Features',
          ownerName: 'CodeDeX',
          ownerEmail: 'admin@whatsdex.com',
          timezone: 'Africa/Accra',
          language: 'en',
          maintenanceMode: false,
          debugMode: false,
        },
        security: {
          jwtSecret: 'your-jwt-secret-key',
          bcryptRounds: 12,
          sessionTimeout: 24,
          maxLoginAttempts: 5,
          lockoutDuration: 30,
          rateLimitWindow: 15,
          rateLimitMaxRequests: 100,
          enable2FA: true,
          passwordMinLength: 8,
          requireSpecialChars: true,
        },
        api: {
          openaiApiKey: 'sk-your-openai-key',
          stripeSecretKey: 'sk_test_your-stripe-key',
          stripeWebhookSecret: 'whsec_your-webhook-secret',
          firebaseProjectId: 'your-firebase-project',
          googleCloudApiKey: 'your-google-cloud-key',
          telegramBotToken: 'your-telegram-token',
          discordBotToken: 'your-discord-token',
        },
        database: {
          host: 'localhost',
          port: 5432,
          database: 'whatsdex',
          username: 'postgres',
          password: 'your-db-password',
          ssl: true,
          connectionPoolSize: 10,
          connectionTimeout: 30000,
          queryTimeout: 30000,
        },
        email: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'noreply@whatsdex.com',
          smtpPassword: 'your-email-password',
          fromEmail: 'noreply@whatsdex.com',
          fromName: 'WhatsDeX',
          enableTLS: true,
          enableAuth: true,
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          webhookUrl: 'https://your-webhook-url.com',
          slackWebhook: 'https://hooks.slack.com/your-slack-webhook',
          discordWebhook: 'https://discord.com/api/webhooks/your-webhook',
        },
        performance: {
          cacheEnabled: true,
          redisUrl: 'redis://localhost:6379',
          cacheTTL: 3600,
          maxFileSize: 10485760,
          uploadPath: './uploads',
          compressionEnabled: true,
          gzipLevel: 6,
        },
        monetization: {
          stripeEnabled: true,
          paypalEnabled: false,
          coinbaseEnabled: false,
          subscriptionEnabled: true,
          freeTrialDays: 7,
          defaultCurrency: 'USD',
          taxRate: 0.0,
          minimumPayout: 50,
        },
        moderation: {
          contentModerationEnabled: true,
          autoModeration: true,
          moderationThreshold: 0.8,
          bannedWords: ['spam', 'scam', 'offensive'],
          maxMessageLength: 4096,
          rateLimitEnabled: true,
          spamDetectionEnabled: true,
        },
        backup: {
          autoBackupEnabled: true,
          backupFrequency: 'daily',
          backupRetention: 30,
          backupPath: './backups',
          compressionEnabled: true,
          encryptionEnabled: true,
          cloudBackupEnabled: false,
        },
      };

      setSettings(mockSettings);
      setLoading(false);
    };

    loadSettings();
  }, []);

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'api', name: 'API Keys', icon: Key },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'monetization', name: 'Monetization', icon: DollarSign },
    { id: 'moderation', name: 'Moderation', icon: Users },
    { id: 'backup', name: 'Backup', icon: Server },
  ];

  const handleSettingChange = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
    setValidationErrors((prev) => ({ ...prev, [`${category}.${key}`]: null }));
  };

  const validateSettings = () => {
    const errors = {};

    // Email validation
    if (settings.general?.ownerEmail && !/\S+@\S+\.\S+/.test(settings.general.ownerEmail)) {
      errors['general.ownerEmail'] = 'Invalid email format';
    }

    // Port validation
    if (settings.database?.port && (settings.database.port < 1 || settings.database.port > 65535)) {
      errors['database.port'] = 'Port must be between 1 and 65535';
    }

    // Password strength
    if (settings.security?.passwordMinLength && settings.security.passwordMinLength < 6) {
      errors['security.passwordMinLength'] = 'Minimum password length should be at least 6';
    }

    // URL validation
    if (settings.notifications?.webhookUrl && !/^https?:\/\/.+/.test(settings.notifications.webhookUrl)) {
      errors['notifications.webhookUrl'] = 'Invalid URL format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      return;
    }

    setSaving(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    console.log('User confirmed reset. Reloading page.'); // Placeholder for UI confirmation
    window.location.reload();
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `whatsdex_settings_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          setHasChanges(true);
        } catch (error) {
          console.error('Invalid settings file format:', error); // Placeholder for UI alert
        }
      };
      reader.readAsText(file);
    }
  };

  const renderSettingField = (category, key, value, type = 'text', options = {}) => {
    const fieldId = `${category}.${key}`;
    const error = validationErrors[fieldId];
    const isPassword = type === 'password' || key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token');
    const showPwd = showPassword[fieldId];

    let inputElement;
    if (type === 'textarea') {
      inputElement = (
        <textarea
          value={value || ''}
          onChange={(e) => handleSettingChange(category, key, e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          placeholder={options.placeholder}
        />
      );
    } else if (type === 'select') {
      inputElement = (
        <select
          value={value || ''}
          onChange={(e) => handleSettingChange(category, key, e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
        >
          {options.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    } else if (type === 'checkbox') {
      inputElement = (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleSettingChange(category, key, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {options.description}
          </span>
        </div>
      );
    } else {
      inputElement = (
        <div className="relative">
          <input
            type={isPassword && !showPwd ? 'password' : 'text'}
            value={value || ''}
            onChange={(e) => handleSettingChange(category, key, e.target.value)}
            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder={options.placeholder}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }))}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPwd ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          )}
        </div>
      );
    }

    return (
      <div key={fieldId} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {options.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
          {options.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {inputElement}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            {error}
          </p>
        )}
        {options.description && type !== 'checkbox' && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {options.description}
          </p>
        )}
      </div>
    );
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderSettingField('general', 'botName', settings.general?.botName, 'text', {
          label: 'Bot Name',
          required: true,
          description: 'The display name of your bot',
        })}
        {renderSettingField('general', 'botDescription', settings.general?.botDescription, 'textarea', {
          label: 'Bot Description',
          description: 'Brief description of your bot\'s functionality',
        })}
        {renderSettingField('general', 'ownerName', settings.general?.ownerName, 'text', {
          label: 'Owner Name',
          required: true,
        })}
        {renderSettingField('general', 'ownerEmail', settings.general?.ownerEmail, 'text', {
          label: 'Owner Email',
          required: true,
          placeholder: 'admin@example.com',
        })}
        {renderSettingField('general', 'timezone', settings.general?.timezone, 'select', {
          label: 'Timezone',
          options: [
            { value: 'Africa/Accra', label: 'Africa/Accra (GMT+0)' },
            { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
            { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
            { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
          ],
        })}
        {renderSettingField('general', 'language', settings.general?.language, 'select', {
          label: 'Default Language',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
          ],
        })}
      </div>

      <div className="space-y-4">
        {renderSettingField('general', 'maintenanceMode', settings.general?.maintenanceMode, 'checkbox', {
          description: 'Enable maintenance mode (bot will be temporarily unavailable)',
        })}
        {renderSettingField('general', 'debugMode', settings.general?.debugMode, 'checkbox', {
          description: 'Enable debug mode (additional logging and error details)',
        })}
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderSettingField('security', 'jwtSecret', settings.security?.jwtSecret, 'password', {
          label: 'JWT Secret Key',
          required: true,
          description: 'Secret key for JWT token generation',
        })}
        {renderSettingField('security', 'bcryptRounds', settings.security?.bcryptRounds, 'number', {
          label: 'Bcrypt Rounds',
          description: 'Number of rounds for password hashing (higher = more secure but slower)',
        })}
        {renderSettingField('security', 'sessionTimeout', settings.security?.sessionTimeout, 'number', {
          label: 'Session Timeout (hours)',
          description: 'How long user sessions remain active',
        })}
        {renderSettingField('security', 'maxLoginAttempts', settings.security?.maxLoginAttempts, 'number', {
          label: 'Max Login Attempts',
          description: 'Maximum failed login attempts before account lockout',
        })}
        {renderSettingField('security', 'lockoutDuration', settings.security?.lockoutDuration, 'number', {
          label: 'Lockout Duration (minutes)',
          description: 'How long to lock account after failed attempts',
        })}
        {renderSettingField('security', 'rateLimitWindow', settings.security?.rateLimitWindow, 'number', {
          label: 'Rate Limit Window (minutes)',
          description: 'Time window for rate limiting',
        })}
        {renderSettingField('security', 'rateLimitMaxRequests', settings.security?.rateLimitMaxRequests, 'number', {
          label: 'Max Requests per Window',
          description: 'Maximum requests allowed in the rate limit window',
        })}
        {renderSettingField('security', 'passwordMinLength', settings.security?.passwordMinLength, 'number', {
          label: 'Minimum Password Length',
          description: 'Minimum characters required for passwords',
        })}
      </div>

      <div className="space-y-4">
        {renderSettingField('security', 'enable2FA', settings.security?.enable2FA, 'checkbox', {
          description: 'Enable two-factor authentication for admin accounts',
        })}
        {renderSettingField('security', 'requireSpecialChars', settings.security?.requireSpecialChars, 'checkbox', {
          description: 'Require special characters in passwords',
        })}
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Security Warning
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>API keys contain sensitive information. Ensure you are on a secure connection and consider using environment variables for production deployments.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {renderSettingField('api', 'openaiApiKey', settings.api?.openaiApiKey, 'password', {
          label: 'OpenAI API Key',
          description: 'Required for AI chat and image generation features',
        })}
        {renderSettingField('api', 'stripeSecretKey', settings.api?.stripeSecretKey, 'password', {
          label: 'Stripe Secret Key',
          description: 'Required for payment processing and subscriptions',
        })}
        {renderSettingField('api', 'stripeWebhookSecret', settings.api?.stripeWebhookSecret, 'password', {
          label: 'Stripe Webhook Secret',
          description: 'Required for webhook signature verification',
        })}
        {renderSettingField('api', 'firebaseProjectId', settings.api?.firebaseProjectId, 'text', {
          label: 'Firebase Project ID',
          description: 'Required for Firebase authentication and database',
        })}
        {renderSettingField('api', 'googleCloudApiKey', settings.api?.googleCloudApiKey, 'password', {
          label: 'Google Cloud API Key',
          description: 'Required for Google Cloud services integration',
        })}
        {renderSettingField('api', 'telegramBotToken', settings.api?.telegramBotToken, 'password', {
          label: 'Telegram Bot Token',
          description: 'Required for Telegram bot integration',
        })}
        {renderSettingField('api', 'discordBotToken', settings.api?.discordBotToken, 'password', {
          label: 'Discord Bot Token',
          description: 'Required for Discord bot integration',
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage system settings, API keys, and configuration parameters
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
            />
          </label>
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
              hasChanges && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-6">
        {hasChanges && (
          <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Unsaved changes</span>
          </div>
        )}
        {lastSaved && (
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          </div>
        )}
        {Object.keys(validationErrors).length > 0 && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              {Object.keys(validationErrors).length} validation error{Object.keys(validationErrors).length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Settings Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'general' && renderGeneralSettings()}
              {activeTab === 'security' && renderSecuritySettings()}
              {activeTab === 'api' && renderApiSettings()}
              {activeTab === 'database' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderSettingField('database', 'host', settings.database?.host, 'text', {
                      label: 'Database Host',
                      required: true,
                    })}
                    {renderSettingField('database', 'port', settings.database?.port, 'number', {
                      label: 'Database Port',
                      required: true,
                    })}
                    {renderSettingField('database', 'database', settings.database?.database, 'text', {
                      label: 'Database Name',
                      required: true,
                    })}
                    {renderSettingField('database', 'username', settings.database?.username, 'text', {
                      label: 'Database Username',
                      required: true,
                    })}
                    {renderSettingField('database', 'password', settings.database?.password, 'password', {
                      label: 'Database Password',
                      required: true,
                    })}
                    {renderSettingField('database', 'connectionPoolSize', settings.database?.connectionPoolSize, 'number', {
                      label: 'Connection Pool Size',
                      description: 'Maximum number of database connections',
                    })}
                  </div>
                  <div className="space-y-4">
                    {renderSettingField('database', 'ssl', settings.database?.ssl, 'checkbox', {
                      description: 'Enable SSL/TLS encryption for database connections',
                    })}
                  </div>
                </div>
              )}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderSettingField('email', 'smtpHost', settings.email?.smtpHost, 'text', {
                      label: 'SMTP Host',
                      required: true,
                      placeholder: 'smtp.gmail.com',
                    })}
                    {renderSettingField('email', 'smtpPort', settings.email?.smtpPort, 'number', {
                      label: 'SMTP Port',
                      required: true,
                    })}
                    {renderSettingField('email', 'smtpUser', settings.email?.smtpUser, 'text', {
                      label: 'SMTP Username',
                      required: true,
                    })}
                    {renderSettingField('email', 'smtpPassword', settings.email?.smtpPassword, 'password', {
                      label: 'SMTP Password',
                      required: true,
                    })}
                    {renderSettingField('email', 'fromEmail', settings.email?.fromEmail, 'text', {
                      label: 'From Email Address',
                      required: true,
                    })}
                    {renderSettingField('email', 'fromName', settings.email?.fromName, 'text', {
                      label: 'From Name',
                      required: true,
                    })}
                  </div>
                  <div className="space-y-4">
                    {renderSettingField('email', 'enableTLS', settings.email?.enableTLS, 'checkbox', {
                      description: 'Enable TLS encryption for email connections',
                    })}
                    {renderSettingField('email', 'enableAuth', settings.email?.enableAuth, 'checkbox', {
                      description: 'Enable SMTP authentication',
                    })}
                  </div>
                </div>
              )}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {renderSettingField('notifications', 'emailNotifications', settings.notifications?.emailNotifications, 'checkbox', {
                      description: 'Enable email notifications for system events',
                    })}
                    {renderSettingField('notifications', 'pushNotifications', settings.notifications?.pushNotifications, 'checkbox', {
                      description: 'Enable push notifications for important events',
                    })}
                    {renderSettingField('notifications', 'smsNotifications', settings.notifications?.smsNotifications, 'checkbox', {
                      description: 'Enable SMS notifications for critical alerts',
                    })}
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {renderSettingField('notifications', 'webhookUrl', settings.notifications?.webhookUrl, 'text', {
                      label: 'Webhook URL',
                      placeholder: 'https://your-webhook-url.com',
                    })}
                    {renderSettingField('notifications', 'slackWebhook', settings.notifications?.slackWebhook, 'password', {
                      label: 'Slack Webhook URL',
                      placeholder: 'https://hooks.slack.com/your-slack-webhook',
                    })}
                    {renderSettingField('notifications', 'discordWebhook', settings.notifications?.discordWebhook, 'password', {
                      label: 'Discord Webhook URL',
                      placeholder: 'https://discord.com/api/webhooks/your-webhook',
                    })}
                  </div>
                </div>
              )}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderSettingField('performance', 'cacheTTL', settings.performance?.cacheTTL, 'number', {
                      label: 'Cache TTL (seconds)',
                      description: 'How long to cache data in Redis',
                    })}
                    {renderSettingField('performance', 'maxFileSize', settings.performance?.maxFileSize, 'number', {
                      label: 'Max File Size (bytes)',
                      description: 'Maximum file size for uploads',
                    })}
                    {renderSettingField('performance', 'uploadPath', settings.performance?.uploadPath, 'text', {
                      label: 'Upload Path',
                      description: 'Directory path for file uploads',
                    })}
                    {renderSettingField('performance', 'gzipLevel', settings.performance?.gzipLevel, 'number', {
                      label: 'GZIP Compression Level',
                      description: 'Compression level for responses (1-9)',
                    })}
                  </div>
                  <div className="space-y-4">
                    {renderSettingField('performance', 'cacheEnabled', settings.performance?.cacheEnabled, 'checkbox', {
                      description: 'Enable Redis caching for improved performance',
                    })}
                    {renderSettingField('performance', 'compressionEnabled', settings.performance?.compressionEnabled, 'checkbox', {
                      description: 'Enable GZIP compression for responses',
                    })}
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {renderSettingField('performance', 'redisUrl', settings.performance?.redisUrl, 'text', {
                      label: 'Redis URL',
                      placeholder: 'redis://localhost:6379',
                    })}
                  </div>
                </div>
              )}
              {activeTab === 'monetization' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderSettingField('monetization', 'freeTrialDays', settings.monetization?.freeTrialDays, 'number', {
                      label: 'Free Trial Days',
                      description: 'Number of free trial days for new users',
                    })}
                    {renderSettingField('monetization', 'defaultCurrency', settings.monetization?.defaultCurrency, 'select', {
                      label: 'Default Currency',
                      options: [
                        { value: 'USD', label: 'US Dollar (USD)' },
                        { value: 'EUR', label: 'Euro (EUR)' },
                        { value: 'GBP', label: 'British Pound (GBP)' },
                        { value: 'JPY', label: 'Japanese Yen (JPY)' },
                      ],
                    })}
                    {renderSettingField('monetization', 'taxRate', settings.monetization?.taxRate, 'number', {
                      label: 'Tax Rate (%)',
                      description: 'Tax rate applied to transactions',
                    })}
                    {renderSettingField('monetization', 'minimumPayout', settings.monetization?.minimumPayout, 'number', {
                      label: 'Minimum Payout Amount',
                      description: 'Minimum amount required for payouts',
                    })}
                  </div>
                  <div className="space-y-4">
                    {renderSettingField('monetization', 'stripeEnabled', settings.monetization?.stripeEnabled, 'checkbox', {
                      description: 'Enable Stripe payment processing',
                    })}
                    {renderSettingField('monetization', 'paypalEnabled', settings.monetization?.paypalEnabled, 'checkbox', {
                      description: 'Enable PayPal payment processing',
                    })}
                    {renderSettingField('monetization', 'coinbaseEnabled', settings.monetization?.coinbaseEnabled, 'checkbox', {
                      description: 'Enable Coinbase Commerce for crypto payments',
                    })}
                    {renderSettingField('monetization', 'subscriptionEnabled', settings.monetization?.subscriptionEnabled, 'checkbox', {
                      description: 'Enable subscription-based pricing',
                    })}
                  </div>
                </div>
              )}
              {activeTab === 'moderation' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderSettingField('moderation', 'moderationThreshold', settings.moderation?.moderationThreshold, 'number', {
                      label: 'Moderation Threshold',
                      description: 'Confidence threshold for content moderation (0.0-1.0)',
                    })}
                    {renderSettingField('moderation', 'maxMessageLength', settings.moderation?.maxMessageLength, 'number', {
                      label: 'Max Message Length',
                      description: 'Maximum allowed message length in characters',
                    })}
                  </div>
                  <div className="space-y-4">
                    {renderSettingField('moderation', 'contentModerationEnabled', settings.moderation?.contentModerationEnabled, 'checkbox', {
                      description: 'Enable AI-powered content moderation',
                    })}
                    {renderSettingField('moderation', 'autoModeration', settings.moderation?.autoModeration, 'checkbox', {
                      description: 'Automatically moderate content based on AI analysis',
                    })}
                    {renderSettingField('moderation', 'rateLimitEnabled', settings.moderation?.rateLimitEnabled, 'checkbox', {
                      description: 'Enable rate limiting to prevent spam',
                    })}
                    {renderSettingField('moderation', 'spamDetectionEnabled', settings.moderation?.spamDetectionEnabled, 'checkbox', {
                      description: 'Enable spam detection and filtering',
                    })}
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Banned Words
                    </label>
                    <textarea
                      value={settings.moderation?.bannedWords?.join('\n') || ''}
                      onChange={(e) => handleSettingChange('moderation', 'bannedWords', e.target.value.split('\n').filter((word) => word.trim()))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter banned words, one per line"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Words that will be automatically filtered from messages
                    </p>
                  </div>
                </div>
              )}
              {activeTab === 'backup' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderSettingField('backup', 'backupFrequency', settings.backup?.backupFrequency, 'select', {
                      label: 'Backup Frequency',
                      options: [
                        { value: 'hourly', label: 'Hourly' },
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'monthly', label: 'Monthly' },
                      ],
                    })}
                    {renderSettingField('backup', 'backupRetention', settings.backup?.backupRetention, 'number', {
                      label: 'Backup Retention (days)',
                      description: 'How long to keep backup files',
                    })}
                    {renderSettingField('backup', 'backupPath', settings.backup?.backupPath, 'text', {
                      label: 'Backup Path',
                      description: 'Directory path for storing backups',
                    })}
                  </div>
                  <div className="space-y-4">
                    {renderSettingField('backup', 'autoBackupEnabled', settings.backup?.autoBackupEnabled, 'checkbox', {
                      description: 'Enable automatic backup scheduling',
                    })}
                    {renderSettingField('backup', 'compressionEnabled', settings.backup?.compressionEnabled, 'checkbox', {
                      description: 'Compress backup files to save space',
                    })}
                    {renderSettingField('backup', 'encryptionEnabled', settings.backup?.encryptionEnabled, 'checkbox', {
                      description: 'Encrypt backup files for security',
                    })}
                    {renderSettingField('backup', 'cloudBackupEnabled', settings.backup?.cloudBackupEnabled, 'checkbox', {
                      description: 'Enable cloud backup storage (AWS S3, Google Cloud, etc.)',
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default withAuth(SystemSettings);
