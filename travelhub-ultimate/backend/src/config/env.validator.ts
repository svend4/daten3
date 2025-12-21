/**
 * Environment Variable Validator
 * Validates required environment variables at application startup
 */

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Required environment variables for production
 */
const REQUIRED_PRODUCTION_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
];

/**
 * Recommended environment variables (warnings if missing)
 */
const RECOMMENDED_VARS = [
  'TRAVELPAYOUTS_TOKEN',
  'TRAVELPAYOUTS_MARKER',
  'PORT',
  'NODE_ENV',
];

/**
 * Validates environment variables
 */
export function validateEnvVariables(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables (critical in production, warning in development)
  for (const varName of REQUIRED_PRODUCTION_VARS) {
    if (!process.env[varName]) {
      if (process.env.NODE_ENV === 'production') {
        missing.push(varName);
      } else {
        warnings.push(`${varName} is not set (using development fallback)`);
      }
    }
  }

  // Check recommended variables (always warnings)
  for (const varName of RECOMMENDED_VARS) {
    if (!process.env[varName]) {
      warnings.push(`${varName} is not set (recommended)`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validates and logs results, throws error in production if validation fails
 */
export function validateAndLogEnv(): void {
  const result = validateEnvVariables();

  console.log('\n📋 Environment Variable Validation\n');

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }

  if (!result.valid) {
    console.error('❌ Missing required environment variables:');
    result.missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n');
    throw new Error('Required environment variables are missing. Cannot start server in production mode.');
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ All environment variables validated successfully\n');
  } else if (result.valid) {
    console.log('✅ All required environment variables present\n');
  }
}

/**
 * Get environment variable with validation
 */
export function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name];

  if (!value) {
    if (process.env.NODE_ENV === 'production' && !fallback) {
      throw new Error(`Environment variable ${name} is required in production`);
    }

    if (fallback) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(`⚠️  Using fallback for ${name} in production (not recommended)`);
      }
      return fallback;
    }

    throw new Error(`Environment variable ${name} is not set`);
  }

  return value;
}
