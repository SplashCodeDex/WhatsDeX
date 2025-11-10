import { PrismaClient } from '@prisma/client';
import { jest } from '@jest/globals';
import embeddingService from '../../src/services/EmbeddingService.js';
import memoryService from '../../src/services/MemoryService.js';

// Use a real Prisma client for integration testing
const prisma = new PrismaClient();

// Mock the OpenAI API call within the EmbeddingService to avoid network calls and costs
jest.mock('../../src/services/EmbeddingService.js', () => {
  const originalModule = jest.requireActual('../../src/services/EmbeddingService.js');
  return {
    __esModule: true,
    ...originalModule,
    default: {
      ...originalModule.default,
      generateEmbedding: jest.fn(),
    },
  };
});

describe('RAG Integration Test', () => {
  const userId = 'integration-test-user';

  beforeAll(async () => {
    // Ensure the database is clean before starting the test suite
    await prisma.conversationEmbedding.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    // Clean up the test data after all tests are done
    await prisma.conversationEmbedding.deleteMany({ where: { userId } });
    await prisma.$disconnect();
  });

  test('should store a conversation and retrieve it based on semantic similarity', async () => {
    // --- Step A: Store ---
    const originalSentence = 'I enjoy baking sourdough bread on weekends.';
    const originalEmbedding = new Array(1536).fill(0).map((_, i) => i % 2 === 0 ? 0.1 : -0.1); // Consistent mock embedding
    
    embeddingService.generateEmbedding.mockResolvedValue(originalEmbedding);

    await memoryService.storeConversation(userId, originalSentence);

    // --- Step B: Verify Store ---
    const storedEmbedding = await prisma.conversationEmbedding.findFirst({
      where: {
        userId,
        content: originalSentence,
      },
    });

    expect(storedEmbedding).not.toBeNull();
    expect(storedEmbedding.userId).toBe(userId);
    // Note: Prisma returns embeddings as an array of floats, which is what we expect.

    // --- Step C: Retrieve ---
    const relatedSentence = 'What kind of flour is best for baking?';
    // For the retrieval query, we need a slightly different embedding to simulate a different question
    const relatedEmbedding = new Array(1536).fill(0).map((_, i) => i % 3 === 0 ? 0.11 : -0.09);
    embeddingService.generateEmbedding.mockResolvedValue(relatedEmbedding);

    // Temporarily set a lower threshold to ensure our mock similarity works
    memoryService.setSimilarityThreshold(0.7);
    const contexts = await memoryService.retrieveRelevantContext(userId, relatedSentence);

    // --- Step D: Verify Retrieve ---
    expect(contexts).toHaveLength(1);
    expect(contexts[0].content).toBe(originalSentence);
    // The exact similarity score depends on the pgvector calculation, 
    // but we can assert that it's a high value.
    expect(contexts[0].similarity).toBeGreaterThan(0.8); // Expect high similarity for closely related mock vectors
  });
});
