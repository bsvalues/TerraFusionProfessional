/**
 * Database Provider
 * 
 * This service provides an abstraction layer for database access,
 * supporting both local PostgreSQL and Supabase environments.
 * It automatically routes queries to the appropriate database
 * based on availability and failover settings.
 */

const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');
const { createClient: createPgClient } = require('@neondatabase/serverless');

// Database connection instances
let localDbClient = null;
let supabaseClient = null;
let supabaseDbClient = null;

// Connection status
let supabaseAvailable = false;
let localDbAvailable = false;

// Default to local database when Supabase is unavailable
let preferLocal = false;

/**
 * Initialize database connections
 */
async function initializeDatabases() {
  try {
    // Initialize local PostgreSQL
    if (!localDbClient) {
      localDbClient = postgres(process.env.DATABASE_URL, {
        max: 10,
        idle_timeout: 30,
        connect_timeout: 10
      });
      
      // Test the connection
      await localDbClient`SELECT 1`;
      localDbAvailable = true;
      console.log('Local PostgreSQL database initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize local PostgreSQL:', error);
    localDbAvailable = false;
    localDbClient = null;
  }
  
  try {
    // Initialize Supabase
    if (!supabaseClient && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      supabaseClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
      );
      
      // Get direct database access for SQL queries
      const { data: { db: db } } = supabaseClient.storage.from('postgres');
      if (db) {
        supabaseDbClient = db;
      } else {
        // Create direct Postgres client using the REST API
        supabaseDbClient = createPgClient({
          connectionString: process.env.DATABASE_URL,
          clientConfig: {
            transformers: [],
          }
        });
      }
      
      // Test the connection
      try {
        await supabaseClient.from('property_history_records').select('count(*)', { count: 'exact', head: true });
        supabaseAvailable = true;
        console.log('Supabase database initialized successfully');
      } catch (error) {
        if (error.code === 'PGRST301' || error.message?.includes('relation "property_history_records" does not exist')) {
          // Table doesn't exist yet, but the connection works
          console.log('Supabase connection successful, but schema not initialized');
          supabaseAvailable = true;
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    supabaseAvailable = false;
    supabaseClient = null;
    supabaseDbClient = null;
  }
  
  // Set preference based on availability
  if (!supabaseAvailable && localDbAvailable) {
    preferLocal = true;
    console.log('Using local PostgreSQL as Supabase is unavailable');
  } else if (supabaseAvailable) {
    preferLocal = false;
    console.log('Using Supabase as primary database');
  } else {
    console.error('No database connection available');
    throw new Error('No database connection available');
  }
}

/**
 * Get the appropriate database client based on availability and preferences
 * @returns {Object} Database client
 */
async function getDatabaseClient() {
  // Initialize if needed
  if (!localDbClient && !supabaseClient) {
    await initializeDatabases();
  }
  
  // Return the appropriate client
  if (preferLocal || !supabaseAvailable) {
    if (!localDbAvailable) {
      throw new Error('No database connection available');
    }
    return localDbClient;
  } else {
    return supabaseDbClient || supabaseClient;
  }
}

/**
 * Get the local PostgreSQL database client
 * @returns {Object} Local database client
 */
async function getLocalDatabase() {
  if (!localDbClient || !localDbAvailable) {
    await initializeDatabases();
  }
  
  if (!localDbAvailable) {
    throw new Error('Local database is not available');
  }
  
  return localDbClient;
}

/**
 * Get the Supabase database client
 * @returns {Object} Supabase client
 */
async function getSupabaseDatabase() {
  if (!supabaseClient || !supabaseAvailable) {
    await initializeDatabases();
  }
  
  if (!supabaseAvailable) {
    return null; // Return null instead of throwing to support fallback
  }
  
  return supabaseDbClient || supabaseClient;
}

/**
 * Get the Supabase client for non-database operations
 * @returns {Object} Supabase client
 */
async function getSupabaseClient() {
  if (!supabaseClient) {
    await initializeDatabases();
  }
  
  return supabaseClient;
}

/**
 * Set database preference
 * @param {boolean} useLocal - Whether to prefer local database
 */
function setDatabasePreference(useLocal) {
  preferLocal = useLocal;
}

/**
 * Get database status information
 * @returns {Object} Status information for both databases
 */
async function getDatabaseStatus() {
  if (!localDbClient || !supabaseClient) {
    await initializeDatabases();
  }
  
  return {
    local: {
      available: localDbAvailable,
      url: process.env.DATABASE_URL ? '[REDACTED]' : null
    },
    supabase: {
      available: supabaseAvailable,
      url: process.env.SUPABASE_URL || null
    },
    preferLocal,
    timestamp: new Date().toISOString()
  };
}

// Initialize on module load
initializeDatabases().catch(error => {
  console.error('Failed to initialize database connections:', error);
});

module.exports = {
  getDatabaseClient,
  getLocalDatabase,
  getSupabaseDatabase,
  getSupabaseClient,
  setDatabasePreference,
  getDatabaseStatus
};