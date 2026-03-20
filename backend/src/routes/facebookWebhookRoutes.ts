import express from 'express';
import { logger } from '../utils/logger.js';
import { 
  getOpenClawRoot, 
  getFacebookWebhook 
} from '../utils/openclawImports.js';
import { channelService } from '../services/ChannelService.js';
import { ingressService } from '../services/IngressService.js';
import contextProvider from '../lib/context.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * GET /api/facebook-webhook/:channelId
 * Challenge handler for Meta Webhook verification
 */
router.get('/:channelId', async (req, res) => {
  const { channelId } = req.params;
  const result = await channelService.findChannelByIdGlobally(channelId);
  
  if (!result.success) {
    logger.warn(`[FacebookWebhook] Challenge received for unknown channel: ${channelId}`);
    return res.sendStatus(404);
  }

  const { channel } = result.data;
  const verifyToken = channel.credentials?.verifyToken;

  if (!verifyToken) {
    logger.warn(`[FacebookWebhook] No verifyToken configured for channel: ${channelId}`);
    return res.sendStatus(403);
  }

  const { handleFacebookChallenge } = await getFacebookWebhook();
  const challenge = handleFacebookChallenge(req.query as any, verifyToken);
  res.status(challenge.status).send(challenge.body);
});

/**
 * POST /api/facebook-webhook/:channelId
 * Message handler for Facebook Messenger events
 */
router.post('/:channelId', async (req, res) => {
  const { channelId } = req.params;
  const signature = req.headers['x-hub-signature-256'] as string;

  try {
    const result = await channelService.findChannelByIdGlobally(channelId);
    if (!result.success) {
      logger.warn(`[FacebookWebhook] Message received for unknown channel: ${channelId}`);
      return res.sendStatus(404);
    }

    const { channel, tenantId, agentId } = result.data;
    const appSecret = channel.credentials?.appSecret;

    // Use rawBody for accurate HMAC signature validation
    const rawBody = (req as any).rawBody?.toString() || JSON.stringify(req.body);

    const { validateFacebookSignature, normalizeFacebookEvents } = await getFacebookWebhook();

    if (!appSecret || !validateFacebookSignature(rawBody, signature, appSecret)) {
      logger.warn(`[FacebookWebhook] Signature validation failed for channel: ${channelId}`);
      return res.sendStatus(403);
    }

    const events = normalizeFacebookEvents(req.body);
    const context = await contextProvider();
    const fullPath = `tenants/${tenantId}/agents/${agentId}/channels/${channelId}`;

    for (const event of events) {
      await ingressService.handleCommonMessage(tenantId, channelId, {
        id: event.raw?.message?.mid || crypto.randomUUID(),
        platform: 'facebook',
        from: event.sender,
        to: channelId,
        content: { text: event.content },
        timestamp: event.timestamp,
        metadata: { raw: event.raw, fullPath }
      }, context, fullPath);
    }

    res.sendStatus(200);
  } catch (error: any) {
    logger.error('Facebook webhook error', error);
    if (!res.headersSent) {
      res.sendStatus(500);
    }
  }
});

export default router;
