const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SettingsService {
  async getAllSettings() {
    const settings = await prisma.systemSetting.findMany();
    const settingsByCategory = {};
    settings.forEach(setting => {
      if (!settingsByCategory[setting.category]) {
        settingsByCategory[setting.category] = {};
      }
      settingsByCategory[setting.category][setting.key] = this._parseValue(setting.value, setting.valueType);
    });
    return settingsByCategory;
  }

  async getSettingsByCategory(category) {
    return prisma.systemSetting.findMany({
      where: { category },
    });
  }

  async getSetting(category, key) {
    const setting = await prisma.systemSetting.findUnique({
      where: {
        category_key: {
          category,
          key,
        },
      },
    });
    if (setting) {
      setting.value = this._parseValue(setting.value, setting.valueType);
    }
    return setting;
  }

  async updateSetting(category, key, value, description, updatedBy) {
    const setting = await this.getSetting(category, key);
    if (!setting) {
      throw new Error(`Setting ${category}.${key} not found`);
    }

    const { valid, message } = this.validateSetting(setting, value);
    if (!valid) {
      throw new Error(message);
    }

    return prisma.systemSetting.update({
      where: {
        id: setting.id,
      },
      data: {
        value: String(value),
        description: description || setting.description,
        updatedBy,
      },
    });
  }

  validateSetting(setting, value) {
    const { valueType } = setting;
    let isValidType = false;

    switch (valueType) {
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
      return { valid: false, message: `Value must be of type ${valueType}` };
    }

    return { valid: true, message: 'Valid' };
  }


  async getCategories() {
    const categories = await prisma.systemSetting.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    });

    return categories.map(category => ({
      name: category.category,
      label: category.category.charAt(0).toUpperCase() + category.category.slice(1),
      count: category._count.category,
    }));
  }

  _parseValue(value, type) {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      default:
        return value;
    }
  }
}

module.exports = new SettingsService();
