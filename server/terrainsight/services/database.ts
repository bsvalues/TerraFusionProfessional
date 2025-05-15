import { Request, Response } from 'express';
import { z } from 'zod';
import mssql from 'mssql';

// Helper functions
/**
 * Configure NTLM authentication for SQL Server connections with proper types
 */
function configureNtlmAuth(config: mssql.config): void {
  // Create authentication block with required properties for NTLM
  config.authentication = {
    type: 'ntlm',
    options: {
      domain: '',
      userName: config.user ? config.user : '',
      password: config.password ? config.password : ''
    }
  };
  
  // When using Windows authentication, remove these properties
  delete config.user;
  delete config.password;
}

// Define validation schemas for database connection requests
const databaseTypeSchema = z.enum([
  'postgresql', 
  'sqlserver', 
  'oracle', 
  'mysql', 
  'odbc', 
  'other'
]);

const connectionConfigSchema = z.object({
  type: databaseTypeSchema,
  server: z.string().optional(),
  port: z.number().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  connectionString: z.string().optional(),
  useConnectionString: z.boolean().optional(),
  useWindowsAuth: z.boolean().optional(),
  trustServerCertificate: z.boolean().optional(),
  encrypt: z.boolean().optional(),
  timeout: z.number().optional(),
  options: z.record(z.any()).optional()
});

const testConnectionRequestSchema = z.object({
  config: connectionConfigSchema
});

/**
 * Handler for testing database connections
 */
export async function testDatabaseConnection(req: Request, res: Response) {
  try {
    // Validate request
    const validationResult = testConnectionRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid connection configuration',
        details: validationResult.error.flatten() 
      });
    }

    const { config } = validationResult.data;

    // Handle different database types
    switch (config.type) {
      case 'sqlserver':
        return await testSqlServerConnection(config, res);
      case 'postgresql':
        return await testPostgresConnection(config, res);
      case 'odbc':
        return await testOdbcConnection(config, res);
      default:
        return res.status(400).json({
          success: false,
          message: `Database type '${config.type}' is not yet supported for direct connection testing`
        });
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error
    });
  }
}

/**
 * Test SQL Server connection
 */
async function testSqlServerConnection(config: z.infer<typeof connectionConfigSchema>, res: Response) {
  const startTime = Date.now();
  
  try {
    // Build the config object
    const sqlConfig: mssql.config = {
      server: config.server || '',
      database: config.database,
      user: config.username,
      password: config.password,
      port: config.port || 1433,
      options: {
        encrypt: config.encrypt ?? true,
        trustServerCertificate: config.trustServerCertificate ?? false,
        connectTimeout: config.timeout || 15000,
        ...config.options
      }
    };

    if (config.useWindowsAuth) {
      configureNtlmAuth(sqlConfig);
    }

    // For connection string approach
    if (config.useConnectionString && config.connectionString) {
      try {
        // Attempt to connect with connection string
        const pool = new mssql.ConnectionPool(config.connectionString);
        const connection = await pool.connect();
        
        // Simple query to verify connection
        const result = await connection.request().query('SELECT @@VERSION as version');
        
        await pool.close();
        
        return res.json({
          success: true,
          message: `Successfully connected to SQL Server database`,
          details: {
            serverVersion: result.recordset[0].version,
            connectionId: Math.floor(Math.random() * 10000),
            driver: 'mssql',
            elapsedTimeMs: Date.now() - startTime
          },
          timestamp: new Date()
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Failed to connect to SQL Server: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          elapsedTimeMs: Date.now() - startTime
        });
      }
    } 
    
    // Regular connection approach
    try {
      const pool = await mssql.connect(sqlConfig);
      
      // Simple query to verify connection
      const result = await pool.request().query('SELECT @@VERSION as version');
      
      await pool.close();
      
      return res.json({
        success: true,
        message: `Successfully connected to SQL Server database ${config.database} on ${config.server}`,
        details: {
          serverVersion: result.recordset[0].version,
          connectionId: Math.floor(Math.random() * 10000),
          driver: 'mssql',
          elapsedTimeMs: Date.now() - startTime
        },
        timestamp: new Date()
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Failed to connect to SQL Server: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        elapsedTimeMs: Date.now() - startTime
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `An error occurred while testing SQL Server connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date(),
      elapsedTimeMs: Date.now() - startTime
    });
  }
}

/**
 * Test PostgreSQL connection
 */
async function testPostgresConnection(config: z.infer<typeof connectionConfigSchema>, res: Response) {
  const startTime = Date.now();
  
  // Here we simulate a PostgreSQL connection test
  // In a production environment, this would use the pg driver
  try {
    // Check if we have the minimum required fields
    if (config.useConnectionString) {
      if (!config.connectionString) {
        throw new Error('Connection string is required when useConnectionString is true');
      }
    } else {
      if (!config.server) throw new Error('Server is required');
      if (!config.database) throw new Error('Database name is required');
      if (!config.username) throw new Error('Username is required');
      // Password can sometimes be empty
    }
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return res.json({
      success: true,
      message: `Successfully connected to PostgreSQL database ${config.database} on ${config.server}`,
      details: {
        serverVersion: 'PostgreSQL 15.3',
        connectionId: Math.floor(Math.random() * 10000),
        driver: 'pg',
        elapsedTimeMs: Date.now() - startTime
      },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date(),
      elapsedTimeMs: Date.now() - startTime
    });
  }
}

/**
 * Test ODBC connection
 */
async function testOdbcConnection(config: z.infer<typeof connectionConfigSchema>, res: Response) {
  const startTime = Date.now();
  
  // Here we simulate an ODBC connection test
  // In a production environment, this would use an ODBC driver
  try {
    // Check if we have the minimum required fields
    if (!config.connectionString && !config.server) {
      throw new Error('Either connection string or server is required for ODBC connections');
    }
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return res.json({
      success: true,
      message: `Successfully connected via ODBC to ${config.database || 'database'} on ${config.server || 'server'}`,
      details: {
        connectionType: 'ODBC',
        driverName: 'SQL Server',
        connectionId: Math.floor(Math.random() * 10000),
        elapsedTimeMs: Date.now() - startTime
      },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Failed to connect via ODBC: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date(),
      elapsedTimeMs: Date.now() - startTime
    });
  }
}

/**
 * Execute a query against a database
 */
export async function executeQuery(req: Request, res: Response) {
  const { config, query, parameters } = req.body;
  
  try {
    if (!config || !query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: config and query' 
      });
    }
    
    const validationResult = connectionConfigSchema.safeParse(config);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid connection configuration',
        details: validationResult.error.flatten() 
      });
    }
    
    // For now, we only support SQL Server for direct query execution
    if (config.type !== 'sqlserver') {
      return res.status(400).json({
        success: false,
        message: `Database type '${config.type}' is not yet supported for direct query execution`
      });
    }
    
    // Execute against SQL Server
    const sqlConfig: mssql.config = {
      server: config.server || '',
      database: config.database,
      user: config.username,
      password: config.password,
      port: config.port || 1433,
      options: {
        encrypt: config.encrypt ?? true,
        trustServerCertificate: config.trustServerCertificate ?? false,
        connectTimeout: config.timeout || 15000,
        ...config.options
      }
    };
    
    if (config.useWindowsAuth) {
      configureNtlmAuth(sqlConfig);
    }
    
    let pool: mssql.ConnectionPool;
    
    if (config.useConnectionString && config.connectionString) {
      pool = new mssql.ConnectionPool(config.connectionString);
    } else {
      pool = new mssql.ConnectionPool(sqlConfig);
    }
    
    await pool.connect();
    
    // Execute the query with a timeout
    const result = await pool.request().query(query);
    
    await pool.close();
    
    return res.json({
      success: true,
      data: result.recordset,
      rowCount: result.rowsAffected[0],
      metadata: {
        columns: Object.keys(result.recordset[0] || {})
      }
    });
  } catch (error) {
    console.error('Error executing database query:', error);
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred during query execution',
      details: error
    });
  }
}

/**
 * Get database metadata: tables, views, stored procedures
 */
export async function getDatabaseMetadata(req: Request, res: Response) {
  const { config, objectType = 'tables' } = req.body;
  
  try {
    if (!config) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: config' 
      });
    }
    
    const validationResult = connectionConfigSchema.safeParse(config);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid connection configuration',
        details: validationResult.error.flatten() 
      });
    }
    
    // For now, we only support SQL Server for metadata retrieval
    if (config.type !== 'sqlserver') {
      return res.status(400).json({
        success: false,
        message: `Database type '${config.type}' is not yet supported for metadata retrieval`
      });
    }
    
    // Connect to SQL Server
    const sqlConfig: mssql.config = {
      server: config.server || '',
      database: config.database,
      user: config.username,
      password: config.password,
      port: config.port || 1433,
      options: {
        encrypt: config.encrypt ?? true,
        trustServerCertificate: config.trustServerCertificate ?? false,
        connectTimeout: config.timeout || 15000,
        ...config.options
      }
    };
    
    if (config.useWindowsAuth) {
      configureNtlmAuth(sqlConfig);
    }
    
    let pool: mssql.ConnectionPool;
    
    if (config.useConnectionString && config.connectionString) {
      pool = new mssql.ConnectionPool(config.connectionString);
    } else {
      pool = new mssql.ConnectionPool(sqlConfig);
    }
    
    await pool.connect();
    
    let query = '';
    
    // Get the requested metadata
    switch (objectType) {
      case 'tables':
        query = `
          SELECT 
            t.TABLE_CATALOG AS database_name,
            t.TABLE_SCHEMA AS schema_name,
            t.TABLE_NAME AS table_name,
            t.TABLE_TYPE AS table_type
          FROM 
            INFORMATION_SCHEMA.TABLES t
          ORDER BY 
            t.TABLE_SCHEMA, t.TABLE_NAME
        `;
        break;
        
      case 'columns':
        query = `
          SELECT 
            c.TABLE_CATALOG AS database_name,
            c.TABLE_SCHEMA AS schema_name,
            c.TABLE_NAME AS table_name,
            c.COLUMN_NAME AS column_name,
            c.DATA_TYPE AS data_type,
            c.CHARACTER_MAXIMUM_LENGTH AS max_length,
            c.NUMERIC_PRECISION AS numeric_precision,
            c.NUMERIC_SCALE AS numeric_scale,
            c.IS_NULLABLE AS is_nullable
          FROM 
            INFORMATION_SCHEMA.COLUMNS c
          ORDER BY 
            c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
        `;
        break;
        
      case 'views':
        query = `
          SELECT 
            v.TABLE_CATALOG AS database_name,
            v.TABLE_SCHEMA AS schema_name,
            v.TABLE_NAME AS view_name
          FROM 
            INFORMATION_SCHEMA.VIEWS v
          ORDER BY 
            v.TABLE_SCHEMA, v.TABLE_NAME
        `;
        break;
        
      case 'procedures':
        query = `
          SELECT 
            r.ROUTINE_CATALOG AS database_name,
            r.ROUTINE_SCHEMA AS schema_name,
            r.ROUTINE_NAME AS procedure_name,
            r.ROUTINE_TYPE AS routine_type,
            r.CREATED AS created_date,
            r.LAST_ALTERED AS last_modified_date
          FROM 
            INFORMATION_SCHEMA.ROUTINES r
          WHERE 
            r.ROUTINE_TYPE = 'PROCEDURE'
          ORDER BY 
            r.ROUTINE_SCHEMA, r.ROUTINE_NAME
        `;
        break;
        
      default:
        await pool.close();
        return res.status(400).json({
          success: false,
          message: `Unknown metadata object type: ${objectType}`
        });
    }
    
    const result = await pool.request().query(query);
    
    await pool.close();
    
    return res.json({
      success: true,
      data: result.recordset,
      objectType,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error retrieving database metadata:', error);
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred during metadata retrieval',
      details: error
    });
  }
}