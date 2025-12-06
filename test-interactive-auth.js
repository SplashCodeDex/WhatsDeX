#!/usr/bin/env node

/**
 * Test Interactive Authentication System
 * Demonstrates the new interactive authentication choice system
 */

const InteractiveAuthEnhancement = require('./backend/src/services/interactiveAuth.js');
const UnifiedSmartAuth = require('./backend/src/services/unifiedSmartAuth.js');

async function testInteractiveAuth() {
  console.log('🧪 Testing Interactive Authentication System');
  console.log('═'.repeat(50));

  try {
    // Initialize systems
    const unifiedAuth = new UnifiedSmartAuth();
    const interactiveAuth = new InteractiveAuthEnhancement(unifiedAuth);

    console.log('✅ Systems initialized successfully');

    // Test session detection
    console.log('\n🔍 Testing session detection...');
    const sessionCheck = await interactiveAuth.detectExistingSession();
    console.log('Session detection result:', sessionCheck);

    // Test authentication choice prompt
    console.log('\n🎯 Testing authentication choice prompt...');
    console.log('Note: This will prompt for user input. Press Enter for auto-selection.');

    const choice = await interactiveAuth.promptAuthenticationChoice();
    console.log('User choice result:', choice);

    // Test analytics display
    console.log('\n📊 Testing analytics display...');
    interactiveAuth.displayAnalytics();

    console.log('\n✅ Interactive Authentication System test completed successfully!');
    console.log('🎉 The system is ready for user interaction!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testInteractiveAuth().catch(console.error);
}

module.exports = { testInteractiveAuth };
