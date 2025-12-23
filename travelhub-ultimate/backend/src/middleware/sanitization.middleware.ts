/**
 * Request Body Sanitization Middleware
 * Protects against XSS, SQL injection, and other input attacks
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Sanitization statistics
 */
interface SanitizationStats {
  total: number;
  sanitized: number;
  dangerous: number;
  byType: Map<string, number>;
}

const stats: SanitizationStats = {
  total: 0,
  sanitized: 0,
  dangerous: 0,
  byType: new Map(),
};

/**
 * Dangerous patterns to detect and sanitize
 */
const DANGEROUS_PATTERNS = {
  // XSS patterns
  scriptTag: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  onEventHandlers: /on\w+\s*=\s*["'].*?["']/gi,
  javascriptProtocol: /javascript:/gi,

  // SQL injection patterns
  sqlKeywords: /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b).*(\bFROM\b|\bWHERE\b|\bTABLE\b)/gi,
  sqlComments: /(--|\/\*|\*\/|;)/g,

  // NoSQL injection patterns
  mongoOperators: /\$where|\$ne|\$gt|\$gte|\$lt|\$lte|\$in|\$nin|\$regex/gi,

  // Path traversal
  pathTraversal: /\.\.[\/\\]/g,

  // Command injection
  commandInjection: /[;&|`$()]/g,
};

/**
 * HTML entities to escape
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML entities
 */
const escapeHtml = (str: string): string => {
  return str.replace(/[&<>"'\/]/g, (char) => HTML_ESCAPE_MAP[char]);
};

/**
 * Remove null bytes
 */
const removeNullBytes = (str: string): string => {
  return str.replace(/\0/g, '');
};

/**
 * Trim whitespace
 */
const trimWhitespace = (str: string): string => {
  return str.trim();
};

/**
 * Check if string contains dangerous patterns
 */
const containsDangerousPattern = (str: string): { dangerous: boolean; type?: string } => {
  for (const [type, pattern] of Object.entries(DANGEROUS_PATTERNS)) {
    if (pattern.test(str)) {
      return { dangerous: true, type };
    }
  }
  return { dangerous: false };
};

/**
 * Sanitize string value
 */
const sanitizeString = (
  value: string,
  options: SanitizationOptions = {}
): { value: string; modified: boolean; dangerous: boolean; type?: string } => {
  const original = value;
  let modified = false;
  let dangerous = false;
  let dangerousType: string | undefined;

  // Check for dangerous patterns first
  const dangerCheck = containsDangerousPattern(value);
  if (dangerCheck.dangerous) {
    dangerous = true;
    dangerousType = dangerCheck.type;
  }

  // Remove null bytes
  value = removeNullBytes(value);
  if (value !== original) modified = true;

  // Trim whitespace
  if (options.trim !== false) {
    value = trimWhitespace(value);
    if (value !== original) modified = true;
  }

  // Escape HTML if enabled
  if (options.escapeHtml) {
    const escaped = escapeHtml(value);
    if (escaped !== value) {
      value = escaped;
      modified = true;
    }
  }

  // Remove dangerous patterns if strict mode
  if (options.strict && dangerous) {
    for (const pattern of Object.values(DANGEROUS_PATTERNS)) {
      const cleaned = value.replace(pattern, '');
      if (cleaned !== value) {
        value = cleaned;
        modified = true;
      }
    }
  }

  return { value, modified, dangerous, type: dangerousType };
};

/**
 * Sanitization options
 */
interface SanitizationOptions {
  trim?: boolean;
  escapeHtml?: boolean;
  strict?: boolean;
  maxDepth?: number;
}

/**
 * Recursively sanitize object
 */
const sanitizeObject = (
  obj: any,
  options: SanitizationOptions = {},
  depth = 0
): { sanitized: any; modified: boolean; dangerous: boolean } => {
  const maxDepth = options.maxDepth || 10;
  if (depth > maxDepth) {
    return { sanitized: obj, modified: false, dangerous: false };
  }

  let modified = false;
  let dangerous = false;

  if (typeof obj === 'string') {
    const result = sanitizeString(obj, options);
    return {
      sanitized: result.value,
      modified: result.modified,
      dangerous: result.dangerous,
    };
  }

  if (Array.isArray(obj)) {
    const sanitized = obj.map((item) => {
      const result = sanitizeObject(item, options, depth + 1);
      if (result.modified) modified = true;
      if (result.dangerous) dangerous = true;
      return result.sanitized;
    });
    return { sanitized, modified, dangerous };
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const keyResult = sanitizeString(key, options);
      if (keyResult.dangerous) dangerous = true;
      if (keyResult.modified) modified = true;

      // Sanitize value
      const valueResult = sanitizeObject(value, options, depth + 1);
      if (valueResult.modified) modified = true;
      if (valueResult.dangerous) dangerous = true;

      sanitized[keyResult.value] = valueResult.sanitized;
    }
    return { sanitized, modified, dangerous };
  }

  return { sanitized: obj, modified: false, dangerous: false };
};

/**
 * Request Body Sanitization middleware
 * Sanitizes request body, query, and params
 *
 * Features:
 * - XSS protection (script tags, event handlers, javascript: protocol)
 * - SQL injection protection (union, select, comments)
 * - NoSQL injection protection ($where, $ne, etc.)
 * - Path traversal protection (../)
 * - Command injection protection (;, |, `, $, etc.)
 * - Null byte removal
 * - HTML entity escaping (optional)
 * - Deep object sanitization
 * - Statistics tracking
 * - Dangerous pattern detection and logging
 *
 * Options:
 * - trim: Trim whitespace (default: true)
 * - escapeHtml: Escape HTML entities (default: false)
 * - strict: Remove dangerous patterns (default: true)
 * - maxDepth: Maximum object depth (default: 10)
 */
export const sanitizationMiddleware = (options: SanitizationOptions = {}) => {
  const defaultOptions: SanitizationOptions = {
    trim: true,
    escapeHtml: false,
    strict: true,
    maxDepth: 10,
    ...options,
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    stats.total++;

    let totalModified = false;
    let totalDangerous = false;

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      const result = sanitizeObject(req.body, defaultOptions);
      req.body = result.sanitized;
      if (result.modified) totalModified = true;
      if (result.dangerous) totalDangerous = true;
    }

    // Sanitize query params
    if (req.query && typeof req.query === 'object') {
      const result = sanitizeObject(req.query, defaultOptions);
      req.query = result.sanitized;
      if (result.modified) totalModified = true;
      if (result.dangerous) totalDangerous = true;
    }

    // Sanitize URL params
    if (req.params && typeof req.params === 'object') {
      const result = sanitizeObject(req.params, defaultOptions);
      req.params = result.sanitized;
      if (result.modified) totalModified = true;
      if (result.dangerous) totalDangerous = true;
    }

    // Update statistics
    if (totalModified) {
      stats.sanitized++;
    }

    if (totalDangerous) {
      stats.dangerous++;

      // Log dangerous requests
      logger.warn('Dangerous input pattern detected', {
        url: req.url,
        method: req.method,
        requestId: req.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    next();
  };
};

/**
 * Get sanitization statistics
 */
export const getSanitizationStats = () => {
  return {
    total: stats.total,
    sanitized: stats.sanitized,
    dangerous: stats.dangerous,
    sanitizationRate: stats.total > 0
      ? Math.round((stats.sanitized / stats.total) * 100)
      : 0,
    dangerousRate: stats.total > 0
      ? Math.round((stats.dangerous / stats.total) * 100)
      : 0,
  };
};

/**
 * Reset sanitization statistics
 */
export const resetSanitizationStats = (): void => {
  stats.total = 0;
  stats.sanitized = 0;
  stats.dangerous = 0;
  stats.byType.clear();
};

export default sanitizationMiddleware;
