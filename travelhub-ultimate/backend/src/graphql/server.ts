/**
 * GraphQL Server Configuration
 * Apollo Server setup and integration with Express
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import type { ApolloServerPlugin } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { GraphQLError } from 'graphql';
import { typeDefs } from './schema.js';
import { resolvers, GraphQLContext } from './resolvers.js';
import logger from '../utils/logger.js';
import { Request, Response } from 'express';

/**
 * GraphQL statistics
 */
interface GraphQLStats {
  enabled: boolean;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  queriesExecuted: number;
  mutationsExecuted: number;
  averageResponseTime: number;
  totalResponseTime: number;
  errorsByType: Map<string, number>;
  popularQueries: Map<string, number>;
  recentErrors: Array<{
    timestamp: string;
    operation: string;
    error: string;
    code: string;
  }>;
}

const stats: GraphQLStats = {
  enabled: true,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  queriesExecuted: 0,
  mutationsExecuted: 0,
  averageResponseTime: 0,
  totalResponseTime: 0,
  errorsByType: new Map(),
  popularQueries: new Map(),
  recentErrors: [],
};

/**
 * Custom Apollo Server plugin for statistics
 */
const statisticsPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart(requestContext: any) {
    const startTime = Date.now();
    stats.totalRequests++;

    return {
      async didEncounterErrors(requestContext: any) {
        stats.failedRequests++;

        const errors = requestContext.errors || [];
        errors.forEach((error: GraphQLError) => {
          const code = String(error.extensions?.code || 'UNKNOWN_ERROR');
          const count = stats.errorsByType.get(code) || 0;
          stats.errorsByType.set(code, count + 1);

          // Track recent errors
          stats.recentErrors.unshift({
            timestamp: new Date().toISOString(),
            operation: requestContext.operation?.operation || 'unknown',
            error: error.message,
            code: code as string,
          });

          // Keep only last 50 errors
          if (stats.recentErrors.length > 50) {
            stats.recentErrors = stats.recentErrors.slice(0, 50);
          }
        });
      },

      async willSendResponse(requestContext: any) {
        const duration = Date.now() - startTime;

        // Update response time statistics
        stats.totalResponseTime += duration;
        stats.averageResponseTime = stats.totalResponseTime / stats.totalRequests;

        // Track operation type
        const operationType = requestContext.operation?.operation;
        if (operationType === 'query') {
          stats.queriesExecuted++;
        } else if (operationType === 'mutation') {
          stats.mutationsExecuted++;
        }

        // Track popular queries
        const operationName = requestContext.operationName || 'anonymous';
        const count = stats.popularQueries.get(operationName) || 0;
        stats.popularQueries.set(operationName, count + 1);

        // Count as successful if no errors
        if (!requestContext.errors || requestContext.errors.length === 0) {
          stats.successfulRequests++;
        }

        logger.debug('GraphQL request completed', {
          operation: operationName,
          type: operationType,
          duration: `${duration}ms`,
          success: !requestContext.errors || requestContext.errors.length === 0,
        });
      },
    };
  },
};

/**
 * Create Apollo Server instance
 */
export const createApolloServer = (httpServer: any) => {
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      statisticsPlugin,
    ],
    formatError: (formattedError, error) => {
      // Log errors
      logger.error('GraphQL Error:', {
        message: formattedError.message,
        code: formattedError.extensions?.code,
        path: formattedError.path,
      });

      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
          return {
            message: 'Internal server error',
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
            },
          };
        }
      }

      return formattedError;
    },
    introspection: process.env.NODE_ENV !== 'production', // Disable in production
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
  });

  return server;
};

/**
 * Context creation function for Apollo Server
 * Extracts authenticated user from request
 */
export const createContext = async ({ req, res }: { req: Request; res: Response }): Promise<GraphQLContext> => {
  // Get user from request (set by auth middleware)
  const user = (req as any).user;

  return {
    user,
    req,
    res,
  };
};

/**
 * Get GraphQL statistics
 */
export const getGraphQLStats = () => {
  const successRate = stats.totalRequests > 0
    ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)
    : '0.00';

  const queryRate = stats.totalRequests > 0
    ? ((stats.queriesExecuted / stats.totalRequests) * 100).toFixed(2)
    : '0.00';

  const mutationRate = stats.totalRequests > 0
    ? ((stats.mutationsExecuted / stats.totalRequests) * 100).toFixed(2)
    : '0.00';

  // Get top 10 popular queries
  const topQueries = Array.from(stats.popularQueries.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

  return {
    enabled: stats.enabled,
    totalRequests: stats.totalRequests,
    successfulRequests: stats.successfulRequests,
    failedRequests: stats.failedRequests,
    queriesExecuted: stats.queriesExecuted,
    mutationsExecuted: stats.mutationsExecuted,
    successRate: `${successRate}%`,
    queryRate: `${queryRate}%`,
    mutationRate: `${mutationRate}%`,
    averageResponseTime: Math.round(stats.averageResponseTime),
    errorsByType: Object.fromEntries(stats.errorsByType),
    topQueries,
    recentErrors: stats.recentErrors.slice(0, 10),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Reset GraphQL statistics
 */
export const resetGraphQLStats = (): void => {
  stats.totalRequests = 0;
  stats.successfulRequests = 0;
  stats.failedRequests = 0;
  stats.queriesExecuted = 0;
  stats.mutationsExecuted = 0;
  stats.averageResponseTime = 0;
  stats.totalResponseTime = 0;
  stats.errorsByType.clear();
  stats.popularQueries.clear();
  stats.recentErrors = [];
  logger.info('GraphQL statistics reset');
};

/**
 * Export statistics for health checks
 */
export { stats as graphqlStats };
