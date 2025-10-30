import createBotContext from '../../../src/utils/createBotContext';
import WhatsDeXBrain from '../../../src/services/WhatsDeXBrain';
import originalContext from '../../../context'; // Assuming context.js is in the root

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.WEBHOOK_SECRET) {
        return res.status(403).json({ message: 'Forbidden: Invalid webhook secret' });
    }

    const incomingMessage = req.body;

    try {
        // Reconstruct the ctx object
        // Pass null for botInstance as it's not available here, and originalContext
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const sessionId = req.headers['x-session-id'] || 'unknown'; // Assuming a session ID might be passed
        const location = req.headers['x-vercel-ip-country'] || 'unknown'; // Vercel specific header for location

        const ctx = await createBotContext(null, incomingMessage, originalContext, { ip, userAgent, sessionId, location });

        // Initialize WhatsDeXBrain with a placeholder bot and the original context
        // The WhatsDeXBrain constructor expects a bot instance, but in this API route,
        // we don't have a live bot. We'll pass null and assume WhatsDeXBrain
        // doesn't directly use it in processMessage.
        const brain = new WhatsDeXBrain(null, originalContext);

        // Process the message with the brain
        await brain.processMessage(ctx);

        res.status(200).json({ status: 'Received and Processed' });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
}