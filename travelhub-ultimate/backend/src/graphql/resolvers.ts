/**
 * GraphQL Resolvers
 * Resolver functions for TravelHub GraphQL API
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../lib/prisma.js';
import logger from '../utils/logger.js';

/**
 * GraphQL Context (includes authenticated user)
 */
export interface GraphQLContext {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
  };
  req: any;
  res: any;
}

/**
 * Authentication helper
 */
const requireAuth = (context: GraphQLContext) => {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
};

/**
 * Admin authorization helper
 */
const requireAdmin = (context: GraphQLContext) => {
  const user = requireAuth(context);
  if (user.role !== 'ADMIN') {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
};

/**
 * GraphQL Resolvers
 */
export const resolvers = {
  // ============================================
  // SCALARS
  // ============================================

  DateTime: {
    serialize: (value: Date) => value.toISOString(),
    parseValue: (value: string) => new Date(value),
    parseLiteral: (ast: any) => {
      if (ast.kind === 'StringValue') {
        return new Date(ast.value);
      }
      return null;
    },
  },

  JSON: {
    serialize: (value: any) => value,
    parseValue: (value: any) => value,
    parseLiteral: (ast: any) => {
      if (ast.kind === 'ObjectValue' || ast.kind === 'StringValue') {
        return ast.value;
      }
      return null;
    },
  },

  // ============================================
  // QUERIES
  // ============================================

  Query: {
    /**
     * Get current authenticated user
     */
    me: async (_: any, __: any, context: GraphQLContext) => {
      const user = requireAuth(context);

      try {
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
        });

        return userData;
      } catch (error: any) {
        logger.error('GraphQL me query error:', error);
        throw new GraphQLError('Failed to fetch user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get user by ID
     */
    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      requireAuth(context);

      try {
        const user = await prisma.user.findUnique({
          where: { id },
        });

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        return user;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        logger.error('GraphQL user query error:', error);
        throw new GraphQLError('Failed to fetch user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * List users (admin only)
     */
    users: async (
      _: any,
      { limit = 10, offset = 0 }: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      try {
        const [users, total] = await Promise.all([
          prisma.user.findMany({
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.user.count(),
        ]);

        return {
          nodes: users,
          pageInfo: {
            hasNextPage: offset + limit < total,
            hasPreviousPage: offset > 0,
            totalCount: total,
            page: Math.floor(offset / limit) + 1,
            pageSize: limit,
          },
        };
      } catch (error: any) {
        logger.error('GraphQL users query error:', error);
        throw new GraphQLError('Failed to fetch users', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get booking by ID
     */
    booking: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const user = requireAuth(context);

      try {
        const booking = await prisma.booking.findUnique({
          where: { id },
        });

        if (!booking) {
          throw new GraphQLError('Booking not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Check authorization (user can only see their own bookings unless admin)
        if (booking.userId !== user.id && user.role !== 'ADMIN') {
          throw new GraphQLError('Not authorized to view this booking', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        return booking;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        logger.error('GraphQL booking query error:', error);
        throw new GraphQLError('Failed to fetch booking', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * List all bookings (admin) or user's bookings
     */
    bookings: async (
      _: any,
      { filter, limit = 10, offset = 0 }: { filter?: any; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      try {
        const where: any = {};

        if (filter) {
          if (filter.status) where.status = filter.status;
          if (filter.type) where.type = filter.type;
          // Add more filters as needed
        }

        const [bookings, total] = await Promise.all([
          prisma.booking.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.booking.count({ where }),
        ]);

        return {
          nodes: bookings,
          pageInfo: {
            hasNextPage: offset + limit < total,
            hasPreviousPage: offset > 0,
            totalCount: total,
            page: Math.floor(offset / limit) + 1,
            pageSize: limit,
          },
        };
      } catch (error: any) {
        logger.error('GraphQL bookings query error:', error);
        throw new GraphQLError('Failed to fetch bookings', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get current user's bookings
     */
    myBookings: async (
      _: any,
      { filter, limit = 10, offset = 0 }: { filter?: any; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      try {
        const where: any = { userId: user.id };

        if (filter) {
          if (filter.status) where.status = filter.status;
          if (filter.type) where.type = filter.type;
        }

        const [bookings, total] = await Promise.all([
          prisma.booking.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.booking.count({ where }),
        ]);

        return {
          nodes: bookings,
          pageInfo: {
            hasNextPage: offset + limit < total,
            hasPreviousPage: offset > 0,
            totalCount: total,
            page: Math.floor(offset / limit) + 1,
            pageSize: limit,
          },
        };
      } catch (error: any) {
        logger.error('GraphQL myBookings query error:', error);
        throw new GraphQLError('Failed to fetch bookings', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Health check
     */
    health: async () => {
      return {
        uptime: process.uptime(),
        requestsTotal: 0,
        requestsSuccess: 0,
        requestsFailed: 0,
        averageResponseTime: 0,
        timestamp: new Date(),
      };
    },
  },

  // ============================================
  // MUTATIONS
  // ============================================

  Mutation: {
    /**
     * Create a new booking
     */
    createBooking: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      try {
        // Parse details to extract specific fields
        const details = input.details || {};

        const booking = await prisma.booking.create({
          data: {
            userId: user.id,
            type: input.type,
            status: 'pending',
            itemId: details.itemId || 'unknown',
            itemName: details.itemName || 'Unknown Item',
            itemImage: details.itemImage,
            checkIn: details.checkIn ? new Date(details.checkIn) : undefined,
            checkOut: details.checkOut ? new Date(details.checkOut) : undefined,
            departDate: details.departDate ? new Date(details.departDate) : undefined,
            returnDate: details.returnDate ? new Date(details.returnDate) : undefined,
            guests: details.guests || 1,
            rooms: details.rooms,
            totalPrice: input.totalPrice,
            currency: details.currency || 'RUB',
            specialRequests: details.specialRequests,
            metadata: input.details, // Store full details in metadata
          },
        });

        logger.info('Booking created via GraphQL', { bookingId: booking.id, userId: user.id });
        return booking;
      } catch (error: any) {
        logger.error('GraphQL createBooking mutation error:', error);
        throw new GraphQLError('Failed to create booking', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Update booking
     */
    updateBooking: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      try {
        // Check authorization
        const existing = await prisma.booking.findUnique({ where: { id } });
        if (!existing) {
          throw new GraphQLError('Booking not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        if (existing.userId !== user.id && user.role !== 'ADMIN') {
          throw new GraphQLError('Not authorized to update this booking', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // Map details to metadata if present
        const updateData: any = { ...input };
        if (input.details) {
          updateData.metadata = input.details;
          delete updateData.details;
        }

        const booking = await prisma.booking.update({
          where: { id },
          data: updateData,
        });

        logger.info('Booking updated via GraphQL', { bookingId: id, userId: user.id });
        return booking;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        logger.error('GraphQL updateBooking mutation error:', error);
        throw new GraphQLError('Failed to update booking', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Cancel booking
     */
    cancelBooking: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const user = requireAuth(context);

      try {
        const existing = await prisma.booking.findUnique({ where: { id } });
        if (!existing) {
          throw new GraphQLError('Booking not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        if (existing.userId !== user.id && user.role !== 'ADMIN') {
          throw new GraphQLError('Not authorized to cancel this booking', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const booking = await prisma.booking.update({
          where: { id },
          data: { status: 'cancelled' },
        });

        logger.info('Booking cancelled via GraphQL', { bookingId: id, userId: user.id });
        return booking;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        logger.error('GraphQL cancelBooking mutation error:', error);
        throw new GraphQLError('Failed to cancel booking', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  // ============================================
  // FIELD RESOLVERS
  // ============================================

  User: {
    /**
     * Resolve user's bookings
     */
    bookings: async (
      parent: any,
      { limit = 10, offset = 0 }: { limit?: number; offset?: number }
    ) => {
      try {
        return await prisma.booking.findMany({
          where: { userId: parent.id },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        });
      } catch (error: any) {
        logger.error('GraphQL User.bookings resolver error:', error);
        return [];
      }
    },

    /**
     * Resolve user's favorites
     */
    favorites: async (
      parent: any,
      { limit = 10, offset = 0 }: { limit?: number; offset?: number }
    ) => {
      try {
        return await prisma.favorite.findMany({
          where: { userId: parent.id },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        });
      } catch (error: any) {
        logger.error('GraphQL User.favorites resolver error:', error);
        return [];
      }
    },

    /**
     * Resolve user's reviews
     * TODO: Implement when Review model is added to Prisma schema
     */
    reviews: async (
      parent: any,
      { limit = 10, offset = 0 }: { limit?: number; offset?: number }
    ) => {
      // Review model not yet implemented
      logger.warn('Review model not implemented in Prisma schema');
      return [];
    },
  },

  Booking: {
    /**
     * Resolve booking's user
     */
    user: async (parent: any) => {
      try {
        return await prisma.user.findUnique({
          where: { id: parent.userId },
        });
      } catch (error: any) {
        logger.error('GraphQL Booking.user resolver error:', error);
        return null;
      }
    },

    /**
     * Resolve booking's details (maps to metadata field in Prisma)
     */
    details: (parent: any) => {
      // Return metadata as details for GraphQL compatibility
      return parent.metadata || {};
    },
  },
};
