import { TelegramAdapter } from "../src/services/channels/telegram/TelegramAdapter.js";

async function main() {
    console.log("Starting TelegramAdapter test...");

    const token = process.env.TELEGRAM_BOT_TOKEN || "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
    const adapter = new TelegramAdapter(token);

    console.log(`Initialized adapter for channel: ${adapter.id}`);
    console.log("Capabilities:", JSON.stringify(adapter.capabilities, null, 2));

    // We can't actually connect without a valid token, but we can verify the structure
    if (adapter.id !== "telegram") {
        throw new Error("Adapter ID mismatch");
    }

    try {
        // Attempt connection (will fail with invalid token but proves code runs)
        console.log("Attempting connection (expected to fail with dummy token)...");
        await adapter.connect();
    } catch (error: any) {
        console.log("Connection failed as expected (invalid token):", error.message);
        if (error.message.includes("404") || error.message.includes("Unauthorized")) {
            console.log("SUCCESS: Adapter attempted to connect correctly.");
        } else {
            console.log("WARNING: Unexpected error during connection attempt.");
        }
    }

    console.log("TelegramAdapter test complete.");
}

main().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
