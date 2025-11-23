
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Seed Plans
    const plans = [
        {
            code: 'FREE',
            name: 'Free Plan',
            description: 'Basic features for individuals',
            price: 0,
            currency: 'USD',
            aiRequestsPerMonth: 50,
            messagesPerDay: 100,
            maxBots: 1,
            enableAIChat: true,
        },
        {
            code: 'PRO',
            name: 'Pro Plan',
            description: 'Advanced features for businesses',
            price: 2900, // $29.00
            currency: 'USD',
            aiRequestsPerMonth: 1000,
            messagesPerDay: 10000,
            maxBots: 5,
            enableAIChat: true,
            enableImageGen: true,
            enableRAG: true,
        },
    ];

    for (const plan of plans) {
        const upsertedPlan = await prisma.plan.upsert({
            where: { code: plan.code },
            update: plan,
            create: plan,
        });
        console.log(`✅ Upserted plan: ${upsertedPlan.name}`);
    }

    console.log('✅ Seeding completed.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
