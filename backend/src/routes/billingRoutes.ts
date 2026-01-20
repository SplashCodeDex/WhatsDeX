import { Router } from 'express';
import { createCheckoutSession, getSubscription } from '../controllers/billingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/checkout', authenticateToken, createCheckoutSession);
router.get('/subscription', authenticateToken, getSubscription);

export default router;
