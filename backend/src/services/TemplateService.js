import prisma from '../lib/prisma.js';

class TemplateService {
  async listTemplates(tenantId = null) {
    try {
      const templates = await prisma.botTemplate.findMany({
        where: {
          OR: [
            { tenantId }, // Tenant-specific templates
            { tenantId: null } // Global templates
          ],
          isActive: true
        },
        include: {
          menuItems: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return templates;
    } catch (error) {
      console.error('Failed to list templates:', error);
      throw new Error('Failed to list templates');
    }
  }

  async getTemplate(templateId) {
    try {
      const template = await prisma.botTemplate.findUnique({
        where: { id: templateId },
        include: {
          menuItems: {
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      return template;
    } catch (error) {
      console.error('Failed to get template:', error);
      throw error;
    }
  }

  async applyTemplateToBot(botInstanceId, templateId) {
    try {
      const template = await this.getTemplate(templateId);
      
      // Create or update bot settings
      const botSettings = await prisma.botSettings.upsert({
        where: { botInstanceId },
        create: {
          botInstanceId,
          welcomeMessage: template.welcomeMessage,
          menuEnabled: template.menuItems.length > 0
        },
        update: {
          welcomeMessage: template.welcomeMessage,
          menuEnabled: template.menuItems.length > 0
        }
      });

      // Clear existing menu items
      await prisma.botSettingsMenuItem.deleteMany({
        where: { settingsId: botSettings.id }
      });

      // Add new menu items from template
      if (template.menuItems.length > 0) {
        await prisma.botSettingsMenuItem.createMany({
          data: template.menuItems.map(item => ({
            settingsId: botSettings.id,
            label: item.label,
            actionType: item.actionType,
            payload: item.payload,
            order: item.order
          }))
        });
      }

      return await this.getBotSettings(botInstanceId);
    } catch (error) {
      console.error('Failed to apply template to bot:', error);
      throw new Error('Failed to apply template to bot');
    }
  }

  async getBotSettings(botInstanceId) {
    try {
      const settings = await prisma.botSettings.findUnique({
        where: { botInstanceId },
        include: {
          menuItems: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return settings;
    } catch (error) {
      console.error('Failed to get bot settings:', error);
      throw error;
    }
  }

  async createTemplate(tenantId, templateData) {
    try {
      const { name, description, category, welcomeMessage, menuItems = [] } = templateData;

      const template = await prisma.botTemplate.create({
        data: {
          tenantId,
          name,
          description,
          category,
          welcomeMessage,
          menuItems: {
            create: menuItems.map((item, index) => ({
              label: item.label,
              actionType: item.actionType,
              payload: item.payload,
              order: item.order || index
            }))
          }
        },
        include: {
          menuItems: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return template;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw new Error('Failed to create template');
    }
  }
}

export default new TemplateService();