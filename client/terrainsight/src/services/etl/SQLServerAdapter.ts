/**
 * SQLServerAdapter.ts
 * 
 * A client-side adapter for connecting to SQL Server databases
 * Uses the REST API to proxy the connection to avoid browser limitations
 */

import { DatabaseAdapter, SQLServerConnectionConfig } from './ETLTypes';
import { alertService } from './AlertService';

export class SQLServerAdapter implements DatabaseAdapter {
  private config: SQLServerConnectionConfig;
  private connected: boolean = false;
  
  constructor(config: SQLServerConnectionConfig) {
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
      alertService.error(`Failed to connect to SQL Server: ${error.message}`, 'SQLServerAdapter');
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
      const response = await fetch('/api/sqlserver/query', {
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
      alertService.error(`SQL Server query failed: ${error.message}`, 'SQLServerAdapter');
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
      // Query to get column information
      const sql = `
        SELECT 
          c.name AS column_name,
          t.name AS data_type,
          c.max_length AS character_maximum_length,
          c.precision AS numeric_precision,
          c.scale AS numeric_scale,
          c.is_nullable,
          OBJECT_DEFINITION(c.default_object_id) AS column_default,
          CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS is_primary_key
        FROM 
          sys.columns c
        INNER JOIN 
          sys.types t ON c.user_type_id = t.user_type_id
        LEFT JOIN 
          sys.index_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        LEFT JOIN 
          sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND i.is_primary_key = 1
        LEFT JOIN 
          sys.index_columns pk ON pk.object_id = c.object_id AND pk.column_id = c.column_id AND pk.index_id = i.index_id
        WHERE 
          c.object_id = OBJECT_ID(?)
        ORDER BY 
          c.column_id;
      `;
      
      return this.query(sql, [tableName]);
    } catch (error: any) {
      alertService.error(`Failed to get table schema: ${error.message}`, 'SQLServerAdapter');
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
      const sql = `
        SELECT 
          t.name AS table_name,
          s.name AS schema_name
        FROM 
          sys.tables t
        INNER JOIN 
          sys.schemas s ON t.schema_id = s.schema_id
        ORDER BY 
          s.name, t.name;
      `;
      
      const result = await this.query(sql);
      return result.map((row: any) => `${row.schema_name}.${row.table_name}`);
    } catch (error: any) {
      alertService.error(`Failed to get table list: ${error.message}`, 'SQLServerAdapter');
      throw error;
    }
  }
  
  /**
   * Test the database connection
   * @returns True if connection is successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/sqlserver/test', {
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
      alertService.error(`Connection test failed: ${error.message}`, 'SQLServerAdapter');
      return false;
    }
  }
}