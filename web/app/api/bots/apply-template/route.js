import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '../../../../../src/lib/prisma.js';
import templateService from '../../../../../src/services/TemplateService.js';
import { verifyCsrf } from '../../_utils/csrf';

export async function POST(request) {
  try {
    // CSRF check (enabled when ENABLE_CSRF=true)
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;
    // Read token from Authorization header or httpOnly cookie
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botInstanceId, templateId } = await request.json();

    if (!botInstanceId || !templateId) {
      return NextResponse.json({ error: 'Bot ID and template ID are required' }, { status: 400 });
    }

    // Get user's tenant
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { tenant: true }
    });

    if (!userRecord?.tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    // Verify bot belongs to user's tenant
    const botInstance = await prisma.botInstance.findFirst({
      where: {
        id: botInstanceId,
        tenantId: userRecord.tenant.id
      }
    });

    if (!botInstance) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Get template (can be global or tenant-specific)
    const template = await prisma.botTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { tenantId: userRecord.tenant.id }, // Tenant-specific
          { tenantId: null } // Global template
        ],
        isActive: true
      },
      include: {
        menuItems: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Apply template using TemplateService
    const result = await templateService.applyTemplateToBot(botInstanceId, templateId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error applying template:', error);
    return NextResponse.json({ error: 'Failed to apply template' }, { status: 500 });
  }
}