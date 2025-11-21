-- AlterExtension
ALTER EXTENSION "vector" UPDATE TO "0.8.1";

-- DropIndex
DROP INDEX "conversation_embeddings_embedding_idx";

-- AlterTable
ALTER TABLE "bot_users" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';
