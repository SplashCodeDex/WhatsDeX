import { Request, Response } from 'express';
import { db } from '../lib/firebase.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

export class ContactController {
    /**
     * Import contacts from CSV (Placeholder)
     */
    static async importContacts(req: Request, res: Response) {
        // TODO: Implement CSV parsing and bulk import
        res.status(501).json({ success: false, error: 'Import functionality not implemented yet' });
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

            const contactSchema = z.object({
                name: z.string().min(1),
                phoneNumber: z.string().min(5),
                email: z.string().email().optional().or(z.literal('')),
                tags: z.array(z.string()).optional(),
                metadata: z.record(z.string(), z.any()).optional()
            });

            const payload = contactSchema.parse(req.body);

            const contactRef = db.collection('tenants')
                .doc(tenantId)
                .collection('contacts')
                .doc();

            const contact = {
                ...payload,
                id: contactRef.id,
                tenantId,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'active'
            };

            await contactRef.set(contact);
            res.status(201).json({ success: true, data: contact });
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

            const contactSchema = z.object({
                name: z.string().min(1),
                phoneNumber: z.string().min(5),
                email: z.string().email().optional().or(z.literal('')),
                tags: z.array(z.string()).optional(),
                metadata: z.record(z.string(), z.any()).optional()
            });

            const payload = contactSchema.partial().parse(req.body);

            const contactRef = db.collection('tenants')
                .doc(tenantId)
                .collection('contacts')
                .doc(contactId);

            const contactDoc = await contactRef.get();
            if (!contactDoc.exists) {
                return res.status(404).json({ success: false, error: 'Contact not found' });
            }

            await contactRef.update({
                ...payload,
                updatedAt: new Date()
            });

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
}
