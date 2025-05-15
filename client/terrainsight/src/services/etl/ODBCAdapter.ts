/**
 * ODBCAdapter.ts
 * 
 * A client-side adapter for connecting to ODBC data sources
 * Uses the REST API to proxy the connection to avoid browser limitations
 */

import { DatabaseAdapter, ODBCConnectionConfig } from './ETLTypes';
import { alertService } from './AlertService';

export class ODBCAdapter implements DatabaseAdapter {
  private config: ODBCConnectionConfig;
  private connected: boolean = false;
  
  constructor(config: ODBCConnectionConfig) {
    this.config = config;
  }

  /**
   * Connect to the database
   * Note: This is a client-side adapter, so there's no actual connection.
   * It just validates the configuration.
   */
  async connect(): Promise<void> {
    try {
      const result = await this.testConnection();
      if (!result) {
        throw new Error('Connection test failed');
      }
      this.connected = true;
    } catch (error: any) {
      alertService.error(`Failed to connect to ODBC source: ${error.message}`, 'ODBCAdapter');
      throw error;
    }
  }
  
  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    this.connected = false;
  }
  
  /**
   * Execute a SQL query
   * @param sql SQL query to execute
   * @param params Query parameters
   * @returns Query results
   */
  async query(sql: string, params?: any[]): Promise<any> {
    if (!this.connected) {
      throw new Error('Not connected to database');
    }
    
    try {
      const response = await fetch('/api/odbc/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connection: this.config,
          sql,
          params
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Query failed');
      }
      
      return response.json();
    } catch (error: any) {
      alertService.error(`ODBC query failed: ${error.message}`, 'ODBCAdapter');
      throw error;
    }
  }
  
  /**
   * Get the schema of a table
   * @param tableName Table name
   * @returns Table schema
   */
  async getTableSchema(tableName: string): Promise<any> {
    if (!this.connected) {
      throw new Error('Not connected to database');
    }
    
    try {
      // This is a generic SQL that should work with most ODBC sources
      // Specific data sources might need custom implementation
      const sql = `
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          CHARACTER_MAXIMUM_LENGTH,
          NUMERIC_PRECISION,
          NUMERIC_SCALE,
          COLUMN_DEFAULT
        FROM 
          INFORMATION_SCHEMA.COLUMNS
        WHERE 
          TABLE_NAME = ?
        ORDER BY 
          ORDINAL_POSITION;
      `;
      
      return this.query(sql, [tableName]);
    } catch (error: any) {
      alertService.error(`Failed to get table schema: ${error.message}`, 'ODBCAdapter');
      throw error;
    }
  }
  
  /**
   * Get a list of all tables in the database
   * @returns List of table names
   */
  async getTableList(): Promise<string[]> {
    if (!this.connected) {
      throw new Error('Not connected to database');
    }
    
    try {
      // Generic SQL for ODBC sources
      const sql = `
        SELECT 
          TABLE_SCHEMA,
          TABLE_NAME
        FROM 
          INFORMATION_SCHEMA.TABLES
        WHERE 
          TABLE_TYPE = 'BASE TABLE'
        ORDER BY 
          TABLE_SCHEMA, TABLE_NAME;
      `;
      
      const result = await this.query(sql);
      return result.map((row: any) => `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    } catch (error: any) {
      alertService.error(`Failed to get table list: ${error.message}`, 'ODBCAdapter');
      throw error;
    }
  }
  
  /**
   * Test the database connection
   * @returns True if connection is successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/odbc/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connection: this.config
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Connection test failed');
      }
      
      const result = await response.json();
      return result.success === true;
    } catch (error: any) {
      alertService.error(`Connection test failed: ${error.message}`, 'ODBCAdapter');
      return false;
    }
  }
}