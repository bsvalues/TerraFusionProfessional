/**
 * ODBCConnector.ts
 * 
 * Connector for ODBC data sources
 * Uses browser-compatible ODBCAdapter to avoid node:events issues
 */

import { DataSourceType, ODBCConnectionConfig } from './ETLTypes';
import * as odbcAdapter from './ODBCAdapter';

// Configuration interface for ODBC connections
export interface ODBCConnectorConfig {
  connectionString: string;
  username?: string;
  password?: string;
  driver?: string;
  connectionTimeout?: number;
  requestTimeout?: number;
}

export class ODBCConnector {
  private config: ODBCConnectionConfig;
  private connectionError: Error | null = null;
  private isConnected = false;
  
  constructor(config: ODBCConnectorConfig) {
    this.config = {
      connectionString: config.connectionString,
      username: config.username,
      password: config.password
    };
  }
  
  /**
   * Connect to the database
   */
  async connect(): Promise<boolean> {
    try {
      // Test the connection
      const result = await odbcAdapter.testConnection(this.config);
      this.isConnected = result;
      return result;
    } catch (error) {
      this.connectionError = error instanceof Error 
        ? error 
        : new Error(String(error));
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
  }
  
  /**
   * Check if connected
   */
  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }
  
  /**
   * Get connection error
   */
  getConnectionError(): Error | null {
    return this.connectionError;
  }
  
  /**
   * Get the data source type
   */
  getDataSourceType(): string {
    return DataSourceType.ODBC;
  }
  
  /**
   * List available tables
   */
  async listTables(): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to database');
    }
    
    try {
      return await odbcAdapter.getTables(this.config);
    } catch (error) {
      this.connectionError = error instanceof Error 
        ? error 
        : new Error(String(error));
      throw this.connectionError;
    }
  }
  
  /**
   * List columns for a table
   */
  async listColumns(tableName: string): Promise<Array<{ name: string; type: string }>> {
    if (!this.isConnected) {
      throw new Error('Not connected to database');
    }
    
    try {
      const schema = await odbcAdapter.getTableSchema(this.config, tableName);
      return schema.map(column => ({
        name: column.name,
        type: column.type
      }));
    } catch (error) {
      this.connectionError = error instanceof Error 
        ? error 
        : new Error(String(error));
      throw this.connectionError;
    }
  }
  
  /**
   * Fetch table data
   */
  async fetchTableData(tableName: string, limit: number = 100): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to database');
    }
    
    try {
      // This works for most SQL-based databases, may need adjustments for other data sources
      const result = await odbcAdapter.executeQuery(
        this.config,
        `SELECT * FROM "${tableName}" LIMIT ${limit}`
      );
      
      return result.recordset;
    } catch (error) {
      this.connectionError = error instanceof Error 
        ? error 
        : new Error(String(error));
      throw this.connectionError;
    }
  }
  
  /**
   * Execute a custom query
   */
  async executeQuery(query: string, parameters: Record<string, any> = {}): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to database');
    }
    
    try {
      return await odbcAdapter.executeQuery(this.config, query, parameters);
    } catch (error) {
      this.connectionError = error instanceof Error 
        ? error 
        : new Error(String(error));
      throw this.connectionError;
    }
  }
}