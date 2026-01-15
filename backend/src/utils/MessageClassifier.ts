// src/utils/MessageClassifier.js
export class MessageClassifier {
  constructor() {
    // In the future, this could be a more sophisticated model
  }

  async classify(text: string) {
    if (this.isQuestion(text)) {
      return { intent: 'question', confidence: 0.8 };
    }

    if (this.isGreeting(text)) {
      return { intent: 'greeting', confidence: 0.9 };
    }

    return { intent: 'statement', confidence: 0.6 };
  }

  isQuestion(text: string) {
    return text.endsWith('?');
  }

  isGreeting(text: string) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    const lowerText = text.toLowerCase();
    return greetings.some(greeting => lowerText.startsWith(greeting));
  }
}
