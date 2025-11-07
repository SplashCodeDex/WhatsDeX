import { NextResponse } from 'next/server';
import multiTenantService from '../../../src/services/multiTenantService';
import multiTenantBotService from '../../../src/services/multiTenantBotService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to authenticate requests
async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication token required');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET);
  
  return decoded;
}

// GET /api/bots - Get all bot instances for tenant
export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    
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
    return NextResponse.json(
      { error: 'Failed to get bot instances' },
      { status: 500 }
    );
  }
}

// POST /api/bots - Create new bot instance
export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
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
    
    if (error.message.includes('limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create bot instance' },
      { status: 500 }
    );
  }
}