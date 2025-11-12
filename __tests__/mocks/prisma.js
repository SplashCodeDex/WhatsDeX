import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import prisma from '../../src/lib/prisma.js';

jest.mock('../../src/lib/prisma.js', () => ({
  __esModule: true,
  default: mockDeep(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = prisma;