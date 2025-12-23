/**
 * WebSocket Service
 * Real-time bidirectional communication
 * Based on Innovation Library best practices
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from '../utils/logger.js';

/**
 * WebSocket event types
 */
export enum WSEventType {
  // Booking events
  BOOKING_CREATED = 'booking:created',
  BOOKING_UPDATED = 'booking:updated',
  BOOKING_CONFIRMED = 'booking:confirmed',
  BOOKING_CANCELLED = 'booking:cancelled',

  // Price events
  PRICE_UPDATE = 'price:update',
  PRICE_ALERT = 'price:alert',

  // Payment events
  PAYMENT_PROCESSING = 'payment:processing',
  PAYMENT_SUCCESS = 'payment:success',
  PAYMENT_FAILED = 'payment:failed',

  // Notification events
  NOTIFICATION = 'notification',
  ALERT = 'alert',

  // Chat events
  MESSAGE = 'message',
  TYPING = 'typing',

  // System events
  SYSTEM_UPDATE = 'system:update',
  MAINTENANCE = 'maintenance',
}

/**
 * WebSocket message
 */
interface WSMessage {
  event: WSEventType;
  data: any;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * WebSocket statistics
 */
interface WSStats {
  connections: number;
  totalConnections: number;
  totalMessages: number;
  byEvent: Map<WSEventType, number>;
  byRoom: Map<string, number>;
}

const stats: WSStats = {
  connections: 0,
  totalConnections: 0,
  totalMessages: 0,
  byEvent: new Map(),
  byRoom: new Map(),
};

/**
 * WebSocket Service class
 */
class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients = new Map<string, Socket>();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        // Allow anonymous connections for public data
        socket.data.userId = `anonymous_${socket.id}`;
        socket.data.isAuthenticated = false;
        return next();
      }

      // Validate JWT token (simplified - should use proper JWT verification)
      try {
        // In production: verify JWT and extract user info
        // const user = jwt.verify(token, process.env.JWT_SECRET);
        // socket.data.userId = user.id;
        socket.data.userId = 'user_from_token';
        socket.data.isAuthenticated = true;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket server initialized');
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: Socket): void {
    const userId = socket.data.userId;

    stats.connections++;
    stats.totalConnections++;
    this.connectedClients.set(socket.id, socket);

    logger.info(`WebSocket client connected: ${socket.id} (user: ${userId})`);

    // Join user-specific room
    if (socket.data.isAuthenticated) {
      socket.join(`user:${userId}`);
    }

    // Send welcome message
    socket.emit('connected', {
      socketId: socket.id,
      timestamp: new Date(),
      message: 'Connected to TravelHub WebSocket',
    });

    // Handle subscription to rooms
    socket.on('subscribe', (room: string) => {
      this.handleSubscribe(socket, room);
    });

    // Handle unsubscription
    socket.on('unsubscribe', (room: string) => {
      this.handleUnsubscribe(socket, room);
    });

    // Handle custom events
    socket.on('message', (data: any) => {
      this.handleMessage(socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error('WebSocket error:', error);
    });
  }

  /**
   * Handle room subscription
   */
  private handleSubscribe(socket: Socket, room: string): void {
    socket.join(room);

    // Update stats
    const roomCount = stats.byRoom.get(room) || 0;
    stats.byRoom.set(room, roomCount + 1);

    logger.info(`Client ${socket.id} subscribed to room: ${room}`);

    socket.emit('subscribed', { room, timestamp: new Date() });
  }

  /**
   * Handle room unsubscription
   */
  private handleUnsubscribe(socket: Socket, room: string): void {
    socket.leave(room);

    // Update stats
    const roomCount = stats.byRoom.get(room) || 0;
    if (roomCount > 0) {
      stats.byRoom.set(room, roomCount - 1);
    }

    logger.info(`Client ${socket.id} unsubscribed from room: ${room}`);

    socket.emit('unsubscribed', { room, timestamp: new Date() });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(socket: Socket, data: any): void {
    stats.totalMessages++;

    logger.debug(`Message from ${socket.id}:`, data);

    // Echo message back (or handle custom logic)
    socket.emit('message', {
      ...data,
      timestamp: new Date(),
      from: socket.id,
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(socket: Socket, reason: string): void {
    stats.connections--;
    this.connectedClients.delete(socket.id);

    logger.info(`WebSocket client disconnected: ${socket.id} (reason: ${reason})`);
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId: string, event: WSEventType, data: any): void {
    if (!this.io) return;

    const message: WSMessage = {
      event,
      data,
      timestamp: new Date(),
      userId,
    };

    this.io.to(`user:${userId}`).emit(event, message);

    // Update stats
    const eventCount = stats.byEvent.get(event) || 0;
    stats.byEvent.set(event, eventCount + 1);
    stats.totalMessages++;

    logger.debug(`Emitted ${event} to user ${userId}`);
  }

  /**
   * Emit event to specific room
   */
  emitToRoom(room: string, event: WSEventType, data: any): void {
    if (!this.io) return;

    const message: WSMessage = {
      event,
      data,
      timestamp: new Date(),
    };

    this.io.to(room).emit(event, message);

    // Update stats
    const eventCount = stats.byEvent.get(event) || 0;
    stats.byEvent.set(event, eventCount + 1);
    stats.totalMessages++;

    logger.debug(`Emitted ${event} to room ${room}`);
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: WSEventType, data: any): void {
    if (!this.io) return;

    const message: WSMessage = {
      event,
      data,
      timestamp: new Date(),
    };

    this.io.emit(event, message);

    // Update stats
    const eventCount = stats.byEvent.get(event) || 0;
    stats.byEvent.set(event, eventCount + 1);
    stats.totalMessages++;

    logger.debug(`Broadcasted ${event} to all clients`);
  }

  /**
   * Get connected clients count
   */
  getConnectionsCount(): number {
    return stats.connections;
  }

  /**
   * Get statistics
   */
  getStats() {
    const byEvent: Record<string, number> = {};
    for (const [event, count] of stats.byEvent.entries()) {
      byEvent[event] = count;
    }

    const byRoom: Record<string, number> = {};
    for (const [room, count] of stats.byRoom.entries()) {
      byRoom[room] = count;
    }

    return {
      connections: stats.connections,
      totalConnections: stats.totalConnections,
      totalMessages: stats.totalMessages,
      byEvent,
      byRoom,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    stats.totalConnections = 0;
    stats.totalMessages = 0;
    stats.byEvent.clear();
    stats.byRoom.clear();
  }

  /**
   * Close WebSocket server
   */
  async close(): Promise<void> {
    if (!this.io) return;

    // Disconnect all clients
    for (const socket of this.connectedClients.values()) {
      socket.disconnect(true);
    }

    // Close server
    await new Promise<void>((resolve) => {
      this.io!.close(() => {
        logger.info('WebSocket server closed');
        resolve();
      });
    });

    this.io = null;
  }

  /**
   * Disconnect WebSocket server (alias for close)
   */
  disconnect(): void {
    if (this.io) {
      // Disconnect all clients synchronously
      for (const socket of this.connectedClients.values()) {
        socket.disconnect(true);
      }

      this.io.close(() => {
        logger.info('WebSocket server disconnected');
      });

      this.io = null;
    }
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

/**
 * Get WebSocket statistics (standalone export for health controller)
 */
export const getWebSocketStats = () => {
  return websocketService.getStats();
};

/**
 * Helper functions for common use cases
 */

/**
 * Notify user about booking update
 */
export const notifyBookingUpdate = (userId: string, booking: any): void => {
  websocketService.emitToUser(userId, WSEventType.BOOKING_UPDATED, {
    bookingId: booking.id,
    status: booking.status,
    booking,
  });
};

/**
 * Notify user about price alert
 */
export const notifyPriceAlert = (userId: string, alert: any): void => {
  websocketService.emitToUser(userId, WSEventType.PRICE_ALERT, {
    alertId: alert.id,
    alert,
  });
};

/**
 * Notify user about payment status
 */
export const notifyPaymentStatus = (userId: string, payment: any): void => {
  const event = payment.status === 'success'
    ? WSEventType.PAYMENT_SUCCESS
    : WSEventType.PAYMENT_FAILED;

  websocketService.emitToUser(userId, event, {
    paymentId: payment.id,
    status: payment.status,
    payment,
  });
};

/**
 * Broadcast system update to all users
 */
export const broadcastSystemUpdate = (message: string, data?: any): void => {
  websocketService.broadcast(WSEventType.SYSTEM_UPDATE, {
    message,
    ...data,
  });
};

export default websocketService;
