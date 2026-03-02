import { Request, Response } from 'express';
import { z } from 'zod';
import logger from '@/utils/logger.js';
import { ContactService } from '@/services/contactService.js';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { ContactSchema } from '@/types/contracts.js';

const CreateContactSchema = (ContactSchema as any).unwrap().omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    status: true
}).extend({
    phone: z.string().min(1, "Phone number is required"),
    name: z.string().min(1, "Name is required")
});

const UpdateContactSchema = CreateContactSchema.partial();

export class ContactController {
    /**
     * Import contacts from CSV
     */
    static async importContacts(req: Request, res: Response) {
        const filePath = req.file?.path;
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                if (filePath) await fs.unlink(filePath).catch(() => {});
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            if (!filePath) {
                return res.status(400).json({ success: false, error: 'CSV file is required' });
            }

            const service = ContactService.getInstance();
            const botId = (req.query?.botId as string) || (req.body?.botId as string);
            const result = await service.importContacts(tenantId, filePath, botId);

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error.message });
            }

            res.json({ success: true, data: result.data });
        } catch (error: unknown) {
            logger.error('ContactController.importContacts error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        } finally {
            if (filePath && existsSync(filePath)) {
                await fs.unlink(filePath).catch(() => {});
            }
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
            const service = ContactService.getInstance();
            const result = await service.listContacts(tenantId, limit);

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error.message });
            }

            res.json({ success: true, data: result.data });
        } catch (error: unknown) {
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

            const validated = CreateContactSchema.safeParse(req.body);
            if (!validated.success) {
                return res.status(400).json({
                    success: false,
                    error: validated.error.issues[0].message
                });
            }

            const service = ContactService.getInstance();
            const result = await service.createContact(tenantId, validated.data);

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error.message });
            }

            res.status(201).json({ success: true, data: result.data });
        } catch (error: unknown) {
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

            const validated = UpdateContactSchema.safeParse(req.body);
            if (!validated.success) {
                return res.status(400).json({
                    success: false,
                    error: validated.error.issues[0].message
                });
            }

            if (Object.keys(validated.data).length === 0) {
                return res.status(400).json({ success: false, error: 'Request body cannot be empty.' });
            }

            const service = ContactService.getInstance();
            const result = await service.updateContact(tenantId, contactId, validated.data);

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error.message });
            }

            res.json({ success: true, data: { message: 'Contact updated' } });
        } catch (error: unknown) {
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

            const service = ContactService.getInstance();
            const result = await service.deleteContact(tenantId, contactId);

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error.message });
            }

            res.json({ success: true, data: { message: 'Contact deleted' } });
        } catch (error: unknown) {
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
        } catch (error: unknown) {
            logger.error('ContactController.getAudiences error', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}
