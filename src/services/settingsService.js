// Mock Settings Service for testing
// This will be replaced with actual database implementation in Phase 7.2

class SettingsService {
  constructor() {
    this.settings = new Map();
    this.initializeDefaultSettings();
  }

  initializeDefaultSettings() {
    const defaultSettings = {
      // General settings
      'general.botName': {
        category: 'general',
        key: 'botName',
        value: 'WhatsDeX',
        valueType: 'string',
        description: 'Bot display name',
        isEncrypted: false
      },
      'general.botDescription': {
        category: 'general',
        key: 'botDescription',
        value: 'Advanced WhatsApp Bot with AI Features',
        valueType: 'string',
        description: 'Bot description',
        isEncrypted: false
      },
      'general.ownerName': {
        category: 'general',
        key: 'ownerName',
        value: 'CodeDeX',
        valueType: 'string',
        description: 'Bot owner name',
        isEncrypted: false
      },
      'general.timezone': {
        category: 'general',
        key: 'timezone',
        value: 'Africa/Accra',
        valueType: 'string',
        description: 'System timezone',
        isEncrypted: false
      },

      // Security settings
      'security.jwtSecret': {
        category: 'security',
        key: 'jwtSecret',
        value: 'your-jwt-secret-key',
        valueType: 'string',
        description: 'JWT signing secret',
        isEncrypted: true
      },
      'security.bcryptRounds': {
        category: 'security',
        key: 'bcryptRounds',
        value: 12,
        valueType: 'number',
        description: 'BCrypt hashing rounds',
        isEncrypted: false
      },
      'security.maxLoginAttempts': {
        category: 'security',
        key: 'maxLoginAttempts',
        value: 5,
        valueType: 'number',
        description: 'Maximum login attempts before lockout',
        isEncrypted: false
      },

      // API settings
      'api.openaiApiKey': {
        category: 'api',
        key: 'openaiApiKey',
        value: 'sk-your-openai-key',
        valueType: 'string',
        description: 'OpenAI API key',
        isEncrypted: true
      },
      'api.stripeSecretKey': {
        category: 'api',
        key: 'stripeSecretKey',
        value: 'sk_test_your-stripe-key',
        valueType: 'string',
        description: 'Stripe secret key',
        isEncrypted: true
      },

      // Database settings
      'database.host': {
        category: 'database',
        key: 'host',
        value: 'localhost',
        valueType: 'string',
        description: 'Database host',
        isEncrypted: false
      },
      'database.port': {
        category: 'database',
        key: 'port',
        value: 5432,
        valueType: 'number',
        description: 'Database port',
        isEncrypted: false
      },
      'database.database': {
        category: 'database',
        key: 'database',
        value: 'whatsdex',
        valueType: 'string',
        description: 'Database name',
        isEncrypted: false
      },

      // Moderation settings
      'moderation.contentModerationEnabled': {
        category: 'moderation',
        key: 'contentModerationEnabled',
        value: true,
        valueType: 'boolean',
        description: 'Enable content moderation',
        isEncrypted: false
      },
      'moderation.autoModeration': {
        category: 'moderation',
        key: 'autoModeration',
        value: true,
        valueType: 'boolean',
        description: 'Enable automatic moderation',
        isEncrypted: false
      },
      'moderation.moderationThreshold': {
        category: 'moderation',
        key: 'moderationThreshold',
        value: 0.8,
        valueType: 'number',
        description: 'Moderation confidence threshold',
        isEncrypted: false
      }
    };

    Object.entries(defaultSettings).forEach(([key, setting]) => {
      this.settings.set(key, { ...setting, updatedAt: new Date() });
    });
  }

  async getAllSettings() {
    const settings = {};
    for (const [key, setting] of this.settings.entries()) {
      if (!settings[setting.category]) {
        settings[setting.category] = {};
      }
      settings[setting.category][setting.key] = setting.value;
    }
    return settings;
  }

  async getSettingsByCategory(category) {
    const categorySettings = [];
    for (const [key, setting] of this.settings.entries()) {
      if (setting.category === category) {
        categorySettings.push(setting);
      }
    }
    return categorySettings;
  }

  async getSetting(category, key) {
    const settingKey = `${category}.${key}`;
    return this.settings.get(settingKey) || null;
  }

  async updateSetting(category, key, value, description, updatedBy) {
    const settingKey = `${category}.${key}`;
    const existingSetting = this.settings.get(settingKey);

    if (!existingSetting) {
      throw new Error(`Setting ${settingKey} not found`);
    }

    const updatedSetting = {
      ...existingSetting,
      value,
      description: description || existingSetting.description,
      updatedAt: new Date()
    };

    this.settings.set(settingKey, updatedSetting);
    return updatedSetting;
  }

  async validateSetting(category, key, value) {
    const settingKey = `${category}.${key}`;
    const setting = this.settings.get(settingKey);

    if (!setting) {
      return { valid: false, message: `Setting ${settingKey} not found` };
    }

    // Type validation
    const expectedType = setting.valueType;
    let isValidType = false;

    switch (expectedType) {
      case 'string':
        isValidType = typeof value === 'string';
        break;
      case 'number':
        isValidType = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        isValidType = typeof value === 'boolean';
        break;
      case 'json':
        try {
          JSON.parse(value);
          isValidType = true;
        } catch {
          isValidType = false;
        }
        break;
      default:
        isValidType = true;
    }

    if (!isValidType) {
      return { valid: false, message: `Value must be of type ${expectedType}` };
    }

    // Specific validations
    if (category === 'database' && key === 'port') {
      if (value < 1 || value > 65535) {
        return { valid: false, message: 'Port must be between 1 and 65535' };
      }
    }

    if (category === 'security' && key === 'bcryptRounds') {
      if (value < 8 || value > 20) {
        return { valid: false, message: 'BCrypt rounds must be between 8 and 20' };
      }
    }

    if (category === 'moderation' && key === 'moderationThreshold') {
      if (value < 0 || value > 1) {
        return { valid: false, message: 'Threshold must be between 0 and 1' };
      }
    }

    return { valid: true, message: 'Valid' };
  }

  async resetCategoryToDefaults(category, updatedBy) {
    // This would reset all settings in a category to their defaults
    // For now, return the current settings
    return await this.getSettingsByCategory(category);
  }

  async exportSettings(format = 'json') {
    const allSettings = {};
    for (const [key, setting] of this.settings.entries()) {
      allSettings[key] = setting;
    }

    if (format === 'json') {
      return JSON.stringify(allSettings, null, 2);
    }

    // CSV format
    const headers = ['Category', 'Key', 'Value', 'Type', 'Description', 'Encrypted', 'Updated At'];
    const rows = Array.from(this.settings.values()).map(setting => [
      setting.category,
      setting.key,
      setting.value,
      setting.valueType,
      setting.description || '',
      setting.isEncrypted,
      setting.updatedAt.toISOString()
    ]);

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  }

  async importSettings(settings, format = 'json', updatedBy) {
    let parsedSettings;

    if (format === 'json') {
      if (typeof settings === 'string') {
        parsedSettings = JSON.parse(settings);
      } else {
        parsedSettings = settings;
      }
    } else {
      throw new Error('CSV import not implemented yet');
    }

    const imported = [];
    const errors = [];

    for (const [key, settingData] of Object.entries(parsedSettings)) {
      try {
        const [category, settingKey] = key.split('.');
        const validation = await this.validateSetting(category, settingKey, settingData.value);

        if (validation.valid) {
          await this.updateSetting(category, settingKey, settingData.value, settingData.description, updatedBy);
          imported.push({ category, key: settingKey, value: settingData.value });
        } else {
          errors.push({ key, error: validation.message });
        }
      } catch (error) {
        errors.push({ key, error: error.message });
      }
    }

    return { imported, errors };
  }

  async getCategories() {
    const categories = new Set();
    for (const setting of this.settings.values()) {
      categories.add(setting.category);
    }

    return Array.from(categories).map(category => ({
      name: category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
      count: Array.from(this.settings.values()).filter(s => s.category === category).length
    }));
  }
}

module.exports = new SettingsService();