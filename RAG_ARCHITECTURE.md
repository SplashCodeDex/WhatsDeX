# WhatsDeX RAG Architecture Blueprint

This document outlines the architecture of the Retrieval-Augmented Generation (RAG) system implemented in WhatsDeX to provide long-term, contextual memory for the AI chatbot.

## 1. Core Objective

To give the AI chatbot a scalable, long-term memory that persists across sessions, allowing for more personalized and context-aware conversations without keeping the entire chat history in active RAM.

## 2. Architectural Design

The system is a **Dual Memory Architecture** that combines a short-term "sliding window" memory for immediate context with a long-term RAG system for historical context.

### 2.1. Key Components

| Component | Technology/Implementation | Purpose |
| :--- | :--- | :--- |
| **Vector Database** | PostgreSQL + `pgvector` extension | To store conversation embeddings and perform efficient similarity searches. |
| **Embedding Model** | OpenAI `text-embedding-3-small` | To convert conversation text into 1536-dimension vector embeddings. Chosen for its high performance and cost-effectiveness. |
| **Short-Term Memory** | In-memory Map in `WhatsDeXBrain.js` | To hold the last 10 user/AI exchanges for immediate conversational flow. Managed with TTL and LRU eviction. |
| **Orchestration** | `WhatsDeXBrain.js` | The core AI logic that manages the interplay between short-term and long-term memory. |

### 2.2. Service Abstraction

To ensure modularity and future flexibility, the RAG logic is encapsulated in two dedicated services:

*   **`src/services/EmbeddingService.js`**
    *   **Responsibility:** Solely responsible for generating text embeddings.
    *   **Key Method:** `generateEmbedding(text)`
    *   **Implementation:** Connects to the OpenAI API, using the `text-embedding-3-small` model. Includes production-ready features like exponential backoff retry logic.

*   **`src/services/MemoryService.js`**
    *   **Responsibility:** Orchestrates the entire RAG workflow, acting as the bridge between the application and the vector database.
    *   **Key Methods:**
        *   `storeConversation(userId, text, metadata)`: Generates an embedding (via `EmbeddingService`) and saves the conversation and vector to the database. Runs asynchronously to avoid blocking.
        *   `retrieveRelevantContext(userId, text)`: Generates an embedding for a new message and queries the database to find the most semantically similar past conversations for that user.

## 3. Data Flow & Schema

### 3.1. Data Schema

The vector data is stored in the `ConversationEmbedding` table, defined in `prisma/schema.prisma`.

```prisma
model ConversationEmbedding {
  id          String   @id @default(uuid())
  userId      String
  content     String
  embedding   Unsupported("vector(1536)") // For text-embedding-3-small
  timestamp   DateTime @default(now())
  metadata    Json?

  @@index([userId])
  @@index([embedding], type: HNSW) // HNSW index for fast similarity search
}
```

### 3.2. RAG Workflow

The process is handled within `WhatsDeXBrain.js` in the `handleConversationalAI` method:

1.  **Message Received:** A new conversational message is received from a user.
2.  **Retrieve Historical Context:**
    *   The `WhatsDeXBrain` calls `memoryService.retrieveRelevantContext(userId, newMessage)`.
    *   The `MemoryService` generates an embedding for the `newMessage` and queries the `ConversationEmbedding` table using a cosine similarity search (`<=>` operator).
    *   It returns the top 5 most relevant past conversations that exceed a similarity threshold of 0.75.
3.  **Build Enhanced Prompt:**
    *   The `WhatsDeXBrain` constructs a new prompt for the AI model.
    *   This prompt includes:
        *   The retrieved historical context, annotated with relevance scores.
        *   The recent short-term memory (last 10 exchanges).
        *   The current user message.
        *   Instructions for the AI on how to use the context.
4.  **Generate AI Response:** The enhanced prompt is sent to the AI model, which generates a context-aware response.
5.  **Store New Conversation (Async):**
    *   After the response is sent to the user, the `WhatsDeXBrain` calls `memoryService.storeConversation(userId, newConversationText)` using `setImmediate`.
    *   This stores the new user/AI exchange in the vector database for future retrieval, without blocking the user-facing response.

This architecture provides a robust, scalable, and efficient solution for long-term AI memory.
