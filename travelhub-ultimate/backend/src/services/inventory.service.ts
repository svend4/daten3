/**
 * Real-time Inventory Management Service
 * Tracks availability and stock levels for hotels, flights, and other services
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();
const inventoryEvents = new EventEmitter();

export interface InventoryItem {
  id: string;
  type: 'hotel' | 'flight' | 'car_rental' | 'activity';
  itemId: string; // hotel ID, flight ID, etc.
  date: string;
  available: number;
  total: number;
  reserved: number;
  sold: number;
  lastUpdated: Date;
}

export interface ReservationRequest {
  itemId: string;
  itemType: 'hotel' | 'flight' | 'car_rental' | 'activity';
  date: string;
  quantity: number;
  userId: string;
  expiresAt?: Date; // Reservation holds
}

export interface InventoryAlert {
  itemId: string;
  itemType: string;
  date: string;
  threshold: number;
  current: number;
  alertType: 'low_stock' | 'out_of_stock' | 'high_demand';
  createdAt: Date;
}

/**
 * Get current inventory for an item
 */
export async function getInventory(
  itemId: string,
  itemType: string,
  date: string
): Promise<InventoryItem | null> {
  try {
    logger.info(`Getting inventory for ${itemType}:${itemId} on ${date}`);

    // Mock implementation - would query real-time inventory database
    const mockInventory: InventoryItem = {
      id: `inv_${itemId}_${date}`,
      type: itemType as any,
      itemId,
      date,
      available: 15,
      total: 50,
      reserved: 20,
      sold: 15,
      lastUpdated: new Date(),
    };

    return mockInventory;
  } catch (error: any) {
    logger.error('Error getting inventory:', error);
    throw error;
  }
}

/**
 * Check availability for multiple items and dates
 */
export async function checkAvailability(
  items: Array<{ itemId: string; itemType: string; date: string; quantity: number }>
): Promise<Array<{ itemId: string; date: string; available: boolean; quantity: number }>> {
  try {
    logger.info(`Checking availability for ${items.length} items`);

    const results = await Promise.all(
      items.map(async (item) => {
        const inventory = await getInventory(item.itemId, item.itemType, item.date);
        return {
          itemId: item.itemId,
          date: item.date,
          available: inventory ? inventory.available >= item.quantity : false,
          quantity: inventory?.available || 0,
        };
      })
    );

    return results;
  } catch (error: any) {
    logger.error('Error checking availability:', error);
    throw error;
  }
}

/**
 * Reserve inventory (temporary hold)
 */
export async function reserveInventory(
  request: ReservationRequest
): Promise<{ reservationId: string; expiresAt: Date }> {
  try {
    logger.info(`Reserving ${request.quantity} of ${request.itemType}:${request.itemId}`);

    // Check availability
    const inventory = await getInventory(request.itemId, request.itemType, request.date);
    if (!inventory || inventory.available < request.quantity) {
      throw new Error('Insufficient inventory');
    }

    // Create reservation (mock)
    const expiresAt = request.expiresAt || new Date(Date.now() + 15 * 60 * 1000); // 15 min default
    const reservationId = `res_${Date.now()}_${request.itemId}`;

    // In real implementation, would update inventory database:
    // - Decrease available
    // - Increase reserved
    // - Set expiration timer

    // Emit inventory change event
    inventoryEvents.emit('inventory-changed', {
      itemId: request.itemId,
      itemType: request.itemType,
      date: request.date,
      change: -request.quantity,
    });

    logger.info(`Reservation created: ${reservationId}, expires at ${expiresAt}`);

    return { reservationId, expiresAt };
  } catch (error: any) {
    logger.error('Error reserving inventory:', error);
    throw error;
  }
}

/**
 * Confirm reservation (convert to sold)
 */
export async function confirmReservation(reservationId: string): Promise<void> {
  try {
    logger.info(`Confirming reservation: ${reservationId}`);

    // In real implementation:
    // - Find reservation
    // - Decrease reserved
    // - Increase sold
    // - Clear expiration timer

    logger.info(`Reservation confirmed: ${reservationId}`);
  } catch (error: any) {
    logger.error('Error confirming reservation:', error);
    throw error;
  }
}

/**
 * Release reservation (return to available)
 */
export async function releaseReservation(reservationId: string): Promise<void> {
  try {
    logger.info(`Releasing reservation: ${reservationId}`);

    // In real implementation:
    // - Find reservation
    // - Decrease reserved
    // - Increase available
    // - Emit inventory change event

    logger.info(`Reservation released: ${reservationId}`);
  } catch (error: any) {
    logger.error('Error releasing reservation:', error);
    throw error;
  }
}

/**
 * Update inventory levels (admin)
 */
export async function updateInventory(
  itemId: string,
  itemType: string,
  date: string,
  delta: number
): Promise<InventoryItem> {
  try {
    logger.info(`Updating inventory for ${itemType}:${itemId} by ${delta}`);

    // In real implementation, would update database
    const inventory = await getInventory(itemId, itemType, date);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    inventory.available += delta;
    inventory.total += delta;
    inventory.lastUpdated = new Date();

    // Emit event
    inventoryEvents.emit('inventory-changed', {
      itemId,
      itemType,
      date,
      change: delta,
    });

    // Check for low stock alerts
    if (inventory.available <= 5) {
      await createAlert({
        itemId,
        itemType,
        date,
        threshold: 5,
        current: inventory.available,
        alertType: 'low_stock',
        createdAt: new Date(),
      });
    }

    return inventory;
  } catch (error: any) {
    logger.error('Error updating inventory:', error);
    throw error;
  }
}

/**
 * Get inventory alerts
 */
export async function getAlerts(filters?: {
  itemType?: string;
  alertType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<InventoryAlert[]> {
  try {
    logger.info('Getting inventory alerts');

    // Mock alerts
    const mockAlerts: InventoryAlert[] = [
      {
        itemId: 'hotel_123',
        itemType: 'hotel',
        date: '2025-12-25',
        threshold: 5,
        current: 2,
        alertType: 'low_stock',
        createdAt: new Date(),
      },
      {
        itemId: 'flight_456',
        itemType: 'flight',
        date: '2025-12-24',
        threshold: 0,
        current: 0,
        alertType: 'out_of_stock',
        createdAt: new Date(),
      },
    ];

    // Apply filters
    let filtered = mockAlerts;
    if (filters?.itemType) {
      filtered = filtered.filter((a) => a.itemType === filters.itemType);
    }
    if (filters?.alertType) {
      filtered = filtered.filter((a) => a.alertType === filters.alertType);
    }

    return filtered;
  } catch (error: any) {
    logger.error('Error getting alerts:', error);
    throw error;
  }
}

/**
 * Create inventory alert
 */
async function createAlert(alert: InventoryAlert): Promise<void> {
  logger.warn(`Inventory alert: ${alert.alertType} for ${alert.itemType}:${alert.itemId}`);

  // Emit alert event for real-time notifications
  inventoryEvents.emit('inventory-alert', alert);

  // In real implementation, would save to database and trigger notifications
}

/**
 * Subscribe to inventory changes
 */
export function onInventoryChange(callback: (event: any) => void): void {
  inventoryEvents.on('inventory-changed', callback);
}

/**
 * Subscribe to inventory alerts
 */
export function onInventoryAlert(callback: (alert: InventoryAlert) => void): void {
  inventoryEvents.on('inventory-alert', callback);
}

/**
 * Get inventory statistics
 */
export async function getInventoryStats(
  itemType: string,
  startDate: string,
  endDate: string
): Promise<{
  totalInventory: number;
  totalAvailable: number;
  totalReserved: number;
  totalSold: number;
  utilizationRate: number;
  dates: number;
}> {
  try {
    logger.info(`Getting inventory stats for ${itemType} from ${startDate} to ${endDate}`);

    // Mock statistics
    const stats = {
      totalInventory: 500,
      totalAvailable: 150,
      totalReserved: 100,
      totalSold: 250,
      utilizationRate: 0.7, // 70% utilization
      dates: 10,
    };

    return stats;
  } catch (error: any) {
    logger.error('Error getting inventory stats:', error);
    throw error;
  }
}

export default {
  getInventory,
  checkAvailability,
  reserveInventory,
  confirmReservation,
  releaseReservation,
  updateInventory,
  getAlerts,
  onInventoryChange,
  onInventoryAlert,
  getInventoryStats,
};
