import logger from '../utils/logger.js';
import { FlowData } from './flowService.js';

/**
 * FlowEngine - 2026 Mastermind Edition
 * Interprets and executes visual flows defined in the FlowBuilder.
 */
export class FlowEngine {
  private static instance: FlowEngine;

  private constructor() {}

  public static getInstance(): FlowEngine {
    if (!FlowEngine.instance) {
      FlowEngine.instance = new FlowEngine();
    }
    return FlowEngine.instance;
  }

  /**
   * Execute a flow based on the current context
   * @returns true if a flow was triggered and executed, false otherwise
   */
  async executeFlow(flow: FlowData, context: any): Promise<boolean> {
    try {
      // 1. Find matching triggers
      const triggers = flow.nodes.filter(n => n.type === 'trigger');
      const matchingTrigger = triggers.find(t => this.isTriggerMatch(t, context));

      if (!matchingTrigger) {
        return false;
      }

      logger.info(`Flow '${flow.name}' (${flow.id}) triggered for user ${context.sender?.jid}`);

      // 2. Follow the path from the trigger
      await this.executeNodePath(matchingTrigger.id, flow, context);

      return true;
    } catch (error: any) {
      logger.error(`FlowEngine.executeFlow error [Flow: ${flow.id}]:`, error);
      return false;
    }
  }

  private isTriggerMatch(node: any, context: any): boolean {
    const { data } = node;
    const messageText = (context.body || '').toLowerCase().trim();

    // Keyword match (case-insensitive)
    if (data.keyword) {
      const keyword = data.keyword.toLowerCase().trim();
      return messageText === keyword;
    }

    // Default to false if no criteria met (or true if 'Match ANY' logic implemented)
    return false;
  }

  private async executeNodePath(currentNodeId: string, flow: FlowData, context: any) {
    const currentNode = flow.nodes.find(n => n.id === currentNodeId);
    let outboundEdges = flow.edges.filter(e => e.source === currentNodeId);

    // If current node is logic, filter edges based on condition result
    if (currentNode?.type === 'logic') {
      const result = await this.evaluateCondition(currentNode, context);
      const targetLabel = result ? 'true' : 'false';
      outboundEdges = outboundEdges.filter(e => e.label === targetLabel);
    }

    // If current node is AI Router, filter edges based on semantic routing
    if (currentNode?.type === 'ai_router') {
      const targetLabel = await this.evaluateAIRouting(currentNode, context);
      if (targetLabel) {
        outboundEdges = outboundEdges.filter(e => e.label === targetLabel);
      } else {
        outboundEdges = []; // No match
      }
    }

    for (const edge of outboundEdges) {
      const nextNode = flow.nodes.find(n => n.id === edge.target);
      if (!nextNode) continue;

      await this.executeNode(nextNode, flow, context);
    }
  }

  private async executeNode(node: any, flow: FlowData, context: any) {
    logger.debug(`Executing node ${node.id} [Type: ${node.type}]`);

    switch (node.type) {
      case 'action':
        await this.executeActionNode(node, context);
        break;
      
      case 'logic':
        // logic nodes logic handled in executeNodePath for branching
        break;

      case 'ai':
        await this.executeAINode(node, context);
        break;

      case 'ai_router':
        // logic handled in executeNodePath
        break;
    }

    // Continue to next nodes in path (if not a logic node, which is handled above)
    if (node.type !== 'logic') {
      await this.executeNodePath(node.id, flow, context);
    } else {
      // For logic nodes, we already called executeNodePath inside the logic-specific block of executeNodePath's parent call?
      // Wait, the recursion logic needs to be clean.
      // If we are IN executeNodePath, we loop edges and call executeNode.
      // executeNode then calls executeNodePath for children.
      // So if it's a logic node, executeNode should still call executeNodePath, 
      // but executeNodePath needs to know it's coming from a logic node.
      
      // Let's re-read:
      // Trigger -> executeNodePath(triggerId) -> loop edges -> executeNode(actionNode) -> executeNodePath(actionNodeId) -> ...
      
      // If executeNodePath(logicNodeId) is called:
      // it evaluates condition, filters edges, then calls executeNode(nextNode).
      // This is correct.
      
      // But wait, executeNode currently calls executeNodePath at the end.
      // If node is 'logic', executeNode should NOT call executeNodePath again if it's already being handled.
      // Actually, my proposed change handles it by skipping the call at the end of executeNode for logic nodes.
      await this.executeNodePath(node.id, flow, context);
    }
  }

  private async evaluateCondition(node: any, context: any): Promise<boolean> {
    const { data } = node;
    
    if (data.condition === 'is_premium') {
      const planTier = context.tenant?.planTier || 'starter';
      return planTier === 'pro' || planTier === 'enterprise';
    }

    return false;
  }

  private async evaluateAIRouting(node: any, context: any): Promise<string | null> {
    const { data } = node;
    const { unifiedAI } = context;
    const userInput = context.body || '';

    if (!unifiedAI || !data.options) {
      return null;
    }

    try {
      const optionsStr = data.options.map((o: any) => `- ${o.label}: ${o.description}`).join('\n');
      const prompt = `
Analyze the following user input and decide which category it belongs to.
Options:
${optionsStr}

User Input: "${userInput}"

Return ONLY the label of the best matching category (e.g., "${data.options[0]?.label}"). If no category matches well, return "none".
`;

      const response = await unifiedAI.gemini.getChatCompletion(prompt);
      const cleanedResponse = response.trim().toLowerCase();

      // Find exact match in options
      const match = data.options.find((o: any) => o.label.toLowerCase() === cleanedResponse);
      return match ? match.label : null;

    } catch (error: any) {
      logger.error('FlowEngine.evaluateAIRouting error:', error);
      return null;
    }
  }

  private async executeActionNode(node: any, context: any) {
    const { data } = node;
    if (data.message) {
      await context.reply(data.message);
    }
  }

  private async executeAINode(node: any, context: any) {
    const { data } = node;
    const { unifiedAI, bot, tenantId } = context;

    if (!unifiedAI) {
      logger.warn('FlowEngine: unifiedAI not found in context, skipping AI node');
      return;
    }

    try {
      // Forward to Gemini AI
      const commonMsg = {
        id: context.id,
        platform: context.platform || 'whatsapp',
        from: context.sender?.jid,
        to: bot?.botId,
        content: { text: context.body || '' },
        timestamp: Date.now()
      };

      const result = await unifiedAI.processOmnichannelMessage(
        tenantId || bot?.tenantId,
        bot?.botId,
        commonMsg
      );

      if (result.success && result.data?.content?.text) {
        await context.reply(result.data.content.text);
      }
    } catch (error: any) {
      logger.error('FlowEngine.executeAINode error:', error);
    }
  }
}

export const flowEngine = FlowEngine.getInstance();
export default flowEngine;
