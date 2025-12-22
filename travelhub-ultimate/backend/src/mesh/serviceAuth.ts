/**
 * Service Mesh - Service-to-Service Authentication
 * Simulated mTLS and service identity verification
 *
 * Features:
 * - Service identity certificates (simulated)
 * - Service-to-service authentication
 * - Request signing and verification
 * - Certificate rotation
 * - ACL (Access Control Lists)
 */

import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Service certificate (simulated mTLS cert)
 */
export interface ServiceCertificate {
  serviceId: string;
  serviceName: string;
  publicKey: string;
  privateKey: string;
  issuedAt: Date;
  expiresAt: Date;
  rotationScheduled: boolean;
}

/**
 * Service ACL entry
 */
export interface ACLEntry {
  sourceService: string;
  targetService: string;
  allowed: boolean;
  permissions: string[]; // e.g., ['read', 'write', 'delete']
}

/**
 * Authentication statistics
 */
interface AuthStats {
  totalRequests: number;
  authenticatedRequests: number;
  failedAuth: number;
  deniedByACL: number;
  expiredCertificates: number;
  certificateRotations: number;
}

class ServiceAuthService {
  private certificates: Map<string, ServiceCertificate> = new Map();
  private acls: Map<string, ACLEntry> = new Map(); // Key: sourceService:targetService
  private stats: AuthStats = {
    totalRequests: 0,
    authenticatedRequests: 0,
    failedAuth: 0,
    deniedByACL: 0,
    expiredCertificates: 0,
    certificateRotations: 0,
  };

  private readonly CERT_VALIDITY_DAYS = 90;
  private readonly ROTATION_THRESHOLD_DAYS = 7; // Rotate 7 days before expiry

  constructor() {
    // Start certificate rotation checker
    this.startCertificateRotationChecker();
  }

  /**
   * Issue certificate for service
   */
  issueCertificate(serviceId: string, serviceName: string): ServiceCertificate {
    // Generate RSA key pair (in production, this would be real certificates)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CERT_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

    const cert: ServiceCertificate = {
      serviceId,
      serviceName,
      publicKey,
      privateKey,
      issuedAt: now,
      expiresAt,
      rotationScheduled: false,
    };

    this.certificates.set(serviceId, cert);

    logger.info('Service certificate issued', {
      serviceId,
      serviceName,
      expiresAt: expiresAt.toISOString(),
    });

    return cert;
  }

  /**
   * Rotate certificate for service
   */
  rotateCertificate(serviceId: string): ServiceCertificate | null {
    const oldCert = this.certificates.get(serviceId);
    if (!oldCert) return null;

    const newCert = this.issueCertificate(serviceId, oldCert.serviceName);
    this.stats.certificateRotations++;

    logger.info('Certificate rotated', { serviceId });

    return newCert;
  }

  /**
   * Sign request
   */
  signRequest(serviceId: string, payload: string): string | null {
    const cert = this.certificates.get(serviceId);
    if (!cert) {
      logger.warn('No certificate found for service', { serviceId });
      return null;
    }

    // Check if expired
    if (new Date() > cert.expiresAt) {
      this.stats.expiredCertificates++;
      logger.warn('Certificate expired', { serviceId });
      return null;
    }

    // Create signature
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(payload);
    const signature = sign.sign(cert.privateKey, 'base64');

    return signature;
  }

  /**
   * Verify request signature
   */
  verifyRequest(sourceServiceId: string, payload: string, signature: string): boolean {
    this.stats.totalRequests++;

    const cert = this.certificates.get(sourceServiceId);
    if (!cert) {
      this.stats.failedAuth++;
      logger.warn('No certificate found for source service', { sourceServiceId });
      return false;
    }

    // Check if expired
    if (new Date() > cert.expiresAt) {
      this.stats.failedAuth++;
      this.stats.expiredCertificates++;
      logger.warn('Source certificate expired', { sourceServiceId });
      return false;
    }

    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(payload);
      const isValid = verify.verify(cert.publicKey, signature, 'base64');

      if (isValid) {
        this.stats.authenticatedRequests++;
      } else {
        this.stats.failedAuth++;
      }

      return isValid;
    } catch (error: any) {
      this.stats.failedAuth++;
      logger.error('Signature verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Add ACL entry
   */
  addACL(entry: ACLEntry): void {
    const key = `${entry.sourceService}:${entry.targetService}`;
    this.acls.set(key, entry);

    logger.info('ACL entry added', {
      source: entry.sourceService,
      target: entry.targetService,
      allowed: entry.allowed,
    });
  }

  /**
   * Remove ACL entry
   */
  removeACL(sourceService: string, targetService: string): boolean {
    const key = `${sourceService}:${targetService}`;
    const deleted = this.acls.delete(key);

    if (deleted) {
      logger.info('ACL entry removed', { source: sourceService, target: targetService });
    }

    return deleted;
  }

  /**
   * Check if service-to-service communication is allowed
   */
  checkACL(sourceService: string, targetService: string, permission?: string): boolean {
    const key = `${sourceService}:${targetService}`;
    const entry = this.acls.get(key);

    // If no ACL entry exists, default to allow (can be changed to deny)
    if (!entry) {
      return true;
    }

    // Check if communication is allowed
    if (!entry.allowed) {
      this.stats.deniedByACL++;
      logger.debug('ACL denied', { source: sourceService, target: targetService });
      return false;
    }

    // Check specific permission if provided
    if (permission && !entry.permissions.includes(permission)) {
      this.stats.deniedByACL++;
      logger.debug('ACL permission denied', {
        source: sourceService,
        target: targetService,
        permission,
      });
      return false;
    }

    return true;
  }

  /**
   * Authenticate service-to-service request
   */
  authenticateRequest(
    sourceServiceId: string,
    targetService: string,
    payload: string,
    signature: string,
    permission?: string
  ): boolean {
    // Verify signature
    const isAuthenticated = this.verifyRequest(sourceServiceId, payload, signature);
    if (!isAuthenticated) {
      return false;
    }

    // Get source service name
    const cert = this.certificates.get(sourceServiceId);
    if (!cert) return false;

    // Check ACL
    const isAllowed = this.checkACL(cert.serviceName, targetService, permission);
    return isAllowed;
  }

  /**
   * Get certificate for service
   */
  getCertificate(serviceId: string): ServiceCertificate | undefined {
    return this.certificates.get(serviceId);
  }

  /**
   * Get all certificates
   */
  getAllCertificates(): ServiceCertificate[] {
    return Array.from(this.certificates.values());
  }

  /**
   * Get all ACLs
   */
  getAllACLs(): ACLEntry[] {
    return Array.from(this.acls.values());
  }

  /**
   * Check certificate rotation schedule
   */
  private startCertificateRotationChecker(): void {
    setInterval(() => {
      const now = new Date();
      const rotationThreshold = new Date(
        now.getTime() + this.ROTATION_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
      );

      for (const [serviceId, cert] of this.certificates.entries()) {
        if (!cert.rotationScheduled && cert.expiresAt <= rotationThreshold) {
          cert.rotationScheduled = true;
          logger.warn('Certificate rotation scheduled', {
            serviceId,
            expiresAt: cert.expiresAt.toISOString(),
          });
        }
      }
    }, 3600000); // Check every hour
  }

  /**
   * Get statistics
   */
  getStats(): any {
    const expiringSoon = Array.from(this.certificates.values()).filter(cert => {
      const daysUntilExpiry =
        (cert.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      return daysUntilExpiry <= this.ROTATION_THRESHOLD_DAYS;
    });

    return {
      totalRequests: this.stats.totalRequests,
      authenticatedRequests: this.stats.authenticatedRequests,
      failedAuth: this.stats.failedAuth,
      deniedByACL: this.stats.deniedByACL,
      expiredCertificates: this.stats.expiredCertificates,
      certificateRotations: this.stats.certificateRotations,
      authRate: this.stats.totalRequests > 0
        ? ((this.stats.authenticatedRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      totalCertificates: this.certificates.size,
      expiringSoonCount: expiringSoon.length,
      totalACLs: this.acls.size,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      authenticatedRequests: 0,
      failedAuth: 0,
      deniedByACL: 0,
      expiredCertificates: 0,
      certificateRotations: this.stats.certificateRotations,
    };
    logger.info('Service auth statistics reset');
  }
}

export const serviceAuth = new ServiceAuthService();
