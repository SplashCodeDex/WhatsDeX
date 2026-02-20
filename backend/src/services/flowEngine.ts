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
    // Find outbound edges from current node
    const outboundEdges = flow.edges.filter(e => e.source === currentNodeId);

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
        // logic nodes would handle branching, but for MVP we just follow the path
        break;

      case 'ai':
        // placeholder for Phase 3
        break;
    }

    // Continue to next nodes in path
    await this.executeNodePath(node.id, flow, context);
  }

  private async executeActionNode(node: any, context: any) {
    const { data } = node;
    if (data.message) {
      await context.reply(data.message);
    }
  }
}

export const flowEngine = FlowEngine.getInstance();
export default flowEngine;
