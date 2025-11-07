import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req, res) {
  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          premium: true, // This will be mapped to 'plan'
          banned: true, // This will be mapped to 'status'
          createdAt: true, // This will be mapped to 'joinDate'
          lastActivity: true, // This will be mapped to 'lastActive'
          commands: {
            select: {
              id: true,
            },
          }, // This will be used to calculate 'commandsUsed'
          aiRequests: true, // Assuming this is a field in your User model
          totalSpent: true, // Assuming this is a field in your User model
          level: true,
          xp: true,
        },
      });

      // Map the database fields to the fields expected by the frontend
      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        phone: user.phone || 'N/A',
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        plan: user.premium ? 'pro' : 'free', // Example mapping
        status: user.banned ? 'banned' : 'active', // Example mapping
        joinDate: user.createdAt,
        lastActive: user.lastActivity,
        commandsUsed: user.commands.length,
        aiRequests: user.aiRequests || 0, // Default value if not present
        totalSpent: user.totalSpent || 0, // Default value if not present
        level: user.level,
        xp: user.xp,
      }));

      res.status(200).json(formattedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: 'An error occurred while fetching users.' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
