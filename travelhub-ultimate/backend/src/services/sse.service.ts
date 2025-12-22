/**
 * Server-Sent Events (SSE) Service
 * Real-time updates via SSE
 * Lightweight alternative to WebSocket
 */

import { Request, Response } from 'express';
import logger from '../utils/logger.js';

/**
 * SSE event types
 */
export enum SSEEventType {
  BOOKING_UPDATE = 'booking:update',
  PRICE_ALERT = 'price:alert',
  PAYMENT_STATUS = 'payment:status',
  NOTIFICATION = 'notification',
  SYSTEM_MESSAGE = 'system:message',
}

/**
 * SSE client connection
 */
interface SSEClient {
  id: string;
  userId?: string;
  response: Response;
  channels: Set<string>;
  connectedAt: Date;
  lastActivity: Date;
}

/**
 * SSE statistics
 */
const stats = {
  totalConnections: 0,
  currentConnections: 0,
  totalMessagesSent: 0,
  byEventType: new Map<string, number>(),
  recentEvents: [] as Array<{
    eventType: string;
    clientCount: number;
    timestamp: Date;
  }>,
};

/**
 * SSE Service
 */
class SSEService {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize SSE service
   */
  initialize(): void {
    // Start heartbeat to keep connections alive
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Every 30 seconds

    logger.info('SSE Service initialized');
  }

  /**
   * Create SSE connection
   */
  connect(req: Request, res: Response, clientId: string, userId?: string): void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Create client
    const client: SSEClient = {
      id: clientId,
      userId,
      response: res,
      channels: new Set(),
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.clients.set(clientId, client);

    // Update stats
    stats.totalConnections++;
    stats.currentConnections++;

    // Send connection established event
    this.sendToClient(clientId, SSEEventType.SYSTEM_MESSAGE, {
      message: 'Connected to SSE',
      clientId,
    });

    logger.info(`SSE client connected: ${clientId} (userId: ${userId || 'anonymous'})`);

    // Handle connection close
    req.on('close', () => {
      this.disconnect(clientId);
    });
  }

  /**
   * Disconnect client
   */
  disconnect(clientId: string): void {
    const client = this.clients.get(clientId);

    if (client) {
      client.response.end();
      this.clients.delete(clientId);
      stats.currentConnections--;

      logger.info(`SSE client disconnected: ${clientId}`);
    }
  }

  /**
   * Subscribe client to channel
   */
  subscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);

    if (client) {
      client.channels.add(channel);
      logger.debug(`Client ${clientId} subscribed to channel: ${channel}`);
    }
  }

  /**
   * Unsubscribe client from channel
   */
  unsubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);

    if (client) {
      client.channels.delete(channel);
      logger.debug(`Client ${clientId} unsubscribed from channel: ${channel}`);
    }
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId: string, eventType: SSEEventType, data: any): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      return false;
    }

    try {
      const message = this.formatSSEMessage(eventType, data);
      client.response.write(message);
      client.lastActivity = new Date();

      // Update stats
      stats.totalMessagesSent++;
      this.updateEventTypeStats(eventType);

      return true;
    } catch (error: any) {
      logger.error(`Failed to send SSE to client ${clientId}:`, error);
      this.disconnect(clientId);
      return false;
    }
  }

  /**
   * Send event to user (all their connections)
   */
  sendToUser(userId: string, eventType: SSEEventType, data: any): number {
    let count = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.userId === userId) {
        if (this.sendToClient(clientId, eventType, data)) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Broadcast event to channel
   */
  broadcastToChannel(channel: string, eventType: SSEEventType, data: any): number {
    let count = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.channels.has(channel)) {
        if (this.sendToClient(clientId, eventType, data)) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Broadcast to all clients
   */
  broadcast(eventType: SSEEventType, data: any): number {
    let count = 0;

    for (const clientId of this.clients.keys()) {
      if (this.sendToClient(clientId, eventType, data)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Format SSE message
   */
  private formatSSEMessage(eventType: string, data: any): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return `event: ${eventType}\ndata: ${dataString}\n\n`;
  }

  /**
   * Send heartbeat to all clients
   */
  private sendHeartbeat(): void {
    for (const clientId of this.clients.keys()) {
      try {
        const client = this.clients.get(clientId);
        if (client) {
          client.response.write(': heartbeat\n\n');
          client.lastActivity = new Date();
        }
      } catch (error: any) {
        logger.error(`Failed to send heartbeat to ${clientId}:`, error);
        this.disconnect(clientId);
      }
    }
  }

  /**
   * Update event type statistics
   */
  private updateEventTypeStats(eventType: string): void {
    const count = stats.byEventType.get(eventType) || 0;
    stats.byEventType.set(eventType, count + 1);

    // Add to recent events
    stats.recentEvents.push({
      eventType,
      clientCount: stats.currentConnections,
      timestamp: new Date(),
    });

    // Keep only last 50
    if (stats.recentEvents.length > 50) {
      stats.recentEvents = stats.recentEvents.slice(-50);
    }
  }

  /**
   * Get connected clients count
   */
  getConnectionsCount(): number {
    return stats.currentConnections;
  }

  /**
   * Get statistics
   */
  getStats() {
    const byEventType: Record<string, number> = {};
    for (const [type, count] of stats.byEventType.entries()) {
      byEventType[type] = count;
    }

    return {
      totalConnections: stats.totalConnections,
      currentConnections: stats.currentConnections,
      totalMessagesSent: stats.totalMessagesSent,
      byEventType,
      recentEvents: stats.recentEvents.slice(-20),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    stats.totalConnections = 0;
    stats.totalMessagesSent = 0;
    stats.byEventType.clear();
    stats.recentEvents = [];
    // Keep currentConnections as is
  }

  /**
   * Shutdown service
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Disconnect all clients
    for (const clientId of this.clients.keys()) {
      this.disconnect(clientId);
    }

    logger.info('SSE Service shut down');
  }
}

// Export singleton instance
export const sseService = new SSEService();

/**
 * Get SSE statistics (standalone export for health controller)
 */
export const getSSEStats = () => {
  return sseService.getStats();
};

/**
 * Reset SSE statistics
 */
export const resetSSEStats = (): void => {
  sseService.resetStats();
};

export default sseService;
