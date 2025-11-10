import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('openai');
jest.mock('@prisma/client');

import { EmbeddingService } from '../../src/services/EmbeddingService.js';
import { MemoryService } from '../../src/services/MemoryService.js';

describe('RAG Services', () => {
  describe('EmbeddingService', () => {
    let embeddingService;

    beforeEach(() => {
      embeddingService = new EmbeddingService();
      jest.clearAllMocks();
    });

    test('should generate embedding for valid text', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      embeddingService.client = {
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: mockEmbedding }]
          })
        }
      };

      const result = await embeddingService.generateEmbedding('Hello world');

      expect(result).toEqual(mockEmbedding);
      expect(embeddingService.client.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'Hello world',
        encoding_format: 'float'
      });
    });

    test('should reject invalid input', async () => {
      await expect(embeddingService.generateEmbedding('')).rejects.toThrow('Invalid input: text must be a non-empty string');
      await expect(embeddingService.generateEmbedding(null)).rejects.toThrow('Invalid input: text must be a non-empty string');
      await expect(embeddingService.generateEmbedding(123)).rejects.toThrow('Invalid input: text must be a non-empty string');
    });

    test('should preprocess text correctly', () => {
      const longText = ' '.repeat(10000) + 'test content' + ' '.repeat(10000);
      const result = embeddingService.preprocessText(longText);
      
      expect(result).toBe('test content');
      expect(result.length).toBeLessThanOrEqual(8000);
    });

    test('should retry on failure with exponential backoff', async () => {
      let attempts = 0;
      embeddingService.client = {
        embeddings: {
          create: jest.fn().mockImplementation(() => {
            attempts++;
            if (attempts < 3) {
              throw new Error('API Error');
            }
            return { data: [{ embedding: [0.1, 0.2, 0.3] }] };
          })
        }
      };

      const result = await embeddingService.generateEmbedding('test');
      
      expect(attempts).toBe(3);
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('MemoryService', () => {
    let memoryService;
    let mockPrisma;

    beforeEach(() => {
      mockPrisma = {
        $executeRaw: jest.fn(),
        $queryRaw: jest.fn()
      };
      
      memoryService = new MemoryService();
      memoryService.prisma = mockPrisma;
      
      jest.clearAllMocks();
    });

    test('should store conversation with metadata', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      
      // Mock the embedding service
      const originalGenerateEmbedding = memoryService.embeddingService?.generateEmbedding;
      if (memoryService.embeddingService) {
        memoryService.embeddingService.generateEmbedding = jest.fn().mockResolvedValue(mockEmbedding);
      }

      const userId = 'user123';
      const conversationText = 'Hello, how are you?';
      const metadata = { intent: 'greeting', confidence: 0.95 };

      await memoryService.storeConversation(userId, conversationText, metadata);

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      
      // Restore original method
      if (originalGenerateEmbedding) {
        memoryService.embeddingService.generateEmbedding = originalGenerateEmbedding;
      }
    });

    test('should retrieve relevant context with similarity search', async () => {
      const mockResults = [
        {
          id: '1',
          content: 'Previous conversation about cooking',
          timestamp: new Date(),
          metadata: { intent: 'question' },
          similarity: 0.85
        }
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      const userId = 'user123';
      const newText = 'How do I cook pasta?';
      
      const results = await memoryService.retrieveRelevantContext(userId, newText);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        content: 'Previous conversation about cooking',
        similarity: 0.85
      });
    });

    test('should handle errors gracefully', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));

      const result = await memoryService.retrieveRelevantContext('user123', 'test');
      
      expect(result).toEqual([]);
    });

    test('should respect similarity threshold', () => {
      memoryService.setSimilarityThreshold(0.8);
      expect(memoryService.similarityThreshold).toBe(0.8);

      expect(() => memoryService.setSimilarityThreshold(1.5)).toThrow('Similarity threshold must be between 0 and 1');
    });

    test('should respect max contexts limit', () => {
      memoryService.setMaxContexts(10);
      expect(memoryService.maxContexts).toBe(10);

      expect(() => memoryService.setMaxContexts(0)).toThrow('Max contexts must be greater than 0');
    });
  });

  describe('RAG Integration', () => {
    test('should work end-to-end with mocked dependencies', async () => {
      const embeddingService = new EmbeddingService();
      const memoryService = new MemoryService();

      // Mock successful embedding generation
      embeddingService.client = {
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: new Array(1536).fill(0.1) }]
          })
        }
      };

      // Mock successful database operations
      memoryService.prisma = {
        $executeRaw: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn().mockResolvedValue([])
      };

      const userId = 'testUser';
      const message = 'Hello, what can you help me with?';

      // Test the flow: store then retrieve
      await expect(memoryService.storeConversation(userId, message)).resolves.not.toThrow();
      
      const contexts = await memoryService.retrieveRelevantContext(userId, 'I need help');
      expect(Array.isArray(contexts)).toBe(true);
    });
  });
});