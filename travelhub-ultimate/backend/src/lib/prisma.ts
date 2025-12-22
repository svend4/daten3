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
  prisma.$on('query' as any, queryEventHandler as any);
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
