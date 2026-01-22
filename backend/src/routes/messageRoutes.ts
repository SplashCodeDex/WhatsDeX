import express from 'express';
import { MessageController } from '../controllers/messageController.js';

const router = express.Router();

/**
 * GET /messages
 * List messages for a tenant (from Firestore history)
 */
router.get('/', MessageController.listMessages);

/**
 * POST /messages/send
 * Send a message via a specific bot
 */
router.post('/send', MessageController.sendMessage);

export default router;
