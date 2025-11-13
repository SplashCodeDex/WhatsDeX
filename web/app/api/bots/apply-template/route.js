import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../../../src/lib/prisma.js';
import templateService from '../../../../../src/services/TemplateService.js';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botInstanceId, templateId } = await request.json();

    if (!botInstanceId || !templateId) {
      return NextResponse.json({ error: 'Bot ID and template ID are required' }, { status: 400 });
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true }
    });

    if (!user?.tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    // Verify bot belongs to user's tenant
    const botInstance = await prisma.botInstance.findFirst({
      where: {
        id: botInstanceId,
        tenantId: user.tenant.id
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
          { tenantId: user.tenant.id }, // Tenant-specific
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