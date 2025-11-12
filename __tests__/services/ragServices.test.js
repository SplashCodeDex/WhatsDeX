import embeddingService, { EmbeddingService } from '../../src/services/EmbeddingService.js'; // Import the singleton instance
import { MemoryService } from '../../src/services/MemoryService.js';

describe('RAG Services', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockContext = {
    logger: mockLogger,
  };

  describe('EmbeddingService', () => {
    let embeddingServiceInstance;

    beforeEach(() => {
      embeddingServiceInstance = new EmbeddingService(mockContext);
      jest.clearAllMocks();
    });

    test('should generate embedding for valid text', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      embeddingServiceInstance.client = {
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: mockEmbedding }]
          })
        }
      };

      const result = await embeddingServiceInstance.generateEmbedding('Hello world');

      expect(result).toEqual(mockEmbedding);
      expect(embeddingServiceInstance.client.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'Hello world',
        encoding_format: 'float'
      });
    });

    test('should reject invalid input', async () => {
      await expect(embeddingServiceInstance.generateEmbedding('')).rejects.toThrow('Invalid input: text must be a non-empty string');
      await expect(embeddingServiceInstance.generateEmbedding(null)).rejects.toThrow('Invalid input: text must be a non-empty string');
      await expect(embeddingServiceInstance.generateEmbedding(123)).rejects.toThrow('Invalid input: text must be a non-empty string');
    });

    test('should preprocess text correctly', () => {
      const longText = ' '.repeat(10000) + 'test content' + ' '.repeat(10000);
      const result = embeddingServiceInstance.preprocessText(longText);
      
      expect(result).toBe('test content');
      expect(result.length).toBeLessThanOrEqual(8000);
    });

    test('should retry on failure with exponential backoff', async () => {
      let attempts = 0;
      embeddingServiceInstance.client = {
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

      const result = await embeddingServiceInstance.generateEmbedding('test');
      
      expect(attempts).toBe(3);
      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });
  });

  describe('MemoryService', () => {
    let memoryServiceInstance;
    let mockPrisma;

    beforeEach(() => {
      mockPrisma = {
        $executeRaw: jest.fn(),
        $queryRaw: jest.fn()
      };
      
      memoryServiceInstance = new MemoryService(mockContext);
      memoryServiceInstance.prisma = mockPrisma;
      
      jest.clearAllMocks();
    });

    test('should store conversation with metadata', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      
      // Mock the embedding service's generateEmbedding method
      jest.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue(mockEmbedding);

      const userId = 'user123';
      const conversationText = 'Hello, how are you?';
      const metadata = { intent: 'greeting', confidence: 0.95 };

      await memoryServiceInstance.storeConversation(userId, conversationText, metadata);

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(`Stored conversation embedding for user ${userId}`);
    });

    test('should retrieve relevant context with similarity search', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      jest.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue(mockEmbedding);

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
      
      const results = await memoryServiceInstance.retrieveRelevantContext(userId, newText);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        content: 'Previous conversation about cooking',
        similarity: 0.85
      });
    });

    test('should handle errors gracefully', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));
      jest.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue(new Array(1536).fill(0.1));

      const result = await memoryServiceInstance.retrieveRelevantContext('user123', 'test');
      
      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith('Error retrieving context:', expect.any(Error));
    });

    test('should respect similarity threshold', () => {
      memoryServiceInstance.setSimilarityThreshold(0.8);
      expect(memoryServiceInstance.similarityThreshold).toBe(0.8);
      expect(mockLogger.info).toHaveBeenCalledWith('Updated similarity threshold to 0.8');

      expect(() => memoryServiceInstance.setSimilarityThreshold(1.5)).toThrow('Similarity threshold must be between 0 and 1');
    });

    test('should respect max contexts limit', () => {
      memoryServiceInstance.setMaxContexts(10);
      expect(memoryServiceInstance.maxContexts).toBe(10);
      expect(mockLogger.info).toHaveBeenCalledWith('Updated max contexts to 10');

      expect(() => memoryServiceInstance.setMaxContexts(0)).toThrow('Max contexts must be greater than 0');
    });
  });

  describe('RAG Integration', () => {
    test('should work end-to-end with mocked dependencies', async () => {
      const embeddingServiceInstance = new EmbeddingService(mockContext);
      const memoryServiceInstance = new MemoryService(mockContext);

      // Mock successful embedding generation
      jest.spyOn(embeddingService, 'generateEmbedding').mockResolvedValue(new Array(1536).fill(0.1));

      // Mock successful database operations
      memoryServiceInstance.prisma = {
        $executeRaw: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn().mockResolvedValue([])
      };

      const userId = 'testUser';
      const message = 'Hello, what can you help me with?';

      // Test the flow: store then retrieve
      await expect(memoryServiceInstance.storeConversation(userId, message)).resolves.not.toThrow();
      
      const contexts = await memoryServiceInstance.retrieveRelevantContext(userId, 'I need help');
      expect(Array.isArray(contexts)).toBe(true);
    });
  });
});