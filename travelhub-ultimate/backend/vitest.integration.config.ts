import { defineConfig } from 'vitest/config';
import path from 'path';

// Integration tests configuration - uses real database, no mocks
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // NO setup file - we want real Prisma/Redis connections
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Only include integration tests
    include: ['src/__tests__/integration/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
