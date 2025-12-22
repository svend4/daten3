/**
 * File Upload Middleware
 * Secure file upload with validation and optimization
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import logger from '../utils/logger.js';

/**
 * Allowed file types
 */
export const FileType = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ANY: ['*'],
} as const;

/**
 * File upload configuration
 */
interface FileUploadConfig {
  maxFileSize: number;          // Max file size in bytes
  maxFiles: number;             // Max number of files
  allowedTypes: readonly string[];  // Allowed MIME types
  destination: string;          // Upload destination
  filename?: (req: Request, file: Express.Multer.File) => string;
  validateFile?: (file: Express.Multer.File) => boolean;
  onUploadComplete?: (req: Request, files: Express.Multer.File[]) => Promise<void>;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedTypes: FileType.ANY,
  destination: './uploads',
};

/**
 * File upload statistics
 */
interface FileUploadStats {
  total: number;
  successful: number;
  failed: number;
  totalSize: number;
  averageSize: number;
  byType: Map<string, { count: number; size: number }>;
}

const stats: FileUploadStats = {
  total: 0,
  successful: 0,
  failed: 0,
  totalSize: 0,
  averageSize: 0,
  byType: new Map(),
};

/**
 * Update statistics
 */
const updateStats = (file: Express.Multer.File, success: boolean): void => {
  stats.total++;

  if (success) {
    stats.successful++;
    stats.totalSize += file.size;
    stats.averageSize = Math.round(stats.totalSize / stats.successful);

    // By type stats
    const typeStats = stats.byType.get(file.mimetype) || { count: 0, size: 0 };
    typeStats.count++;
    typeStats.size += file.size;
    stats.byType.set(file.mimetype, typeStats);
  } else {
    stats.failed++;
  }
};

/**
 * Generate unique filename
 */
const generateFilename = (originalname: string): string => {
  const ext = path.extname(originalname);
  const randomName = randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${randomName}${ext}`;
};

/**
 * Validate file type
 */
const validateFileType = (file: Express.Multer.File, allowedTypes: readonly string[]): boolean => {
  if (allowedTypes.includes('*')) return true;

  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      // Wildcard type (e.g., image/*)
      const category = type.split('/')[0];
      return file.mimetype.startsWith(category);
    }
    return file.mimetype === type;
  });
};

/**
 * Validate file extension
 */
const validateFileExtension = (filename: string, allowedExts: string[]): boolean => {
  if (allowedExts.length === 0) return true;

  const ext = path.extname(filename).toLowerCase();
  return allowedExts.includes(ext);
};

/**
 * Check for malicious files (simplified)
 */
const checkMaliciousFile = (file: Express.Multer.File): boolean => {
  // Suspicious extensions
  const suspiciousExts = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (suspiciousExts.includes(ext)) {
    logger.warn(`Malicious file extension detected: ${ext}`);
    return true;
  }

  // Check for double extensions
  const parts = file.originalname.split('.');
  if (parts.length > 2) {
    const secondToLast = `.${parts[parts.length - 2]}`;
    if (suspiciousExts.includes(secondToLast)) {
      logger.warn(`Double extension detected: ${file.originalname}`);
      return true;
    }
  }

  return false;
};

/**
 * Create file upload middleware
 *
 * Features:
 * - File type validation
 * - File size limits
 * - Malicious file detection
 * - Unique filename generation
 * - Storage configuration
 * - Statistics tracking
 * - Custom validation
 *
 * Usage:
 * router.post('/upload',
 *   createFileUpload({
 *     maxFileSize: 5 * 1024 * 1024, // 5MB
 *     maxFiles: 3,
 *     allowedTypes: FileType.IMAGE,
 *     destination: './uploads/images',
 *   }),
 *   handler
 * );
 */
export const createFileUpload = (customConfig?: Partial<FileUploadConfig>) => {
  const config: FileUploadConfig = {
    ...DEFAULT_CONFIG,
    ...customConfig,
  };

  // Ensure upload directory exists
  fs.mkdir(config.destination, { recursive: true }).catch(err => {
    logger.error('Failed to create upload directory:', err);
  });

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.destination);
    },
    filename: (req, file, cb) => {
      const filename = config.filename
        ? config.filename(req, file)
        : generateFilename(file.originalname);
      cb(null, filename);
    },
  });

  // Configure multer
  const upload = multer({
    storage,
    limits: {
      fileSize: config.maxFileSize,
      files: config.maxFiles,
    },
    fileFilter: (req, file, cb) => {
      // Validate file type
      if (!validateFileType(file, config.allowedTypes)) {
        updateStats(file, false);
        return cb(new Error(`File type not allowed: ${file.mimetype}`));
      }

      // Check for malicious files
      if (checkMaliciousFile(file)) {
        updateStats(file, false);
        return cb(new Error('Potentially malicious file detected'));
      }

      // Custom validation
      if (config.validateFile && !config.validateFile(file)) {
        updateStats(file, false);
        return cb(new Error('File validation failed'));
      }

      cb(null, true);
    },
  });

  // Return middleware with error handling
  return (req: Request, res: Response, next: NextFunction): void => {
    const uploadHandler = upload.array('files', config.maxFiles);

    uploadHandler(req, res, async (err: any) => {
      if (err) {
        logger.error('File upload error:', err);

        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'File too large',
              message: `File size exceeds limit (${config.maxFileSize} bytes)`,
              code: 'FILE_TOO_LARGE',
            });
          }

          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              error: 'Too many files',
              message: `Maximum ${config.maxFiles} files allowed`,
              code: 'TOO_MANY_FILES',
            });
          }
        }

        return res.status(400).json({
          error: 'Upload failed',
          message: err.message,
          code: 'UPLOAD_FAILED',
        });
      }

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
          message: 'Please provide files to upload',
          code: 'NO_FILES',
        });
      }

      // Update statistics
      for (const file of files) {
        updateStats(file, true);
      }

      logger.info(`Uploaded ${files.length} file(s)`);

      // Call custom callback
      if (config.onUploadComplete) {
        try {
          await config.onUploadComplete(req, files);
        } catch (error: any) {
          logger.error('Upload complete callback error:', error);
        }
      }

      next();
    });
  };
};

/**
 * Single file upload
 */
export const createSingleFileUpload = (
  fieldName: string,
  customConfig?: Partial<FileUploadConfig>
) => {
  const config: FileUploadConfig = {
    ...DEFAULT_CONFIG,
    maxFiles: 1,
    ...customConfig,
  };

  // Ensure upload directory exists
  fs.mkdir(config.destination, { recursive: true }).catch(err => {
    logger.error('Failed to create upload directory:', err);
  });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.destination);
    },
    filename: (req, file, cb) => {
      const filename = config.filename
        ? config.filename(req, file)
        : generateFilename(file.originalname);
      cb(null, filename);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: config.maxFileSize,
    },
    fileFilter: (req, file, cb) => {
      if (!validateFileType(file, config.allowedTypes)) {
        updateStats(file, false);
        return cb(new Error(`File type not allowed: ${file.mimetype}`));
      }

      if (checkMaliciousFile(file)) {
        updateStats(file, false);
        return cb(new Error('Potentially malicious file detected'));
      }

      if (config.validateFile && !config.validateFile(file)) {
        updateStats(file, false);
        return cb(new Error('File validation failed'));
      }

      cb(null, true);
    },
  });

  return (req: Request, res: Response, next: NextFunction): void => {
    const uploadHandler = upload.single(fieldName);

    uploadHandler(req, res, async (err: any) => {
      if (err) {
        logger.error('File upload error:', err);

        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'File too large',
              message: `File size exceeds limit (${config.maxFileSize} bytes)`,
              code: 'FILE_TOO_LARGE',
            });
          }
        }

        return res.status(400).json({
          error: 'Upload failed',
          message: err.message,
          code: 'UPLOAD_FAILED',
        });
      }

      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please provide a file to upload',
          code: 'NO_FILE',
        });
      }

      updateStats(file, true);
      logger.info(`Uploaded file: ${file.originalname}`);

      if (config.onUploadComplete) {
        try {
          await config.onUploadComplete(req, [file]);
        } catch (error: any) {
          logger.error('Upload complete callback error:', error);
        }
      }

      next();
    });
  };
};

/**
 * Get file upload statistics
 */
export const getFileUploadStats = () => {
  const byType: Record<string, { count: number; size: number; avgSize: number }> = {};
  for (const [type, typeStats] of stats.byType.entries()) {
    byType[type] = {
      ...typeStats,
      avgSize: typeStats.count > 0 ? Math.round(typeStats.size / typeStats.count) : 0,
    };
  }

  return {
    total: stats.total,
    successful: stats.successful,
    failed: stats.failed,
    successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0,
    totalSize: stats.totalSize,
    averageSize: stats.averageSize,
    byType,
  };
};

/**
 * Reset file upload statistics
 */
export const resetFileUploadStats = (): void => {
  stats.total = 0;
  stats.successful = 0;
  stats.failed = 0;
  stats.totalSize = 0;
  stats.averageSize = 0;
  stats.byType.clear();
};

/**
 * Delete uploaded file
 */
export const deleteUploadedFile = async (filepath: string): Promise<boolean> => {
  try {
    await fs.unlink(filepath);
    logger.info(`Deleted file: ${filepath}`);
    return true;
  } catch (error: any) {
    logger.error(`Failed to delete file ${filepath}:`, error);
    return false;
  }
};

export default { createFileUpload, createSingleFileUpload, FileType };
