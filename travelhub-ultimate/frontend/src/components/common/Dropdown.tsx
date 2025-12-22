/**
 * Re-export AuthProvider and useAuth for backward compatibility
 *
 * Note: This file previously contained a duplicate AuthProvider implementation.
 * It has been replaced with re-exports from the centralized AuthContext.
 *
 * @deprecated Import directly from '../store/AuthContext' instead
 */

export { AuthProvider, useAuth } from '../../store/AuthContext';
