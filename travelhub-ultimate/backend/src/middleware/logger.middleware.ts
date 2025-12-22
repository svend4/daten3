import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

// Create a stream object with 'write' function for morgan
const stream = {
  write: (message: string) => {
    // Use the http severity level for HTTP logs
    logger.http(message.trim());
  },
};

// Skip logging during tests
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

// Custom token for user ID
morgan.token('user-id', (req: any) => {
  return req.user?.id || 'anonymous';
});

// Custom token for request body (only in development)
morgan.token('body', (req: any) => {
  if (process.env.NODE_ENV === 'development') {
    const body = { ...req.body };
    // Hide sensitive fields
    if (body.password) body.password = '***';
    if (body.token) body.token = '***';
    if (body.apiKey) body.apiKey = '***';
    return JSON.stringify(body);
  }
  return '';
});

// Production format - concise
const productionFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Development format - detailed
const developmentFormat = ':method :url :status :res[content-length] - :response-time ms - User: :user-id :body';

// Build the morgan middleware
const morganMiddleware = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  { stream, skip }
);

/**
 * Additional request logging middleware
 * Logs slow requests and errors
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userInfo = (req as any).user?.id || 'anonymous';

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        userId: userInfo,
        ip: req.ip
      });
    }

    // Log failed requests (4xx, 5xx)
    if (res.statusCode >= 400) {
      logger.warn('Request failed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userId: userInfo,
        ip: req.ip
      });
    }
  });

  next();
};

export default morganMiddleware;
