import { tenantConfigService } from '../src/services/tenantConfigService.js';
import { DeXMartToolBridge } from '../src/services/DeXMartToolBridge.js';
import { toolRegistry } from '../src/services/toolRegistry.js';
import { channelManager } from '../src/services/channels/ChannelManager.js';

async function verify() {
    console.log('--- Phase 1 Verification ---');

    const tenantId = 'test-tenant';
    const agentId = 'test-agent';
    const channelId = 'test-channel';

    console.log('\n1. Verifying Nested Config Paths...');
    const result = await tenantConfigService.getChannelConfig(tenantId, channelId, agentId);
    console.log('getChannelConfig result success:', result.success);

    console.log('\n2. Verifying Dynamic Tool Bridging...');
    const mockChannel = {
        channelId,
        tenantId,
        config: { enabledTools: ['weather'] },
        cmd: new Map([
            ['weather', { description: 'Weather tool', category: 'misc', code: async () => { console.log('Weather executed'); } }]
        ]),
        executeMiddleware: async (ctx: any, next: any) => await next()
    };

    DeXMartToolBridge.registerCommands(mockChannel as any);
    const tools = toolRegistry.getAllTools();
    const hasWeather = tools.some(t => t.name === 'weather');
    console.log('Has weather tool:', hasWeather);

    if (hasWeather) {
        console.log('\n3. Verifying Runtime Channel Resolution...');
        const weatherTool = tools.find(t => t.name === 'weather');
        channelManager.registerAdapter(mockChannel as any);
        
        try {
            await weatherTool?.execute({}, { channelId, tenantId });
            console.log('Tool execution successful with resolved channel.');
        } catch (e) {
            console.error('Tool execution failed:', e);
        }
    }

    console.log('\n--- Verification Finished ---');
}

verify().catch(console.error);
