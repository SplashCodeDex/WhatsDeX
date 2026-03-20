import crypto from "node:crypto";
import { type FacebookCredentials } from "./types.js";
import { getChildLogger } from "../logging/logger.js";

const logger = getChildLogger({ module: "facebook-webhook" });

/**
 * Validates the X-Hub-Signature-256 header from Facebook.
 */
export function validateFacebookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  if (!signature || !appSecret) return false;
  
  const [algo, hash] = signature.split('=');
  if (algo !== 'sha256') return false;

  const expectedHash = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");
    
  return hash === expectedHash;
}

/**
 * Handles the initial webhook verification challenge from Meta.
 */
export function handleFacebookChallenge(
  query: Record<string, any>,
  verifyToken: string
): { status: number; body?: string } {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  if (mode === "subscribe" && token === verifyToken) {
    logger.info("webhook verification successful");
    return { status: 200, body: challenge };
  }
  
  logger.warn("webhook verification failed: token mismatch");
  return { status: 403 };
}

/**
 * Normalizes Facebook messaging events into a simplified format for OpenClaw/DeXMart.
 */
export function normalizeFacebookEvents(body: any): any[] {
  if (body.object !== 'page') return [];

  const events: any[] = [];
  
  for (const entry of body.entry) {
    if (!entry.messaging) continue;
    
    for (const messagingEvent of entry.messaging) {
      // Filter for standard text/media messages (ignore echoes)
      if (messagingEvent.message && !messagingEvent.message.is_echo) {
        events.push({
          sender: messagingEvent.sender.id,
          recipient: messagingEvent.recipient.id,
          timestamp: messagingEvent.timestamp,
          content: messagingEvent.message.text || "",
          attachments: messagingEvent.message.attachments || [],
          raw: messagingEvent
        });
      }
    }
  }
  
  return events;
}
