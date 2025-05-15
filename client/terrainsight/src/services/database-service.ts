/**
 * Database Service (Client)
 * 
 * This service provides an interface for interacting with the database API
 * to check status and manage database connections.
 */

const API_BASE_URL = '/api/database';

/**
 * Database status type definition
 */
export interface DatabaseStatus {
  success: boolean;
  status: 'OK' | 'DEGRADED' | 'ERROR';
  timestamp: string;
  details: {
    supabase: {
      connected: boolean;
      auditRecordsTable: boolean;
      propertyHistoryTable: boolean;
    };
    localPostgres: {
      connected: boolean;
      tablesVerified: boolean;
    };
    activeProvider: {
      auditRecords: 'supabase' | 'localPostgres';
      propertyHistory: 'supabase' | 'localPostgres';
    };
  };
  missingTables: boolean;
  usingFallback: boolean;
  sqlRequired: boolean;
  sqlScript: string | null;
}

/**
 * Get database status information
 * @returns Promise resolving to database status
 */
export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  try {
    const response = await fetch(API_BASE_URL);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch database status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching database status:', error);
    throw error;
  }
}

/**
 * Initialize or reinitialize the database (admin only)
 * @returns Promise resolving to initialization result
 */
export async function initializeDatabase(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to initialize database');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Check database health
 * @returns Promise resolving to health status
 */
export async function checkDatabaseHealth(): Promise<{ 
  success: boolean; 
  healthy: boolean;
  usingSupabase?: boolean;
  usingLocalPostgres?: boolean;
  timestamp: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        healthy: false,
        timestamp: new Date().toISOString(),
        error: errorData.error || 'Database health check failed'
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking database health:', error);
    return {
      success: false,
      healthy: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format a readable message about the database status
 * @param status The database status object
 * @returns Human-readable status message
 */
export function formatDatabaseStatusMessage(status: DatabaseStatus): string {
  if (status.status === 'OK') {
    return 'The database is properly configured and using Supabase for all tables.';
  } else if (status.status === 'DEGRADED') {
    return 'The database is in a degraded state, using local PostgreSQL as a fallback. Check with your administrator to create the missing Supabase tables.';
  } else {
    return 'The database is in an error state. Both Supabase and local PostgreSQL may be unavailable.';
  }
}