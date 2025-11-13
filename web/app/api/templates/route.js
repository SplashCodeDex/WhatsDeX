import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../../src/lib/prisma.js';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true }
    });

    if (!user?.tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    // Get templates (global and tenant-specific)
    const templates = await prisma.botTemplate.findMany({
      where: {
        OR: [
          { tenantId: user.tenant.id }, // Tenant-specific templates
          { tenantId: null } // Global templates
        ],
        isActive: true
      },
      include: {
        menuItems: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: [
        { tenantId: 'desc' }, // Tenant-specific first
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, category, welcomeMessage, menuItems = [] } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    if (!category?.trim()) {
      return NextResponse.json({ error: 'Template category is required' }, { status: 400 });
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true }
    });

    if (!user?.tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    // Create template
    const template = await prisma.botTemplate.create({
      data: {
        tenantId: user.tenant.id,
        name: name.trim(),
        description: description?.trim(),
        category: category.trim(),
        welcomeMessage: welcomeMessage?.trim(),
        menuItems: {
          create: menuItems.map((item, index) => ({
            label: item.label,
            actionType: item.actionType,
            payload: item.payload,
            order: item.order || index
          }))
        }
      },
      include: {
        menuItems: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}