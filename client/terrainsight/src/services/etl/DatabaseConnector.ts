// Define DataSourceCredentials interface here
export interface DataSourceCredentials {
  type: "userPassword" | "connectionString" | "oauth" | "key";
  username?: string;
  password?: string;
  connectionString?: string;
  server?: string;
  database?: string;
  port?: number;
  token?: string;
  apiKey?: string;
}

// Database server types
export enum DatabaseType {
  POSTGRESQL = "postgresql",
  SQLSERVER = "sqlserver",
  ORACLE = "oracle",
  MYSQL = "mysql",
  ODBC = "odbc",
  OTHER = "other"
}

// Database connection settings
export interface DatabaseConnectionConfig {
  type: DatabaseType;
  server?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  useConnectionString?: boolean;
  useWindowsAuth?: boolean;
  trustServerCertificate?: boolean;
  encrypt?: boolean;
  timeout?: number;
  options?: Record<string, any>;
}

// Connection test result
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
  elapsedTimeMs?: number;
}

// Service to manage database connections
export class DatabaseConnector {
  private static instance: DatabaseConnector;
  private connections: Map<string, DatabaseConnectionConfig> = new Map();
  private testResults: Map<string, ConnectionTestResult> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): DatabaseConnector {
    if (!DatabaseConnector.instance) {
      DatabaseConnector.instance = new DatabaseConnector();
    }
    return DatabaseConnector.instance;
  }

  /**
   * Save a database connection configuration
   * @param id Unique identifier for this connection
   * @param config Database connection configuration
   * @returns The saved configuration
   */
  public saveConnection(id: string, config: DatabaseConnectionConfig): DatabaseConnectionConfig {
    // Make sure we have a copy of the config to save
    const configToSave: DatabaseConnectionConfig = { ...config };
    
    // Set it in our map
    this.connections.set(id, configToSave);
    
    // Return a copy of what we saved
    return { ...configToSave };
  }

  /**
   * Get a saved database connection by ID
   * @param id Connection identifier
   * @returns The connection configuration or a default configuration if not found
   */
  public getConnection(id: string): DatabaseConnectionConfig {
    return this.connections.get(id) || {
      type: DatabaseType.SQLSERVER,
      server: '',
      database: ''
    };
  }

  /**
   * Get all saved database connections
   * @returns Array of connection configurations with their IDs
   */
  public getAllConnections(): Array<{ id: string; config: DatabaseConnectionConfig }> {
    return Array.from(this.connections.entries()).map(([id, config]) => ({ id, config }));
  }

  /**
   * Delete a saved database connection
   * @param id Connection identifier
   * @returns True if successfully deleted, false if not found
   */
  public deleteConnection(id: string): boolean {
    return this.connections.delete(id);
  }

  /**
   * Convert a database connection config to DataSourceCredentials
   * @param config Database connection configuration
   * @returns DataSourceCredentials that can be used by ETLPipelineManager
   */
  public toDataSourceCredentials(config: DatabaseConnectionConfig): DataSourceCredentials {
    let credentials: DataSourceCredentials = {
      type: config.useConnectionString ? "connectionString" : "userPassword",
    };

    if (config.useConnectionString && config.connectionString) {
      credentials.connectionString = config.connectionString;
    } else {
      credentials.username = config.username;
      credentials.password = config.password;
      credentials.server = config.server;
      credentials.database = config.database;
      credentials.port = config.port;
    }

    return credentials;
  }

  /**
   * Test a database connection with the provided configuration
   * @param config Database connection configuration to test
   * @returns Promise that resolves to a ConnectionTestResult
   */
  public async testConnection(id: string, config: DatabaseConnectionConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      // In a real implementation, this would make an API call to test the database connection
      // For now, we'll simulate the connection test with a success/fail based on whether the
      // required fields are provided

      // Check if required fields are present based on connection type
      let missingFields: string[] = [];
      
      if (config.useConnectionString) {
        if (!config.connectionString) {
          missingFields.push('connectionString');
        }
      } else {
        if (!config.server) missingFields.push('server');
        if (!config.database) missingFields.push('database');
        
        if (!config.useWindowsAuth) {
          if (!config.username) missingFields.push('username');
          if (!config.password) missingFields.push('password');
        }
      }
      
      // If we have missing fields, fail the test
      if (missingFields.length > 0) {
        const result: ConnectionTestResult = {
          success: false,
          message: `Connection test failed: Missing required fields: ${missingFields.join(', ')}`,
          timestamp: new Date(),
          elapsedTimeMs: Date.now() - startTime
        };
        this.testResults.set(id, result);
        return result;
      }
      
      // Simulate an API call to test the connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate a successful connection
      const result: ConnectionTestResult = {
        success: true,
        message: `Successfully connected to ${config.type} database ${config.database} on ${config.server}`,
        details: {
          serverVersion: config.type === DatabaseType.SQLSERVER ? "SQL Server 2019" : 
                         config.type === DatabaseType.POSTGRESQL ? "PostgreSQL 15.3" : 
                         "Database Server",
          connectionId: Math.floor(Math.random() * 10000),
          protocol: config.type,
        },
        timestamp: new Date(),
        elapsedTimeMs: Date.now() - startTime
      };
      
      this.testResults.set(id, result);
      return result;
    } catch (error) {
      // In case of an error during the API call
      const result: ConnectionTestResult = {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
        timestamp: new Date(),
        elapsedTimeMs: Date.now() - startTime
      };
      
      this.testResults.set(id, result);
      return result;
    }
  }

  /**
   * Get the last connection test result for a connection
   * @param id Connection identifier
   * @returns The last test result or undefined if never tested
   */
  public getLastTestResult(id: string): ConnectionTestResult | undefined {
    return this.testResults.get(id);
  }

  /**
   * Generate a connection string for the given database type and parameters
   * @param type Database type
   * @param params Connection parameters
   * @returns A formatted connection string
   */
  public generateConnectionString(config: DatabaseConnectionConfig): string {
    switch (config.type) {
      case DatabaseType.SQLSERVER:
        return this.generateSqlServerConnectionString(config);
      case DatabaseType.POSTGRESQL:
        return this.generatePostgresConnectionString(config);
      case DatabaseType.MYSQL:
        return this.generateMySqlConnectionString(config);
      case DatabaseType.ODBC:
        return this.generateOdbcConnectionString(config);
      default:
        throw new Error(`Connection string generation not supported for database type: ${config.type}`);
    }
  }

  private generateSqlServerConnectionString(config: DatabaseConnectionConfig): string {
    const params: string[] = [];
    
    if (config.server) {
      params.push(`Server=${config.server}${config.port ? `,${config.port}` : ''}`);
    }
    
    if (config.database) {
      params.push(`Database=${config.database}`);
    }
    
    if (config.useWindowsAuth) {
      params.push('Trusted_Connection=True');
    } else {
      if (config.username) params.push(`User Id=${config.username}`);
      if (config.password) params.push(`Password=${config.password}`);
    }
    
    if (config.trustServerCertificate !== undefined) {
      params.push(`TrustServerCertificate=${config.trustServerCertificate}`);
    }
    
    if (config.encrypt !== undefined) {
      params.push(`Encrypt=${config.encrypt}`);
    }
    
    if (config.timeout) {
      params.push(`Connection Timeout=${config.timeout}`);
    }
    
    return params.join(';');
  }
  
  private generatePostgresConnectionString(config: DatabaseConnectionConfig): string {
    const parts: string[] = ['postgresql://'];
    
    if (config.username) {
      parts.push(config.username);
      if (config.password) {
        parts.push(`:${config.password}`);
      }
      parts.push('@');
    }
    
    if (config.server) {
      parts.push(config.server);
      if (config.port) {
        parts.push(`:${config.port}`);
      }
    }
    
    if (config.database) {
      parts.push(`/${config.database}`);
    }
    
    // Add query parameters if needed
    const params: string[] = [];
    
    if (config.options) {
      Object.entries(config.options).forEach(([key, value]) => {
        params.push(`${key}=${value}`);
      });
    }
    
    if (params.length > 0) {
      parts.push(`?${params.join('&')}`);
    }
    
    return parts.join('');
  }
  
  private generateMySqlConnectionString(config: DatabaseConnectionConfig): string {
    const parts: string[] = ['mysql://'];
    
    if (config.username) {
      parts.push(config.username);
      if (config.password) {
        parts.push(`:${config.password}`);
      }
      parts.push('@');
    }
    
    if (config.server) {
      parts.push(config.server);
      if (config.port) {
        parts.push(`:${config.port}`);
      }
    }
    
    if (config.database) {
      parts.push(`/${config.database}`);
    }
    
    return parts.join('');
  }
  
  private generateOdbcConnectionString(config: DatabaseConnectionConfig): string {
    const params: string[] = [];
    
    params.push(`Driver={SQL Server}`); // Default ODBC driver
    
    if (config.server) {
      params.push(`Server=${config.server}`);
    }
    
    if (config.database) {
      params.push(`Database=${config.database}`);
    }
    
    if (config.useWindowsAuth) {
      params.push('Trusted_Connection=Yes');
    } else {
      if (config.username) params.push(`Uid=${config.username}`);
      if (config.password) params.push(`Pwd=${config.password}`);
    }
    
    return params.join(';');
  }
}

export default DatabaseConnector;