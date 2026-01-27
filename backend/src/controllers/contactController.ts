import { Request, Response } from 'express';
import { db } from '@/lib/firebase.js';
import { z } from 'zod';
import logger from '@/utils/logger.js';
import { ContactService } from '@/services/contactService.js';
import { ContactSchema } from '@/types/contracts.js';

export class ContactController {
    /**
     * Import contacts from CSV
     */
    static async importContacts(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const { csvData } = req.body;
            if (!csvData) return res.status(400).json({ success: false, error: 'CSV data is required' });

            const service = ContactService.getInstance();
            const result = await service.importContacts(tenantId, csvData);

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error.message });
            }

            res.json({ success: true, data: result.data });
        } catch (error: any) {
            logger.error('ContactController.importContacts error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * List all contacts for a tenant
     */
    static async listContacts(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const limit = parseInt(req.query.limit as string) || 100;
            // TODO: Cursor-based pagination

            const snapshot = await db.collection('tenants')
                .doc(tenantId)
                .collection('contacts')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.json({ success: true, data: contacts });
        } catch (error: any) {
            logger.error('ContactController.listContacts error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Create a new contact
     */
    static async createContact(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const contactRef = db.collection('tenants')
                .doc(tenantId)
                .collection('contacts')
                .doc();

            const body = req.body;
            const rawData = {
                id: contactRef.id,
                tenantId,
                name: body.name,
                phone: body.phone || body.phoneNumber,
                email: body.email || '',
                tags: body.tags || [],
                attributes: body.attributes || body.metadata || {},
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const validated = ContactSchema.parse(rawData);

            await contactRef.set(validated);
            res.status(201).json({ success: true, data: validated });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, error: error.issues[0].message });
            }
            logger.error('ContactController.createContact error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Update a contact
     */
    static async updateContact(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            const contactId = req.params.id as string;
            if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            if (Object.keys(req.body).length === 0) {
                return res.status(400).json({ success: false, error: 'Request body cannot be empty.' });
            }

            const contactRef = db.collection('tenants')
                .doc(tenantId)
                .collection('contacts')
                .doc(contactId);

            const contactDoc = await contactRef.get();
            if (!contactDoc.exists) {
                return res.status(404).json({ success: false, error: 'Contact not found' });
            }

            // Mapping from legacy field names if provided
            const body = req.body;
            const updates: any = {
                updatedAt: new Date()
            };

            if (body.name) updates.name = body.name;
            if (body.phone || body.phoneNumber) updates.phone = body.phone || body.phoneNumber;
            if (body.email !== undefined) updates.email = body.email;
            if (body.tags) updates.tags = body.tags;
            if (body.attributes || body.metadata) updates.attributes = body.attributes || body.metadata;

            const validated = ContactSchema.partial().parse(updates);

            await contactRef.update(validated);

            res.json({ success: true, data: { message: 'Contact updated' } });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, error: error.issues[0].message });
            }
            logger.error('ContactController.updateContact error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Delete a contact
     */
    static async deleteContact(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            const contactId = req.params.id as string;
            if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            await db.collection('tenants')
                .doc(tenantId)
                .collection('contacts')
                .doc(contactId)
                .delete();

            res.json({ success: true, data: { message: 'Contact deleted' } });
        } catch (error: any) {
            logger.error('ContactController.deleteContact error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Get audiences (segments) for a tenant
     */
    static async getAudiences(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const service = ContactService.getInstance();
            const result = await service.getAudience(tenantId);

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error.message });
            }

            res.json({ success: true, data: result.data });
        } catch (error: any) {
            logger.error('ContactController.getAudiences error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}
