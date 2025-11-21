import express from 'express';
import { signup, login, getMe, checkAvailability } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', signup);
router.post('/login', login);
router.get('/availability', checkAvailability);
router.get('/me', authenticateToken, getMe);

export default router;
