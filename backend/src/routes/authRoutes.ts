import express from 'express';
import { signup, login, logout, getMe, checkAvailability, loginWithGoogle, refresh } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', signup);
router.post('/login', login);
router.post('/google', loginWithGoogle);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/availability', checkAvailability);
router.route('/me').get(authenticateToken, getMe).post(authenticateToken, getMe);

export default router;
