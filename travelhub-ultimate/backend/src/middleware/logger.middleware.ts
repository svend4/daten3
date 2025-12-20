import morgan from 'morgan';
import logger from '../utils/logger';

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

// Build the morgan middleware
const morganMiddleware = morgan(
  // Custom format
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

export default morganMiddleware;
