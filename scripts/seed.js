const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create Users
  for (let i = 0; i < 50; i++) {
    await prisma.user.create({
      data: {
        jid: `user${i}@example.com`,
        name: `User ${i}`,
        phone: `+123456789${i.toString().padStart(2, '0')}`,
        email: `user${i}@example.com`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        premium: Math.random() > 0.5,
        banned: Math.random() > 0.8,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        level: Math.floor(Math.random() * 50) + 1,
        xp: Math.floor(Math.random() * 5000),
      },
    });
  }

  // Create Command Usages
  const users = await prisma.user.findMany();
  const commands = ['menu', 'help', 'ping', 'sticker', 'download'];
  for (const user of users) {
    for (let i = 0; i < Math.floor(Math.random() * 100); i++) {
      await prisma.commandUsage.create({
        data: {
          userId: user.id,
          command: commands[Math.floor(Math.random() * commands.length)],
          category: 'main',
          success: true,
          executionTime: Math.floor(Math.random() * 1000),
        },
      });
    }
  }

  // Create Payments
  for (const user of users) {
    if (user.premium) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: Math.floor(Math.random() * 100),
          currency: 'USD',
          status: 'completed',
          paymentMethod: 'stripe',
          transactionId: `txn_${Math.random().toString(36).substring(7)}`,
        },
      });
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
