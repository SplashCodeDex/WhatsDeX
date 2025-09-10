const SmartAuthManager = require('./src/services/smartAuthManager');
const config = require('./config');

async function testSmartAuth() {
  console.log('🧠 Testing Smart Authentication System...\n');

  try {
    const smartAuth = new SmartAuthManager();

    console.log('🔍 Detecting current authentication status...');
    const authAnalysis = await smartAuth.detectAuthStatus(config);

    console.log('📊 Analysis Results:');
    console.log(`   - Is Authenticated: ${authAnalysis.isAuthenticated}`);
    console.log(`   - Method: ${authAnalysis.method || 'None'}`);
    console.log(`   - Confidence: ${authAnalysis.confidence}%`);
    console.log(`   - Phone Number: ${authAnalysis.phoneNumber || 'Not found'}`);
    console.log(`   - Recommendation: ${authAnalysis.recommendation.message}`);

    console.log('\n🎯 Executing smart authentication...');
    const authResult = await smartAuth.executeSmartAuth(config);

    console.log('✅ Authentication setup complete!');
    console.log(`   - Method: ${authResult.result.method}`);
    console.log(`   - Phone Required: ${authResult.result.phoneRequired}`);
    console.log(`   - Phone Number: ${authResult.result.phoneNumber || 'Not configured'}`);

    if (authResult.instructions) {
      console.log('\n📋 Instructions:');
      console.log(`   Title: ${authResult.instructions.title}`);
      if (authResult.instructions.introduction) {
        console.log(`   Intro: ${authResult.instructions.introduction}`);
      }
    }

    console.log('\n🎉 Smart Authentication System is working!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSmartAuth();