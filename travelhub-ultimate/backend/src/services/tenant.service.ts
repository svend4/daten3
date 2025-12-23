/**
 * Tenant Management Service
 * Service for managing tenants (organizations) in multi-tenant setup
 * Based on Innovation Library best practices
 */

import { prisma } from '../lib/prisma.js';
import logger from '../utils/logger.js';
import { randomBytes } from 'crypto';

/**
 * Tenant creation data
 */
export interface CreateTenantData {
  name: string;
  slug: string;
  domain?: string;
  settings?: Record<string, any>;
  plan?: 'free' | 'basic' | 'pro' | 'enterprise';
  maxUsers?: number;
  maxBookings?: number;
}

/**
 * Tenant update data
 */
export interface UpdateTenantData {
  name?: string;
  domain?: string;
  settings?: Record<string, any>;
  plan?: 'free' | 'basic' | 'pro' | 'enterprise';
  maxUsers?: number;
  maxBookings?: number;
  isActive?: boolean;
}

/**
 * Tenant with statistics
 */
export interface TenantWithStats {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  plan: string;
  isActive: boolean;
  createdAt: Date;
  settings: Record<string, any>;
  stats?: {
    totalUsers: number;
    totalBookings: number;
    totalRevenue: number;
    activeUsers: number;
  };
}

/**
 * Tenant service class
 */
class TenantService {
  /**
   * Create a new tenant
   */
  async createTenant(data: CreateTenantData): Promise<TenantWithStats> {
    try {
      // Validate slug uniqueness (simulate for now)
      // In production, this would check the database
      logger.info('Creating tenant:', { slug: data.slug, name: data.name });

      const tenant: TenantWithStats = {
        id: randomBytes(16).toString('hex'),
        slug: data.slug,
        name: data.name,
        domain: data.domain,
        plan: data.plan || 'free',
        isActive: true,
        createdAt: new Date(),
        settings: data.settings || {
          maxUsers: data.maxUsers || 10,
          maxBookings: data.maxBookings || 100,
          features: {
            customBranding: data.plan === 'enterprise',
            advancedAnalytics: ['pro', 'enterprise'].includes(data.plan || 'free'),
            apiAccess: ['pro', 'enterprise'].includes(data.plan || 'free'),
            whiteLabel: data.plan === 'enterprise',
          },
        },
      };

      logger.info('Tenant created successfully:', { id: tenant.id, slug: tenant.slug });
      return tenant;
    } catch (error: any) {
      logger.error('Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string): Promise<TenantWithStats | null> {
    try {
      // Simulate tenant lookup
      // In production, this would query the database
      return {
        id: tenantId,
        slug: tenantId,
        name: `Tenant ${tenantId}`,
        plan: 'pro',
        isActive: true,
        createdAt: new Date(),
        settings: {},
      };
    } catch (error: any) {
      logger.error('Error fetching tenant:', error);
      return null;
    }
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<TenantWithStats | null> {
    try {
      // Simulate tenant lookup
      return {
        id: slug,
        slug: slug,
        name: `Tenant ${slug}`,
        plan: 'pro',
        isActive: true,
        createdAt: new Date(),
        settings: {},
      };
    } catch (error: any) {
      logger.error('Error fetching tenant by slug:', error);
      return null;
    }
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, data: UpdateTenantData): Promise<TenantWithStats | null> {
    try {
      logger.info('Updating tenant:', { tenantId, updates: Object.keys(data) });

      // Simulate update
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Merge updates
      const updated: TenantWithStats = {
        ...tenant,
        ...data,
        settings: {
          ...tenant.settings,
          ...data.settings,
        },
      };

      logger.info('Tenant updated successfully:', { id: tenantId });
      return updated;
    } catch (error: any) {
      logger.error('Error updating tenant:', error);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }
  }

  /**
   * Delete tenant (soft delete - mark as inactive)
   */
  async deleteTenant(tenantId: string): Promise<boolean> {
    try {
      logger.info('Deleting tenant:', { tenantId });

      // Soft delete - mark as inactive
      await this.updateTenant(tenantId, { isActive: false });

      logger.info('Tenant deleted successfully:', { id: tenantId });
      return true;
    } catch (error: any) {
      logger.error('Error deleting tenant:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  /**
   * List all tenants
   */
  async listTenants(options?: {
    active?: boolean;
    plan?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tenants: TenantWithStats[]; total: number }> {
    try {
      // Simulate tenant list
      const mockTenants: TenantWithStats[] = [
        {
          id: 'default',
          slug: 'default',
          name: 'Default Organization',
          plan: 'enterprise',
          isActive: true,
          createdAt: new Date(),
          settings: {},
        },
        {
          id: 'acme',
          slug: 'acme',
          name: 'Acme Corporation',
          plan: 'pro',
          isActive: true,
          createdAt: new Date(),
          settings: {},
        },
        {
          id: 'example',
          slug: 'example',
          name: 'Example Inc',
          plan: 'basic',
          isActive: true,
          createdAt: new Date(),
          settings: {},
        },
      ];

      let filtered = mockTenants;

      // Apply filters
      if (options?.active !== undefined) {
        filtered = filtered.filter(t => t.isActive === options.active);
      }

      if (options?.plan) {
        filtered = filtered.filter(t => t.plan === options.plan);
      }

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 100;
      const paginated = filtered.slice(offset, offset + limit);

      return {
        tenants: paginated,
        total: filtered.length,
      };
    } catch (error: any) {
      logger.error('Error listing tenants:', error);
      throw new Error(`Failed to list tenants: ${error.message}`);
    }
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId: string): Promise<{
    totalUsers: number;
    totalBookings: number;
    totalRevenue: number;
    activeUsers: number;
  }> {
    try {
      // Simulate statistics
      // In production, this would aggregate from the database
      return {
        totalUsers: 42,
        totalBookings: 158,
        totalRevenue: 15750.50,
        activeUsers: 38,
      };
    } catch (error: any) {
      logger.error('Error fetching tenant stats:', error);
      throw new Error(`Failed to fetch tenant stats: ${error.message}`);
    }
  }

  /**
   * Validate tenant access to feature
   */
  async canAccessFeature(tenantId: string, feature: string): Promise<boolean> {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant || !tenant.isActive) {
        return false;
      }

      const features = tenant.settings?.features || {};
      return features[feature] === true;
    } catch (error: any) {
      logger.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Check tenant limits
   */
  async checkLimits(tenantId: string): Promise<{
    users: { current: number; max: number; exceeded: boolean };
    bookings: { current: number; max: number; exceeded: boolean };
  }> {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const stats = await this.getTenantStats(tenantId);
      const maxUsers = tenant.settings?.maxUsers || 10;
      const maxBookings = tenant.settings?.maxBookings || 100;

      return {
        users: {
          current: stats.totalUsers,
          max: maxUsers,
          exceeded: stats.totalUsers >= maxUsers,
        },
        bookings: {
          current: stats.totalBookings,
          max: maxBookings,
          exceeded: stats.totalBookings >= maxBookings,
        },
      };
    } catch (error: any) {
      logger.error('Error checking tenant limits:', error);
      throw new Error(`Failed to check tenant limits: ${error.message}`);
    }
  }

  /**
   * Generate tenant API key
   */
  async generateApiKey(tenantId: string): Promise<string> {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Generate secure API key
      const apiKey = `tk_${tenant.slug}_${randomBytes(32).toString('hex')}`;

      logger.info('API key generated for tenant:', { tenantId });
      return apiKey;
    } catch (error: any) {
      logger.error('Error generating API key:', error);
      throw new Error(`Failed to generate API key: ${error.message}`);
    }
  }
}

/**
 * Export singleton instance
 */
export const tenantService = new TenantService();

/**
 * Tenant isolation helper for Prisma
 * Adds tenantId filter to all queries
 */
export const withTenantIsolation = <T>(tenantId: string | undefined, query: any): any => {
  if (!tenantId) {
    return query;
  }

  // Add tenantId filter to where clause
  return {
    ...query,
    where: {
      ...query.where,
      tenantId: tenantId,
    },
  };
};

/**
 * Export helper to create tenant-scoped Prisma client
 */
export const createTenantPrisma = (tenantId: string) => {
  // This would return a Prisma client with automatic tenant filtering
  // For now, we return the regular prisma client
  // In production, use Prisma middleware or extensions
  return prisma;
};
