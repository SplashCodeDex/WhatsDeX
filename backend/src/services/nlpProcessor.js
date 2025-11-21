export default class NLPProcessorService {
  async processInput(text, context = {}) {
    // Mock implementation matching the expected output structure in nlp.js
    return {
      intent: 'unknown',
      confidence: 0,
      explanation: 'I am a simple bot and cannot fully understand natural language yet.',
      command: null,
      parameters: {},
      alternatives: []
    };
  }
}
