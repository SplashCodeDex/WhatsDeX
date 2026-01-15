const templates = [
  {
    id: 'welcome',
    name: 'Welcome Assistant',
    description: 'Perfect for greeting new users and providing basic information',
    category: 'welcome',
    icon: 'MessageSquare',
    welcomeMessage: 'Hi! 👋 Welcome to our WhatsApp assistant. How can I help you today?',
    menuItems: [
      { label: '📋 Services', actionType: 'reply', payload: 'Tell me about our services' },
      { label: '📞 Contact', actionType: 'reply', payload: 'Here are our contact details' },
      { label: '⏰ Hours', actionType: 'reply', payload: 'We are open Monday-Friday 9AM-5PM' },
      { label: '💬 Live Chat', actionType: 'command', payload: 'connect_human' }
    ],
    popular: true
  },
  {
    id: 'support',
    name: 'Customer Support',
    description: 'Streamlined support with common questions and escalation options',
    category: 'support',
    icon: 'Headphones',
    welcomeMessage: 'Hello! I\'m here to help with your questions. What do you need assistance with?',
    menuItems: [
      { label: '❓ FAQ', actionType: 'reply', payload: 'Here are our frequently asked questions' },
      { label: '🛠️ Troubleshooting', actionType: 'reply', payload: 'Let me help you troubleshoot' },
      { label: '📱 Account Help', actionType: 'reply', payload: 'Account related assistance' },
      { label: '👨‍💼 Speak to Agent', actionType: 'command', payload: 'escalate_human' }
    ],
    popular: false
  },
  {
    id: 'sales',
    name: 'Sales & Lead Generation',
    description: 'Capture leads and guide prospects through your sales funnel',
    category: 'leads',
    icon: 'Store',
    welcomeMessage: 'Hi there! 🛍️ Welcome to [Business Name]. Let me help you find what you\'re looking for!',
    menuItems: [
      { label: '🛍️ Browse Products', actionType: 'link', payload: 'https://yourstore.com/products' },
      { label: '💰 Pricing', actionType: 'reply', payload: 'Here are our current prices' },
      { label: '📞 Schedule Call', actionType: 'reply', payload: 'Book a free consultation' },
      { label: '🎁 Special Offers', actionType: 'reply', payload: 'Check out our latest deals!' }
    ],
    popular: false
  },
  {
    id: 'community',
    name: 'Community Hub',
    description: 'Build engagement with community features and group management',
    category: 'community',
    icon: 'Users',
    welcomeMessage: 'Welcome to our community! 🌟 Connect with others and stay updated.',
    menuItems: [
      { label: '📢 Announcements', actionType: 'reply', payload: 'Latest community news' },
      { label: '🎪 Events', actionType: 'reply', payload: 'Upcoming community events' },
      { label: '💡 Share Ideas', actionType: 'reply', payload: 'Share your thoughts with the community' },
      { label: '📋 Rules', actionType: 'reply', payload: 'Community guidelines and rules' }
    ],
    popular: false
  }
];

export const templateService = {
  getTemplates: async () => {
    return templates;
  },

  getTemplateById: async (id: string) => {
    return templates.find(t => t.id === id);
  }
};

export default templateService;
