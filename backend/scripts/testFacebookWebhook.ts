import { normalizeFacebookEvents, validateFacebookSignature, handleFacebookChallenge } from '../../openclaw/src/facebook/webhook.js';

const mockWebhookBody = {
  object: "page",
  entry: [
    {
      id: "PAGE_ID",
      time: 1458692752478,
      messaging: [
        {
          sender: {
            id: "USER_ID"
          },
          recipient: {
            id: "PAGE_ID"
          },
          timestamp: 1458692752478,
          message: {
            mid: "mid.1457764197618:41d102a3e1ae206a38",
            text: "hello, world!"
          }
        }
      ]
    }
  ]
};

console.log("Testing Normalizer...");
const events = normalizeFacebookEvents(mockWebhookBody);
console.log(`Found ${events.length} events (Expected: 1)`);
if (events[0]?.message?.text === 'hello, world!') {
  console.log("Normalizer: PASSED");
} else {
  console.error("Normalizer: FAILED", events[0]);
}

console.log("Testing Challenge...");
const challenge = handleFacebookChallenge('subscribe', 'my_secret_token', '12345', 'my_secret_token');
if (challenge === '12345') {
  console.log("Challenge: PASSED");
} else {
  console.error("Challenge: FAILED");
}
