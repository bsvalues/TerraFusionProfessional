/**
 * Environment variable utilities
 */

/**
 * Get an environment variable with a fallback value
 * @param key The environment variable key
 * @param defaultValue The default value if the environment variable is not set
 * @returns The environment variable value or the default value
 */
export function env(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Get an environment variable as a number with a fallback value
 * @param key The environment variable key
 * @param defaultValue The default value if the environment variable is not set or is not a valid number
 * @returns The environment variable value as a number or the default value
 */
export function envNumber(key: string, defaultValue: number = 0): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  
  const numValue = Number(value);
  return isNaN(numValue) ? defaultValue : numValue;
}

/**
 * Get an environment variable as a boolean with a fallback value
 * @param key The environment variable key
 * @param defaultValue The default value if the environment variable is not set
 * @returns The environment variable value as a boolean or the default value
 */
export function envBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  
  return value.toLowerCase() === 'true';
}

/**
 * Check if the application is running in production mode
 * @returns True if NODE_ENV is 'production', false otherwise
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if the application is running in development mode
 * @returns True if NODE_ENV is 'development', false otherwise
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

/**
 * Check if the application is running in test mode
 * @returns True if NODE_ENV is 'test', false otherwise
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

export default {
  env,
  envNumber,
  envBoolean,
  isProduction,
  isDevelopment,
  isTest
};
