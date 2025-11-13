import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../../../src/lib/prisma.js';

// Check if user is admin (simple check - you can enhance this)
async function isAdmin(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  // Add your admin logic here (role field, specific user IDs, etc.)
  return user?.email?.includes('admin') || user?.role === 'admin';
}

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    if (!await isAdmin(session.user.id)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get all tenants with their subscriptions and usage
    const tenants = await prisma.tenant.findMany({
      include: {
        subscriptions: {
          include: {
            plan: true
          }
        },
        usageCounters: {
          where: {
            period
          }
        },
        botInstances: {
          where: {
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format data for admin view
    const metrics = tenants.map(tenant => {
      const subscription = tenant.subscriptions[0];
      const usage = tenant.usageCounters[0] || {
        aiRequests: 0,
        messages: 0,
        mediaGens: 0
      };

      return {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        status: tenant.status,
        plan: {
          code: subscription?.plan?.code || 'FREE',
          name: subscription?.plan?.name || 'Free Plan'
        },
        subscription: {
          status: subscription?.status || 'none',
          currentPeriodEnd: subscription?.currentPeriodEnd
        },
        usage: {
          aiRequests: usage.aiRequests,
          messages: usage.messages,
          mediaGens: usage.mediaGens,
          period
        },
        bots: {
          active: tenant.botInstances.length,
          total: tenant.botInstances.length
        },
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt
      };
    });

    // Calculate summary statistics
    const summary = {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.status === 'active').length,
      totalBots: tenants.reduce((sum, t) => sum + t.botInstances.length, 0),
      planDistribution: {
        FREE: metrics.filter(m => m.plan.code === 'FREE').length,
        PRO: metrics.filter(m => m.plan.code === 'PRO').length,
        BUSINESS: metrics.filter(m => m.plan.code === 'BUSINESS').length
      },
      totalUsage: {
        aiRequests: metrics.reduce((sum, m) => sum + m.usage.aiRequests, 0),
        messages: metrics.reduce((sum, m) => sum + m.usage.messages, 0),
        mediaGens: metrics.reduce((sum, m) => sum + m.usage.mediaGens, 0)
      }
    };

    return NextResponse.json({
      summary,
      tenants: metrics,
      period
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}