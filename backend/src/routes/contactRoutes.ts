import express, { Request, Response } from 'express';
import { db } from '../lib/firebase.js';
import { z } from 'zod';
import logger from '../utils/logger.js';
import { importContactsController } from '../controllers/contactController.js';

const router = express.Router();

/**
 * POST /contacts/import
 * Import contacts from CSV
 */
router.post('/import', importContactsController);

// Validation Schemas
const contactSchema = z.object({
    name: z.string().min(1),
    phoneNumber: z.string().min(5),
    email: z.string().email().optional().or(z.literal('')),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional()
});

/**
 * GET /contacts
 * List all contacts for a tenant
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const snapshot = await db.collection('tenants')
            .doc(tenantId)
            .collection('contacts')
            .orderBy('createdAt', 'desc')
            .limit(100) // Pagination TODO
            .get();

        const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: contacts });
    } catch (error: any) {
        logger.error('GET /contacts error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /contacts
 * Create a new contact
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

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
        logger.error('POST /contacts error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * PATCH /contacts/:id
 * Update a contact
 */
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const contactId = req.params.id as string;
        if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // 1. Check if the request body is empty
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, error: 'Request body cannot be empty.' });
        }

        const payload = contactSchema.partial().parse(req.body);

        const contactRef = db.collection('tenants')
            .doc(tenantId)
            .collection('contacts')
            .doc(contactId);

        // 2. Check if the contact exists
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
        logger.error('PATCH /contacts/:id error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * DELETE /contacts/:id
 * Delete a contact
 */
router.delete('/:id', async (req: Request, res: Response) => {
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
        logger.error('DELETE /contacts/:id error', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
