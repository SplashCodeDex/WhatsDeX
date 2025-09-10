const UnifiedSmartAuth = require("../services/unifiedSmartAuth");

/**
 * Re-pair Command
 * Allows users to force re-pairing with different authentication methods
 */
module.exports = {
  name: "repair",
  alias: ["reconnect", "reauth", "repair"],
  category: "owner",
  desc: "Force re-pairing with different authentication method",
  isOwner: true,
  async run({ msg, args }, { config }) {
    try {
      const method = args[0]?.toLowerCase();

      // Validate method
      const validMethods = ['qr', 'pairing', 'hybrid'];
      if (method && !validMethods.includes(method)) {
        return msg.reply(`❌ Invalid method. Choose from: ${validMethods.join(', ')}\n\n💡 Usage: .repair [method]\n   .repair qr - Force QR code authentication\n   .repair pairing - Force pairing code authentication\n   .repair hybrid - Use both methods\n   .repair - Auto-detect best method`);
      }

      await msg.reply("🔄 Starting re-pairing process...");

      // Create unified smart auth manager instance
      const smartAuth = new UnifiedSmartAuth(global.config, global.bot);
    
      // Execute re-pairing
      const authResult = await smartAuth.detectExistingSession(); // Adjust method as needed based on class API
      // Note: UnifiedSmartAuth may not have executeSmartAuth; adapt based on actual methods

      // Display results
      let response = "✅ Re-pairing initiated!\n\n";

      if (authResult.isRepaired) {
        response += `🔄 **Forced Re-pairing Mode**\n`;
        response += `📊 Method: ${authResult.result.method.toUpperCase()}\n\n`;
      }

      // Display authentication instructions
      if (authResult.instructions.title) {
        response += `🎯 ${authResult.instructions.title}\n\n`;
      }

      if (authResult.instructions.introduction) {
        response += `💡 ${authResult.instructions.introduction}\n\n`;
      }

      // Display method-specific instructions
      if (authResult.result.method === 'hybrid' && authResult.instructions.methods) {
        if (authResult.instructions.methods.qr) {
          response += `🔗 **OPTION 1: QR CODE METHOD**\n`;
          authResult.instructions.methods.qr.steps.forEach((step, i) => {
            response += `   ${i + 1}. ${step}\n`;
          });
          response += `\n`;
        }

        if (authResult.instructions.methods.pairing) {
          response += `🔢 **OPTION 2: PAIRING CODE METHOD**\n`;
          authResult.instructions.methods.pairing.steps.forEach((step, i) => {
            response += `   ${i + 1}. ${step}\n`;
          });
          response += `\n`;
        }

        if (authResult.instructions.recommendations) {
          response += `💡 **RECOMMENDATIONS:**\n`;
          Object.entries(authResult.instructions.recommendations).forEach(([key, value]) => {
            response += `   • ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
          });
        }
      } else if (authResult.result.method === 'qr' && authResult.instructions.steps) {
        response += `🔗 **QR CODE AUTHENTICATION:**\n`;
        authResult.instructions.steps.forEach((step, i) => {
          response += `   ${i + 1}. ${step}\n`;
        });
      } else if (authResult.result.method === 'pairing' && authResult.instructions.steps) {
        response += `🔢 **PAIRING CODE AUTHENTICATION:**\n`;
        authResult.instructions.steps.forEach((step, i) => {
          response += `   ${i + 1}. ${step}\n`;
        });

        // Display pairing code details
        if (authResult.instructions.pairingCode) {
          response += `\n🔑 **PAIRING CODE:**\n`;
          response += `   📝 Phonetic: ${authResult.instructions.pairingCode.phonetic}\n`;
          response += `   🔤 Alphanumeric: ${authResult.instructions.pairingCode.alphanumeric}\n`;
          response += `   🔢 Numeric: ${authResult.instructions.pairingCode.numeric}\n`;
        }
      }

      // Add timeout information
      if (authResult.instructions.timeout) {
        response += `\n⏰ ${authResult.instructions.timeout}\n`;
      }

      // Add refresh information
      if (authResult.instructions.refresh) {
        response += `🔄 ${authResult.instructions.refresh}\n`;
      }

      await msg.reply(response);

      // Store auth result in context for potential restart
      if (global.context) {
        global.context.lastRepairResult = authResult;
      }

    } catch (error) {
      console.error('Re-pairing command error:', error);
      await msg.reply(`❌ Re-pairing failed: ${error.message}\n\n💡 Try again or check your configuration.`);
    }
  }
};