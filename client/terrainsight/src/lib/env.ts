/**
 * Environment Variables Access
 * 
 * This file provides a secure way to access environment variables in the client.
 * Only whitelisted variables are exposed to the client.
 */

interface ClientEnv {
  RAPIDAPI_KEY?: string;
  // Add other environment variables as needed
}

// Initialize environment object
const env: ClientEnv = {};

// Populate from window.__ENV__ if available (set by the server)
if (typeof window !== 'undefined' && (window as any).__ENV__) {
  Object.assign(env, (window as any).__ENV__);
}

export default env;