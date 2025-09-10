#!/usr/bin/env node

/**
 * WhatsDeX Re-pairing Script
 * Force re-pairing with different authentication methods
 */

const SmartAuthManager = require("../src/services/smartAuthManager");
const config = require("../config.js");
const path = require("path");

// Get command line arguments
const args = process.argv.slice(2);
const method = args[0]?.toLowerCase();

console.log("🔧 WhatsDeX Re-pairing Script");
console.log("============================");

async function main() {
  try {
    // Validate method
    const validMethods = ['qr', 'pairing', 'hybrid'];
    if (method && !validMethods.includes(method)) {
      console.log(`❌ Invalid method: ${method}`);
      console.log(`📋 Valid options: ${validMethods.join(', ')}`);
      console.log(`\n💡 Usage:`);
      console.log(`   node scripts/repair-bot.js qr       - Force QR code authentication`);
      console.log(`   node scripts/repair-bot.js pairing  - Force pairing code authentication`);
      console.log(`   node scripts/repair-bot.js hybrid   - Use both methods`);
      console.log(`   node scripts/repair-bot.js          - Auto-detect best method`);
      process.exit(1);
    }

    console.log(`🔄 Starting re-pairing process with ${method || 'auto-detect'} method...`);

    // Create smart auth manager instance
    const smartAuth = new SmartAuthManager();

    // Execute re-pairing
    const authResult = await smartAuth.executeSmartAuth(config, {
      forceRepair: true,
      forceMethod: method
    });

    console.log("\n✅ Re-pairing initiated successfully!");
    console.log("=====================================");

    if (authResult.isRepaired) {
      console.log(`🔄 Forced Re-pairing Mode: ${authResult.result.method.toUpperCase()}`);
    }

    // Display authentication instructions
    if (authResult.instructions.title) {
      console.log(`\n🎯 ${authResult.instructions.title}`);
    }

    if (authResult.instructions.introduction) {
      console.log(`💡 ${authResult.instructions.introduction}`);
    }

    // Display method-specific instructions
    if (authResult.result.method === 'hybrid' && authResult.instructions.methods) {
      console.log("\n🔗 OPTION 1: QR CODE METHOD");
      console.log("-".repeat(30));
      if (authResult.instructions.methods.qr) {
        authResult.instructions.methods.qr.steps.forEach((step, i) => {
          console.log(`   ${i + 1}. ${step}`);
        });
      }

      if (authResult.instructions.methods.pairing) {
        console.log("\n🔢 OPTION 2: PAIRING CODE METHOD");
        console.log("-".repeat(30));
        authResult.instructions.methods.pairing.steps.forEach((step, i) => {
          console.log(`   ${i + 1}. ${step}`);
        });

        // Display pairing code details
        if (authResult.instructions.methods.pairing.pairingCode) {
          console.log(`\n🔑 PAIRING CODE DETAILS:`);
          console.log(`   📝 Phonetic: ${authResult.instructions.methods.pairing.pairingCode.phonetic}`);
          console.log(`   🔤 Alphanumeric: ${authResult.instructions.methods.pairing.pairingCode.alphanumeric}`);
          console.log(`   🔢 Numeric: ${authResult.instructions.methods.pairingCode.numeric}`);
        }
      }

      if (authResult.instructions.recommendations) {
        console.log("\n💡 RECOMMENDATIONS:");
        Object.entries(authResult.instructions.recommendations).forEach(([key, value]) => {
          console.log(`   • ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
        });
      }
    } else if (authResult.result.method === 'qr' && authResult.instructions.steps) {
      console.log("\n🔗 QR CODE AUTHENTICATION:");
      authResult.instructions.steps.forEach((step, i) => {
        console.log(`   ${i + 1}. ${step}`);
      });
    } else if (authResult.result.method === 'pairing' && authResult.instructions.steps) {
      console.log("\n🔢 PAIRING CODE AUTHENTICATION:");
      authResult.instructions.steps.forEach((step, i) => {
        console.log(`   ${i + 1}. ${step}`);
      });

      // Display pairing code details
      if (authResult.instructions.pairingCode) {
        console.log(`\n🔑 PAIRING CODE DETAILS:`);
        console.log(`   📝 Phonetic: ${authResult.instructions.pairingCode.phonetic}`);
        console.log(`   🔤 Alphanumeric: ${authResult.instructions.pairingCode.alphanumeric}`);
        console.log(`   🔢 Numeric: ${authResult.instructions.pairingCode.numeric}`);
      }
    }

    // Add timeout information
    if (authResult.instructions.timeout) {
      console.log(`\n⏰ ${authResult.instructions.timeout}`);
    }

    // Add refresh information
    if (authResult.instructions.refresh) {
      console.log(`🔄 ${authResult.instructions.refresh}`);
    }

    console.log("\n🚀 Now restart your bot with: npm start");
    console.log("💡 Or run: node index.js");

  } catch (error) {
    console.error('\n❌ Re-pairing failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your BOT_PHONE_NUMBER environment variable');
    console.log('2. Ensure the phone number is in the correct format');
    console.log('3. Try a different authentication method');
    console.log('4. Check the logs for more details');

    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Re-pairing script interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Re-pairing script terminated');
  process.exit(0);
});

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});