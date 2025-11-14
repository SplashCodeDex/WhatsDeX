import { NextResponse } from 'next/server';
import multiTenantService from '../../../src/services/multiTenantService';
import multiTenantBotService from '../../../src/services/multiTenantBotService';
import jwt from 'jsonwebtoken';
import { verifyCsrf } from '../_utils/csrf';

// Ensure Node.js runtime (needed for fs, sockets) and disable static optimization
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to authenticate requests
async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    try {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/(?:^|; )auth_token=([^;]+)/);
      token = match ? decodeURIComponent(match[1]) : null;
    } catch {}
  }
  if (!token) {
    throw new Error('Authentication token required');
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  
  return decoded;
}

// GET /api/bots - Get all bot instances for tenant
export async function GET(request) {
  try {
    let user;
    try {
      user = await authenticateRequest(request);
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenant = await multiTenantService.getTenant(user.tenantId);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get bot instances with status
    const botInstances = tenant.botInstances || [];
    const botsWithStatus = await Promise.all(
      botInstances.map(async (bot) => {
        try {
          const status = await multiTenantBotService.getBotStatus(bot.id);
          return status;
        } catch (error) {
          return { ...bot, error: error.message };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        bots: botsWithStatus,
        limits: JSON.parse(tenant.planLimits || '{}'),
        plan: tenant.plan
      }
    });

  } catch (error) {
    console.error('Get bots error:', error);
    const payload = process.env.NODE_ENV === 'production'
      ? { error: 'Failed to get bot instances' }
      : { error: 'Failed to get bot instances', details: error?.message, stack: error?.stack };
    return NextResponse.json(
      payload,
      { status: 500 }
    );
  }
}

// POST /api/bots - Create new bot instance
export async function POST(request) {
  try {
    // CSRF check (enabled when ENABLE_CSRF=true)
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;
    let user;
    try {
      user = await authenticateRequest(request);
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, config } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Bot name is required' },
        { status: 400 }
      );
    }

    // Create bot instance
    const botInstance = await multiTenantBotService.createBotInstance(
      user.tenantId,
      {
        name,
        config: config || {
          welcomeMessage: `Hello! I'm ${name}, your WhatsApp assistant.`,
          aiEnabled: true,
          defaultLanguage: 'en'
        }
      }
    );

    // Log action
    await multiTenantService.logAction(
      user.tenantId,
      user.userId,
      'bot_created',
      'bot',
      botInstance.id,
      { name },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent')
    );

    // Record analytics
    await multiTenantService.recordAnalytic(
      user.tenantId,
      'bot_created',
      1,
      { botName: name }
    );

    return NextResponse.json({
      success: true,
      data: botInstance
    });

  } catch (error) {
    console.error('Create bot error:', error);
    
    if (error?.message?.includes('limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    const payload = process.env.NODE_ENV === 'production'
      ? { error: 'Failed to create bot instance' }
      : { error: 'Failed to create bot instance', details: error?.message, stack: error?.stack };

    return NextResponse.json(
      payload,
      { status: 500 }
    );
  }
}