/**
 * Swagger/OpenAPI Configuration
 * API Documentation setup
 */

import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TravelHub API',
      version: '1.0.0',
      description: 'Travel booking platform API - Hotels, Flights, and Affiliate services',
      contact: {
        name: 'API Support',
        email: 'support@travelhub.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: process.env.FRONTEND_URL || 'https://daten3-1.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin', 'super_admin', 'affiliate'] },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended', 'deleted'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'Password123' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: {
              type: 'string',
              minLength: 8,
              pattern: '^(?=.*[A-Za-z])(?=.*\\d)',
              example: 'Password123',
              description: 'Minimum 8 characters, at least one letter and one number'
            },
            phone: { type: 'string', example: '+1234567890' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            hotelId: { type: 'string' },
            checkInDate: { type: 'string', format: 'date' },
            checkOutDate: { type: 'string', format: 'date' },
            guests: { type: 'integer', minimum: 1, maximum: 20 },
            rooms: { type: 'integer', minimum: 1, maximum: 10 },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
            totalPrice: { type: 'number', format: 'float' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Validation failed' },
            message: { type: 'string', example: 'Invalid request data' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Unauthorized',
                message: 'No token provided. Please login.',
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Validation failed',
                message: 'Invalid request data',
                errors: [
                  { field: 'email', message: 'Invalid email address' },
                ],
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Bookings',
        description: 'Hotel booking management',
      },
      {
        name: 'Hotels',
        description: 'Hotel search and information',
      },
      {
        name: 'Favorites',
        description: 'User favorites management',
      },
      {
        name: 'Affiliate',
        description: 'Affiliate program endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin panel endpoints (admin only)',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
