/**
 * Data Export Service
 * Export data to CSV, Excel, PDF formats
 * Based on Innovation Library best practices
 */

import { Parser } from 'json2csv';
import logger from '../utils/logger.js';

/**
 * Export format types
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  // Excel and PDF require additional dependencies
  // EXCEL = 'excel',
  // PDF = 'pdf',
}

/**
 * Export configuration
 */
interface ExportConfig {
  format: ExportFormat;
  fields?: string[];        // Fields to export
  filename?: string;        // Output filename
  delimiter?: string;       // CSV delimiter
  includeHeaders?: boolean; // Include headers in CSV
}

/**
 * Export statistics
 */
interface ExportStats {
  total: number;
  successful: number;
  failed: number;
  byFormat: Map<ExportFormat, { count: number; size: number }>;
  totalSize: number;
}

const stats: ExportStats = {
  total: 0,
  successful: 0,
  failed: 0,
  byFormat: new Map(),
  totalSize: 0,
};

/**
 * Update statistics
 */
const updateStats = (format: ExportFormat, size: number, success: boolean): void => {
  stats.total++;

  if (success) {
    stats.successful++;
    stats.totalSize += size;

    const formatStats = stats.byFormat.get(format) || { count: 0, size: 0 };
    formatStats.count++;
    formatStats.size += size;
    stats.byFormat.set(format, formatStats);
  } else {
    stats.failed++;
  }
};

/**
 * Export data to CSV
 */
export const exportToCSV = (
  data: any[],
  config: Partial<ExportConfig> = {}
): { content: string; filename: string } => {
  try {
    const fields = config.fields || (data.length > 0 ? Object.keys(data[0]) : []);

    const parser = new Parser({
      fields,
      delimiter: config.delimiter || ',',
      header: config.includeHeaders !== false,
    });

    const csv = parser.parse(data);
    const filename = config.filename || `export_${Date.now()}.csv`;

    updateStats(ExportFormat.CSV, csv.length, true);

    logger.info(`Exported ${data.length} rows to CSV`);

    return { content: csv, filename };
  } catch (error: any) {
    logger.error('CSV export error:', error);
    updateStats(ExportFormat.CSV, 0, false);
    throw new Error(`CSV export failed: ${error.message}`);
  }
};

/**
 * Export data to JSON
 */
export const exportToJSON = (
  data: any[],
  config: Partial<ExportConfig> = {}
): { content: string; filename: string } => {
  try {
    const json = JSON.stringify(data, null, 2);
    const filename = config.filename || `export_${Date.now()}.json`;

    updateStats(ExportFormat.JSON, json.length, true);

    logger.info(`Exported ${data.length} records to JSON`);

    return { content: json, filename };
  } catch (error: any) {
    logger.error('JSON export error:', error);
    updateStats(ExportFormat.JSON, 0, false);
    throw new Error(`JSON export failed: ${error.message}`);
  }
};

/**
 * Main export function
 */
export const exportData = (
  data: any[],
  format: ExportFormat,
  config: Partial<ExportConfig> = {}
): { content: string; filename: string; mimeType: string } => {
  let result: { content: string; filename: string };
  let mimeType: string;

  switch (format) {
    case ExportFormat.CSV:
      result = exportToCSV(data, config);
      mimeType = 'text/csv';
      break;

    case ExportFormat.JSON:
      result = exportToJSON(data, config);
      mimeType = 'application/json';
      break;

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  return { ...result, mimeType };
};

/**
 * Export bookings data
 */
export const exportBookings = async (
  bookings: any[],
  format: ExportFormat = ExportFormat.CSV
): Promise<{ content: string; filename: string; mimeType: string }> => {
  const data = bookings.map(booking => ({
    id: booking.id,
    userId: booking.userId,
    type: booking.type,
    status: booking.status,
    totalPrice: booking.totalPrice,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  }));

  return exportData(data, format, {
    filename: `bookings_${Date.now()}.${format}`,
    fields: ['id', 'userId', 'type', 'status', 'totalPrice', 'createdAt', 'updatedAt'],
  });
};

/**
 * Export users data
 */
export const exportUsers = async (
  users: any[],
  format: ExportFormat = ExportFormat.CSV
): Promise<{ content: string; filename: string; mimeType: string }> => {
  const data = users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  }));

  return exportData(data, format, {
    filename: `users_${Date.now()}.${format}`,
    fields: ['id', 'email', 'name', 'role', 'createdAt'],
  });
};

/**
 * Export analytics data
 */
export const exportAnalytics = async (
  analytics: any[],
  format: ExportFormat = ExportFormat.CSV
): Promise<{ content: string; filename: string; mimeType: string }> => {
  return exportData(analytics, format, {
    filename: `analytics_${Date.now()}.${format}`,
  });
};

/**
 * Export commissions data
 */
export const exportCommissions = async (
  commissions: any[],
  format: ExportFormat = ExportFormat.CSV
): Promise<{ content: string; filename: string; mimeType: string }> => {
  const data = commissions.map(commission => ({
    id: commission.id,
    affiliateId: commission.affiliateId,
    bookingId: commission.bookingId,
    amount: commission.amount,
    rate: commission.rate,
    status: commission.status,
    createdAt: commission.createdAt,
  }));

  return exportData(data, format, {
    filename: `commissions_${Date.now()}.${format}`,
    fields: ['id', 'affiliateId', 'bookingId', 'amount', 'rate', 'status', 'createdAt'],
  });
};

/**
 * Get export statistics
 */
export const getDataExportStats = () => {
  const byFormat: Record<string, { count: number; size: number; avgSize: number }> = {};

  for (const [format, formatStats] of stats.byFormat.entries()) {
    byFormat[format] = {
      ...formatStats,
      avgSize: formatStats.count > 0 ? Math.round(formatStats.size / formatStats.count) : 0,
    };
  }

  return {
    total: stats.total,
    successful: stats.successful,
    failed: stats.failed,
    successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0,
    totalSize: stats.totalSize,
    byFormat,
  };
};

/**
 * Reset export statistics
 */
export const resetDataExportStats = (): void => {
  stats.total = 0;
  stats.successful = 0;
  stats.failed = 0;
  stats.totalSize = 0;
  stats.byFormat.clear();
};

export default {
  exportData,
  exportBookings,
  exportUsers,
  exportAnalytics,
  exportCommissions,
  ExportFormat,
};
