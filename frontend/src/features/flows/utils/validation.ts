import { Node } from '@xyflow/react';

export interface FlowValidationError {
  nodeId: string;
  message: string;
  field?: string;
}

export function validateFlow(nodes: Node[]): FlowValidationError[] {
  const errors: FlowValidationError[] = [];

  nodes.forEach((node) => {
    switch (node.type) {
      case 'skill':
        if (!node.data?.skillId && !node.data?.skillName) {
          errors.push({
            nodeId: node.id,
            message: 'Execute Skill node requires a skill selection.',
            field: 'skillName',
          });
        }
        break;

      case 'ai_router':
        // Check if there are any connected edges or if there are fallback intents
        // This is a placeholder for more complex logic like checking if prompts are defined
        if (!node.data?.prompt && !node.data?.intents) {
          errors.push({
            nodeId: node.id,
            message: 'AI Router requires at least one defined intent or a prompt.',
            field: 'prompt',
          });
        }
        break;

      case 'action':
        if (!node.data?.message && !node.data?.templateId) {
          errors.push({
            nodeId: node.id,
            message: 'Action node requires a message or a template.',
            field: 'message',
          });
        }
        break;

      case 'trigger':
        // Triggers might need a keyword or event type
        if (!node.data?.keyword && !node.data?.event) {
          errors.push({
            nodeId: node.id,
            message: 'Trigger node requires a keyword or event type.',
            field: 'keyword',
          });
        }
        break;
    }
  });

  return errors;
}
