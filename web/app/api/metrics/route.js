import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get active users (users active in last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await prisma.user.count({
      where: {
        lastActivity: {
          gte: twentyFourHoursAgo
        }
      }
    });

    // Get messages today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagesToday = await prisma.commandUsage.count({
      where: {
        usedAt: {
          gte: today
        }
      }
    });

    // Get average response time from recent commands
    const recentCommands = await prisma.commandUsage.findMany({
      where: {
        usedAt: {
          gte: twentyFourHoursAgo
        },
        executionTime: {
          not: null
        }
      },
      select: {
        executionTime: true
      },
      take: 1000
    });

    const avgResponseTime = recentCommands.length > 0
      ? Math.round(recentCommands.reduce((sum, cmd) => sum + cmd.executionTime, 0) / recentCommands.length)
      : 0;

    // Get system uptime (mock for now - would come from monitoring service)
    const uptime = Math.floor(process.uptime());

    // Get total commands executed
    const totalCommands = await prisma.commandUsage.count();

    // Get error rate (commands with errors in last 24h)
    const errors24h = await prisma.commandUsage.count({
      where: {
        usedAt: {
          gte: twentyFourHoursAgo
        },
        success: false
      }
    });

    const errorRate = messagesToday > 0 ? (errors24h / messagesToday * 100).toFixed(2) : 0;

    const metrics = {
      activeUsers,
      messagesToday,
      avgResponseTime,
      uptime,
      totalCommands,
      errorRate: parseFloat(errorRate)
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}