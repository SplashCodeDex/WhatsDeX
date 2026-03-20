import { fetch } from "undici";
import { type FacebookCredentials, type FacebookSendResult } from "./types.js";
import { getChildLogger } from "../logging/logger.js";
import { generateSecureUuid } from "../infra/secure-random.js";
import { redactIdentifier } from "../logging/redact-identifier.js";

const FACEBOOK_API_VERSION = "v20.0";
const FACEBOOK_TEXT_LIMIT = 2000;

export async function sendMessageFacebook(
  to: string,
  text: string,
  credentials: FacebookCredentials,
  options: { verbose?: boolean } = {}
): Promise<FacebookSendResult> {
  const correlationId = generateSecureUuid();
  const redactedTo = redactIdentifier(to);
  const logger = getChildLogger({
    module: "facebook-send",
    correlationId,
    to: redactedTo,
  });

  try {
    // 1. Handle Chunking (Simple implementation for now)
    const chunks = chunkText(text, FACEBOOK_TEXT_LIMIT);
    let lastResult: any;

    for (const chunk of chunks) {
      const payload = {
        recipient: { id: to },
        message: { text: chunk },
        messaging_type: "RESPONSE",
      };

      const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/messages?access_token=${credentials.pageAccessToken}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(`Facebook API error: ${errorData.error?.message || response.statusText}`);
      }

      lastResult = await response.json();
    }

    return lastResult as FacebookSendResult;
  } catch (err) {
    logger.error({ err: String(err) }, "failed to send message via facebook");
    throw err;
  }
}

export async function sendActionFacebook(
  to: string,
  action: "typing_on" | "typing_off" | "mark_seen",
  credentials: FacebookCredentials
): Promise<void> {
  const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/messages?access_token=${credentials.pageAccessToken}`;
  const payload = {
    recipient: { id: to },
    sender_action: action,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json() as any;
    console.error(`Facebook Action error: ${errorData.error?.message || response.statusText}`);
  }
}

function chunkText(text: string, limit: number): string[] {
  const chunks: string[] = [];
  let current = text;
  while (current.length > limit) {
    chunks.push(current.substring(0, limit));
    current = current.substring(limit);
  }
  if (current.length > 0) {
    chunks.push(current);
  }
  return chunks;
}
