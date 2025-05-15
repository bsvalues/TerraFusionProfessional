/**
 * SQLServerConnector.ts
 * 
 * Connector for SQL Server databases
 * Uses browser-compatible SQLServerAdapter to avoid node:events issues
 */

import { DataSourceType, SQLServerConnectionConfig } from './ETLTypes';
import * as sqlServerAdapter from './SQLServerAdapter';

// Configuration interface for SQL Server connections
export interface SQLServerConnectorConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  domain?: string;
  useWindowsAuth?: boolean;
  trustServerCertificate?: boolean;
  connectionTimeout?: number;
  requestTimeout?: number;
}

export class SQLServerConnector {
  private config: SQLServerConnectionConfig;
  private connectionError: Error | null = null;
  private isConnected = false;
  
  constructor(config: SQLServerConnectorConfig) {
    this.config = {
      server: config.server,
      database: config.database,
      username: config.user,
      password: config.password,
      port: config.port,
      encrypt: !config.trustServerCertificate,
      trustServerCertificate: !!config.trustServerCertificate,
    };
  }
  
  /**
   * Connect to the database
   */
  async connect(): Promise<boolean> {
    try {
      // Test the connection
      const result = await sqlServerAdapter.testConnection(this.config);
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
    return DataSourceType.SQLSERVER;
  }
  
  /**
   * List available tables
   */
  async listTables(): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to database');
    }
    
    try {
      return await sqlServerAdapter.getTables(this.config);
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
      const schema = await sqlServerAdapter.getTableSchema(this.config, tableName);
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
      const result = await sqlServerAdapter.executeQuery(
        this.config,
        `SELECT TOP ${limit} * FROM [${tableName}]`
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
      return await sqlServerAdapter.executeQuery(this.config, query, parameters);
    } catch (error) {
      this.connectionError = error instanceof Error 
        ? error 
        : new Error(String(error));
      throw this.connectionError;
    }
  }
}