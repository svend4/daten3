/**
 * Request Batching Middleware
 * Efficient bulk operations support
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Batch operation types
 */
export enum BatchOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  GET = 'get',
}

/**
 * Batch request
 */
interface BatchRequest {
  operation: BatchOperation;
  resource: string;
  data?: any;
  id?: string;
}

/**
 * Batch response
 */
interface BatchResponse {
  success: boolean;
  operation: BatchOperation;
  resource: string;
  data?: any;
  error?: string;
  statusCode: number;
}

/**
 * Batch configuration
 */
interface BatchConfig {
  maxBatchSize: number;
  timeout: number;
  allowedOperations?: BatchOperation[];
  allowedResources?: string[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: BatchConfig = {
  maxBatchSize: 100,
  timeout: 30000, // 30 seconds
  allowedOperations: Object.values(BatchOperation),
  allowedResources: [],
};

/**
 * Batch statistics
 */
interface BatchStats {
  total: number;
  successful: number;
  failed: number;
  byOperation: Map<BatchOperation, { total: number; successful: number; failed: number }>;
  byResource: Map<string, { total: number; successful: number; failed: number }>;
  averageBatchSize: number;
  totalBatchSize: number;
}

const stats: BatchStats = {
  total: 0,
  successful: 0,
  failed: 0,
  byOperation: new Map(),
  byResource: new Map(),
  averageBatchSize: 0,
  totalBatchSize: 0,
};

/**
 * Update statistics
 */
const updateStats = (
  operation: BatchOperation,
  resource: string,
  success: boolean,
  batchSize: number
): void => {
  stats.total++;
  stats.totalBatchSize += batchSize;
  stats.averageBatchSize = Math.round(stats.totalBatchSize / stats.total);

  if (success) {
    stats.successful++;
  } else {
    stats.failed++;
  }

  // Operation stats
  const opStats = stats.byOperation.get(operation) || { total: 0, successful: 0, failed: 0 };
  opStats.total++;
  if (success) opStats.successful++;
  else opStats.failed++;
  stats.byOperation.set(operation, opStats);

  // Resource stats
  const resStats = stats.byResource.get(resource) || { total: 0, successful: 0, failed: 0 };
  resStats.total++;
  if (success) resStats.successful++;
  else resStats.failed++;
  stats.byResource.set(resource, resStats);
};

/**
 * Validate batch request
 */
const validateBatchRequest = (
  requests: BatchRequest[],
  config: BatchConfig
): { valid: boolean; error?: string } => {
  // Check batch size
  if (requests.length === 0) {
    return { valid: false, error: 'Batch cannot be empty' };
  }

  if (requests.length > config.maxBatchSize) {
    return {
      valid: false,
      error: `Batch size exceeds maximum (${config.maxBatchSize})`,
    };
  }

  // Validate each request
  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];

    // Check required fields
    if (!req.operation || !req.resource) {
      return {
        valid: false,
        error: `Request ${i}: Missing required fields (operation, resource)`,
      };
    }

    // Check allowed operations
    if (config.allowedOperations && !config.allowedOperations.includes(req.operation)) {
      return {
        valid: false,
        error: `Request ${i}: Operation "${req.operation}" not allowed`,
      };
    }

    // Check allowed resources
    if (config.allowedResources && config.allowedResources.length > 0) {
      if (!config.allowedResources.includes(req.resource)) {
        return {
          valid: false,
          error: `Request ${i}: Resource "${req.resource}" not allowed`,
        };
      }
    }

    // Validate operation-specific requirements
    if (req.operation === BatchOperation.UPDATE || req.operation === BatchOperation.DELETE) {
      if (!req.id) {
        return {
          valid: false,
          error: `Request ${i}: ${req.operation} operation requires 'id' field`,
        };
      }
    }

    if (req.operation === BatchOperation.CREATE || req.operation === BatchOperation.UPDATE) {
      if (!req.data) {
        return {
          valid: false,
          error: `Request ${i}: ${req.operation} operation requires 'data' field`,
        };
      }
    }
  }

  return { valid: true };
};

/**
 * Process single batch request
 * This is a placeholder - actual implementation should call appropriate handlers
 */
const processBatchRequest = async (
  request: BatchRequest,
  handlers: Record<string, any>
): Promise<BatchResponse> => {
  try {
    const handler = handlers[request.resource];
    if (!handler) {
      return {
        success: false,
        operation: request.operation,
        resource: request.resource,
        error: `No handler found for resource: ${request.resource}`,
        statusCode: 404,
      };
    }

    // Call appropriate method based on operation
    let result: any;
    switch (request.operation) {
      case BatchOperation.CREATE:
        result = await handler.create(request.data);
        break;
      case BatchOperation.UPDATE:
        result = await handler.update(request.id, request.data);
        break;
      case BatchOperation.DELETE:
        result = await handler.delete(request.id);
        break;
      case BatchOperation.GET:
        result = await handler.get(request.id);
        break;
      default:
        throw new Error(`Unsupported operation: ${request.operation}`);
    }

    return {
      success: true,
      operation: request.operation,
      resource: request.resource,
      data: result,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: false,
      operation: request.operation,
      resource: request.resource,
      error: error.message || 'Internal server error',
      statusCode: error.statusCode || 500,
    };
  }
};

/**
 * Batch request middleware
 *
 * Features:
 * - Process multiple operations in single request
 * - Support for CREATE, UPDATE, DELETE, GET operations
 * - Configurable batch size limits
 * - Timeout protection
 * - Parallel execution with error handling
 * - Detailed response for each operation
 * - Statistics tracking
 *
 * Usage:
 * POST /api/batch
 * {
 *   "requests": [
 *     { "operation": "create", "resource": "users", "data": {...} },
 *     { "operation": "update", "resource": "users", "id": "123", "data": {...} },
 *     { "operation": "delete", "resource": "posts", "id": "456" }
 *   ]
 * }
 */
export const batchRequestMiddleware = (
  handlers: Record<string, any>,
  customConfig?: Partial<BatchConfig>
) => {
  const config: BatchConfig = {
    ...DEFAULT_CONFIG,
    ...customConfig,
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { requests } = req.body;

    if (!Array.isArray(requests)) {
      return res.status(400).json({
        error: 'Invalid batch request',
        message: 'Body must contain "requests" array',
        code: 'INVALID_BATCH_REQUEST',
      });
    }

    // Validate batch request
    const validation = validateBatchRequest(requests, config);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid batch request',
        message: validation.error,
        code: 'INVALID_BATCH_REQUEST',
      });
    }

    logger.info(`Processing batch request with ${requests.length} operations`);

    try {
      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Batch request timeout')), config.timeout);
      });

      // Process requests in parallel
      const resultsPromise = Promise.all(
        requests.map(request => processBatchRequest(request, handlers))
      );

      // Race between results and timeout
      const results = await Promise.race([resultsPromise, timeoutPromise]) as BatchResponse[];

      // Update statistics
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const request = requests[i];
        updateStats(request.operation, request.resource, result.success, requests.length);
      }

      // Calculate summary
      const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      };

      // Send response
      res.status(207).json({ // 207 Multi-Status
        success: true,
        summary,
        results,
      });

      logger.info(`Batch request completed: ${summary.successful}/${summary.total} successful`);
    } catch (error: any) {
      logger.error('Batch request error:', error);

      if (error.message === 'Batch request timeout') {
        return res.status(408).json({
          error: 'Request timeout',
          message: `Batch request exceeded timeout (${config.timeout}ms)`,
          code: 'BATCH_TIMEOUT',
        });
      }

      res.status(500).json({
        error: 'Batch request failed',
        message: error.message || 'Internal server error',
        code: 'BATCH_ERROR',
      });
    }
  };
};

/**
 * Create batch handler for resource
 */
export const createBatchHandler = (resource: {
  create?: (data: any) => Promise<any>;
  update?: (id: string, data: any) => Promise<any>;
  delete?: (id: string) => Promise<any>;
  get?: (id: string) => Promise<any>;
}) => {
  return {
    create: resource.create || (() => Promise.reject(new Error('Create not implemented'))),
    update: resource.update || (() => Promise.reject(new Error('Update not implemented'))),
    delete: resource.delete || (() => Promise.reject(new Error('Delete not implemented'))),
    get: resource.get || (() => Promise.reject(new Error('Get not implemented'))),
  };
};

/**
 * Get batch statistics
 */
export const getBatchStats = () => {
  const byOperation: Record<string, { total: number; successful: number; failed: number; successRate: number }> = {};
  for (const [operation, opStats] of stats.byOperation.entries()) {
    byOperation[operation] = {
      ...opStats,
      successRate: opStats.total > 0 ? Math.round((opStats.successful / opStats.total) * 100) : 0,
    };
  }

  const byResource: Record<string, { total: number; successful: number; failed: number }> = {};
  for (const [resource, resStats] of stats.byResource.entries()) {
    byResource[resource] = resStats;
  }

  return {
    total: stats.total,
    successful: stats.successful,
    failed: stats.failed,
    successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0,
    averageBatchSize: stats.averageBatchSize,
    byOperation,
    byResource,
  };
};

/**
 * Reset batch statistics
 */
export const resetBatchStats = (): void => {
  stats.total = 0;
  stats.successful = 0;
  stats.failed = 0;
  stats.byOperation.clear();
  stats.byResource.clear();
  stats.averageBatchSize = 0;
  stats.totalBatchSize = 0;
};

export default batchRequestMiddleware;
