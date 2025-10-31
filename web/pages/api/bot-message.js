import createBotContext from 'whatsdex/src/utils/createBotContext';
import WhatsDeXBrain from 'whatsdex/src/services/WhatsDeXBrain';
import originalContext from 'whatsdex/context'; // Assuming context.js is in the root

// This function will be called by the BullMQ worker
export async function processWebhookMessage(incomingMessage, requestInfo) {
  try {
    // Reconstruct the ctx object
    // Pass null for botInstance as it's not available here, and originalContext
    const ctx = await createBotContext(null, incomingMessage, originalContext, requestInfo);

    // Initialize WhatsDeXBrain with a placeholder bot and the original context
    const brain = new WhatsDeXBrain(null, originalContext);

    // Process the message with the brain
    await brain.processMessage(ctx);

    return { status: 'Received and Processed' };
  } catch (error) {
    console.error('Error processing webhook message:', error);
    throw new Error('Failed to process webhook message');
  }
}
