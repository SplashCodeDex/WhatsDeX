import planService from '../src/services/PlanService.js';
import templateService from '../src/services/TemplateService.js';
import prisma from '../src/lib/prisma.js';

async function seedPlans() {
  console.log('🌱 Seeding default plans...');
  
  try {
    await planService.seedDefaultPlans();
    console.log('✅ Default plans seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed plans:', error);
  }
}

async function seedGlobalTemplates() {
  console.log('🌱 Seeding global templates...');
  
  const templates = [
    {
      name: 'Welcome Assistant',
      description: 'Perfect for greeting new users and providing basic information',
      category: 'welcome',
      welcomeMessage: 'Hi! 👋 Welcome to our WhatsApp assistant. How can I help you today?',
      menuItems: [
        { label: '📋 Services', actionType: 'reply', payload: 'Tell me about our services', order: 0 },
        { label: '📞 Contact', actionType: 'reply', payload: 'Here are our contact details', order: 1 },
        { label: '⏰ Hours', actionType: 'reply', payload: 'We are open Monday-Friday 9AM-5PM', order: 2 },
        { label: '💬 Live Chat', actionType: 'command', payload: 'connect_human', order: 3 }
      ]
    },
    {
      name: 'Customer Support',
      description: 'Streamlined support with common questions and escalation options',
      category: 'support',
      welcomeMessage: 'Hello! I\'m here to help with your questions. What do you need assistance with?',
      menuItems: [
        { label: '❓ FAQ', actionType: 'reply', payload: 'Here are our frequently asked questions', order: 0 },
        { label: '🛠️ Troubleshooting', actionType: 'reply', payload: 'Let me help you troubleshoot', order: 1 },
        { label: '📱 Account Help', actionType: 'reply', payload: 'Account related assistance', order: 2 },
        { label: '👨‍💼 Speak to Agent', actionType: 'command', payload: 'escalate_human', order: 3 }
      ]
    },
    {
      name: 'Sales & Lead Generation',
      description: 'Capture leads and guide prospects through your sales funnel',
      category: 'leads',
      welcomeMessage: 'Hi there! 🛍️ Welcome to [Business Name]. Let me help you find what you\'re looking for!',
      menuItems: [
        { label: '🛍️ Browse Products', actionType: 'link', payload: 'https://yourstore.com/products', order: 0 },
        { label: '💰 Pricing', actionType: 'reply', payload: 'Here are our current prices', order: 1 },
        { label: '📞 Schedule Call', actionType: 'reply', payload: 'Book a free consultation', order: 2 },
        { label: '🎁 Special Offers', actionType: 'reply', payload: 'Check out our latest deals!', order: 3 }
      ]
    },
    {
      name: 'Community Hub',
      description: 'Build engagement with community features and group management',
      category: 'community',
      welcomeMessage: 'Welcome to our community! 🌟 Connect with others and stay updated.',
      menuItems: [
        { label: '📢 Announcements', actionType: 'reply', payload: 'Latest community news', order: 0 },
        { label: '🎪 Events', actionType: 'reply', payload: 'Upcoming community events', order: 1 },
        { label: '💡 Share Ideas', actionType: 'reply', payload: 'Share your thoughts with the community', order: 2 },
        { label: '📋 Rules', actionType: 'reply', payload: 'Community guidelines and rules', order: 3 }
      ]
    }
  ];

  try {
    for (const templateData of templates) {
      // Check if template already exists
      const existing = await prisma.botTemplate.findFirst({
        where: {
          name: templateData.name,
          tenantId: null // Global template
        }
      });

      if (!existing) {
        await prisma.botTemplate.create({
          data: {
            tenantId: null, // Global template
            name: templateData.name,
            description: templateData.description,
            category: templateData.category,
            welcomeMessage: templateData.welcomeMessage,
            menuItems: {
              create: templateData.menuItems
            }
          }
        });
        console.log(`✅ Created template: ${templateData.name}`);
      } else {
        console.log(`⏭️ Template already exists: ${templateData.name}`);
      }
    }
    
    console.log('✅ Global templates seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed templates:', error);
  }
}

async function main() {
  console.log('🚀 Starting seed process...');
  
  await seedPlans();
  await seedGlobalTemplates();
  
  console.log('🎉 Seed process completed!');
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Seed process failed:', error);
  process.exit(1);
});