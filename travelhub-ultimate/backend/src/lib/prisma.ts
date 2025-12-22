import { PrismaClient } from '@prisma/client';
import { createQueryEventHandler } from '../middleware/dbPerformance.middleware.js';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Enable database performance monitoring
if (process.env.ENABLE_DB_PERFORMANCE_MONITORING !== 'false') {
  const queryEventHandler = createQueryEventHandler();
  // @ts-ignore - Prisma event typing limitation
  prisma.$on('query', queryEventHandler);
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
