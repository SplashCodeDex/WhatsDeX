// Minimal Prisma client mock to satisfy imports in tests
// Extend as needed by specific tests.
export const prisma = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

export default prisma;
