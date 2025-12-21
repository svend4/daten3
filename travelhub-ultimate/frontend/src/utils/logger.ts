/**
 * Frontend Logger Utility
 * Provides structured logging with different log levels
 * Disables debug logs in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  prefix: string;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    const isProduction = import.meta.env.PROD;

    this.config = {
      enableDebug: !isProduction,
      enableInfo: true,
      prefix: '[TravelHub]',
    };
  }

  /**
   * Debug logs - only in development
   */
  debug(message: string, ...args: any[]): void {
    if (this.config.enableDebug) {
      console.log(`${this.config.prefix} 🐛`, message, ...args);
    }
  }

  /**
   * Info logs - important information
   */
  info(message: string, ...args: any[]): void {
    if (this.config.enableInfo) {
      console.info(`${this.config.prefix} ℹ️`, message, ...args);
    }
  }

  /**
   * Warning logs - potential issues
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`${this.config.prefix} ⚠️`, message, ...args);
  }

  /**
   * Error logs - errors and exceptions
   */
  error(message: string, error?: Error | any, ...args: any[]): void {
    if (error instanceof Error) {
      console.error(`${this.config.prefix} ❌`, message, error.message, error.stack, ...args);
    } else {
      console.error(`${this.config.prefix} ❌`, message, error, ...args);
    }
  }

  /**
   * Success logs - successful operations
   */
  success(message: string, ...args: any[]): void {
    console.log(`${this.config.prefix} ✅`, message, ...args);
  }

  /**
   * API request logging
   */
  apiRequest(method: string, url: string, data?: any): void {
    if (this.config.enableDebug) {
      console.log(`${this.config.prefix} 🌐 API Request:`, method.toUpperCase(), url, data || '');
    }
  }

  /**
   * API response logging
   */
  apiResponse(method: string, url: string, status: number, data?: any): void {
    if (this.config.enableDebug) {
      const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${this.config.prefix} 🌐 API Response:`, statusEmoji, method.toUpperCase(), url, status, data || '');
    }
  }

  /**
   * Group logs together
   */
  group(label: string, callback: () => void): void {
    if (this.config.enableDebug) {
      console.group(`${this.config.prefix} ${label}`);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Measure execution time
   */
  time(label: string): void {
    if (this.config.enableDebug) {
      console.time(`${this.config.prefix} ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.config.enableDebug) {
      console.timeEnd(`${this.config.prefix} ${label}`);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
