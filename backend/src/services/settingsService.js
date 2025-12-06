"use strict";

const prisma = require('../lib/prisma.js').default;

class SettingsService {
  constructor() {
    this.settings = new Map();
    this.initializeDefaultSettings();
  }

  initializeDefaultSettings() {
    const defaultSettings = {
      'general.botName': { category: 'general', key: 'botName', value: 'WhatsDeX', valueType: 'string', description: 'Bot display name', isEncrypted: false },
      'general.botDescription': { category: 'general', key: 'botDescription', value: 'Advanced WhatsApp Bot with AI Features', valueType: 'string', description: 'Bot description', isEncrypted: false },
      'general.ownerName': { category: 'general', key: 'ownerName', value: 'CodeDeX', valueType: 'string', description: 'Bot owner name', isEncrypted: false },
      'general.timezone': { category: 'general', key: 'timezone', value: 'Africa/Accra', valueType: 'string', description: 'System timezone', isEncrypted: false },

      // Security
      'security.jwtSecret': { category: 'security', key: 'jwtSecret', value: process.env.JWT_SECRET || 'change-me', valueType: 'string', description: 'JWT signing secret', isEncrypted: true },
      'security.bcryptRounds': { category: 'security', key: 'bcryptRounds', value: 12, valueType: 'number', description: 'BCrypt hashing rounds', isEncrypted: false },
      'security.maxLoginAttempts': { category: 'security', key: 'maxLoginAttempts', value: 5, valueType: 'number', description: 'Maximum login attempts before lockout', isEncrypted: false },

      // API
      'api.openaiApiKey': { category: 'api', key: 'openaiApiKey', value: process.env.OPENAI_API_KEY || '', valueType: 'string', description: 'OpenAI API key', isEncrypted: true },
      'api.stripeSecretKey': { category: 'api', key: 'stripeSecretKey', value: process.env.STRIPE_SECRET_KEY || '', valueType: 'string', description: 'Stripe secret key', isEncrypted: true },
      'api.stripeWebhookSecret': { category: 'api', key: 'stripeWebhookSecret', value: process.env.STRIPE_WEBHOOK_SECRET || '', valueType: 'string', description: 'Stripe webhook secret', isEncrypted: true },

      // Database
      'database.host': { category: 'database', key: 'host', value: process.env.DB_HOST || 'localhost', valueType: 'string', description: 'Database host', isEncrypted: false },
      'database.port': { category: 'database', key: 'port', value: Number(process.env.DB_PORT || 5432), valueType: 'number', description: 'Database port', isEncrypted: false },
      'database.database': { category: 'database', key: 'database', value: process.env.DB_NAME || 'whatsdex', valueType: 'string', description: 'Database name', isEncrypted: false },
    };

    Object.entries(defaultSettings).forEach(([key, setting]) => {
      this.settings.set(key, { ...setting, updatedAt: new Date() });
    });
  }

  parseValue(value, type) {
    if (type === 'number') return Number(value);
    if (type === 'boolean') return value === true || value === 'true';
    if (type === 'json') {
      try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return value; }
    }
    return value;
  }

  stringifyValue(value, type) {
    if (type === 'json') return JSON.stringify(value);
    return String(value);
  }

  async getAllSettings() {
    const dbSettings = await prisma.systemSetting.findMany();
    const settings = {};
    for (const [, setting] of this.settings.entries()) {
      const dbOverride = dbSettings.find(s => s.category === setting.category && s.key === setting.key);
      const value = dbOverride ? this.parseValue(dbOverride.value, setting.valueType) : setting.value;
      if (!settings[setting.category]) settings[setting.category] = {};
      settings[setting.category][setting.key] = value;
    }
    return settings;
  }

  async getSettingsByCategory(category) {
    const dbSettings = await prisma.systemSetting.findMany({ where: { category } });
    const categorySettings = [];
    for (const [, setting] of this.settings.entries()) {
      if (setting.category === category) {
        const dbOverride = dbSettings.find(s => s.key === setting.key);
        const value = dbOverride ? this.parseValue(dbOverride.value, setting.valueType) : setting.value;
        categorySettings.push({ ...setting, value });
      }
    }
    return categorySettings;
  }

  async getSetting(category, key) {
    const settingKey = `${category}.${key}`;
    const base = this.settings.get(settingKey) || null;
    if (!base) return null;
    const db = await prisma.systemSetting.findUnique({ where: { category_key: { category, key } } });
    const value = db ? this.parseValue(db.value, base.valueType) : base.value;
    return { ...base, value };
  }

  async updateSetting(category, key, value, description, updatedBy) {
    const settingKey = `${category}.${key}`;
    const existingSetting = this.settings.get(settingKey);

    if (!existingSetting) {
      throw new Error(`Setting ${settingKey} not found`);
    }

    const valueStr = this.stringifyValue(value, existingSetting.valueType);
    await prisma.systemSetting.upsert({
      where: { category_key: { category, key } },
      create: {
        category,
        key,
        value: valueStr,
        valueType: existingSetting.valueType,
        description: description || existingSetting.description,
        isEncrypted: existingSetting.isEncrypted || false,
        updatedBy: updatedBy || 'system',
      },
      update: {
        value: valueStr,
        description: description || existingSetting.description,
        updatedBy: updatedBy || 'system',
      },
    });

    const updatedSetting = { ...existingSetting, value, description: description || existingSetting.description, updatedAt: new Date() };
    this.settings.set(settingKey, updatedSetting);
    return updatedSetting;
  }

  async validateSetting(category, key, value) {
    const settingKey = `${category}.${key}`;
    const setting = this.settings.get(settingKey);

    if (!setting) {
      return { valid: false, message: `Setting ${settingKey} not found` };
    }

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
        try { JSON.parse(typeof value === 'string' ? value : JSON.stringify(value)); isValidType = true; } catch { isValidType = false; }
        break;
      default:
        isValidType = true;
    }

    if (!isValidType) {
      return { valid: false, message: `Value must be of type ${expectedType}` };
    }

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

  async resetCategoryToDefaults(category) {
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

    const headers = ['Category', 'Key', 'Value', 'Type', 'Description', 'Encrypted', 'Updated At'];
    const rows = Array.from(this.settings.values()).map(setting => [
      setting.category,
      setting.key,
      setting.value,
      setting.valueType,
      setting.description || '',
      setting.isEncrypted,
      setting.updatedAt.toISOString(),
    ]);

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  }

  async importSettings(settings, format = 'json', updatedBy) {
    let parsedSettings;

    if (format === 'json') {
      parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
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
      count: Array.from(this.settings.values()).filter(s => s.category === category).length,
    }));
  }
}

module.exports = new SettingsService();
