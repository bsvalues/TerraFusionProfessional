/**
 * SQL Server database configuration for TerraFusionPro
 */
import * as sql from 'mssql';
import { env, envNumber, envBoolean } from '../utils/env';

// Create connection pool configuration
const sqlConfig: sql.config = {
  user: env('DB_USER', 'sa'),
  password: env('DB_PASSWORD', 'TerraFusion2025!'),
  database: env('DB_NAME', 'TerraFusionPro'),
  server: env('DB_SERVER', 'localhost'),
  port: envNumber('DB_PORT', 1433),
  pool: {
    max: envNumber('DB_POOL_MAX', 10),
    min: envNumber('DB_POOL_MIN', 0),
    idleTimeoutMillis: envNumber('DB_POOL_IDLE_TIMEOUT', 30000)
  },
  options: {
    encrypt: envBoolean('DB_ENCRYPT', false), // For Azure
    trustServerCertificate: envBoolean('DB_TRUST_SERVER_CERT', true), // For local dev / self-signed certs
    enableArithAbort: true
  }
};

// Create and export the connection pool
const pool = new sql.ConnectionPool(sqlConfig);
const poolConnect = pool.connect();

// Global error handling
pool.on('error', err => {
  console.error('SQL Server error:', err);
});

/**
 * Execute a SQL query with parameters
 */
export async function executeQuery<T>(query: string, params: any = {}): Promise<T[]> {
  await poolConnect; // Ensure pool is connected
  
  try {
    const request = pool.request();
    
    // Add parameters to request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.query(query);
    return result.recordset as T[];
  } catch (err) {
    console.error('Error executing query:', err);
    throw err;
  }
}

/**
 * Execute a stored procedure with parameters
 */
export async function executeStoredProcedure<T>(procedure: string, params: any = {}): Promise<T[][]> {
  await poolConnect; // Ensure pool is connected
  
  try {
    const request = pool.request();
    
    // Add parameters to request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.execute(procedure);
    
    // Handle multiple result sets
    const resultSets: T[][] = [];
    resultSets.push(result.recordset as T[]);
    
    // Add additional recordsets if present
    if (result.recordsets && result.recordsets.length > 1) {
      for (let i = 1; i < result.recordsets.length; i++) {
        resultSets.push(result.recordsets[i] as T[]);
      }
    }
    
    return resultSets;
  } catch (err) {
    console.error('Error executing stored procedure:', err);
    throw err;
  }
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  try {
    await pool.close();
    console.log('SQL Server connection pool closed');
  } catch (err) {
    console.error('Error closing connection pool:', err);
    throw err;
  }
}

export default {
  pool,
  executeQuery,
  executeStoredProcedure,
  closePool
};
