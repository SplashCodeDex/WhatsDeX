import 'dotenv/config';
import initializeContext from '../lib/context.js';
import { toolRegistry } from '../services/toolRegistry.js';
import logger from '../utils/logger.js';

async function main() {
  console.log('>>> [VERIFICATION] Starting Nested Agentic Research Validation...');

  try {
    const context = await initializeContext();

    // Preparation: ensure tools are registered
    console.log('--- Step 1: Tool Registry Check ---');
    const tools = toolRegistry.getAllTools();
    const researchTool = tools.find(t => t.name === 'research');

    if (!researchTool) {
      throw new Error('Research tool not found in registry.');
    }
    console.log('[OK] Research tool is registered and available.');

    // Step 2: Execute Research Cycle
    console.log('--- Step 2: Executing Deep Research Cycle ---');
    console.log('Topic: "Impact of AI on software engineering in 2026"');

    const result = await toolRegistry.executeTool('research', {
      topic: 'Impact of AI on software engineering in 2026',
      depth: 3,
      intensive: false
    }, {
      ...context,
      tenantId: 'system',
      channelId: 'test-channel'
    });

    if (result.success) {
      console.log('\n✨ [SUCCESS] Research Cycle Completed Successfully!');
      console.log('--- Final Report ---');
      console.log(result.report);
      console.log('\n--- Metadata ---');
      console.log(JSON.stringify(result.metadata, null, 2));
    } else {
      throw new Error(`Research failed: ${result.error}`);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ [FAILURE] Validation failed:');
    console.error(error);
    process.exit(1);
  }
}

main();
