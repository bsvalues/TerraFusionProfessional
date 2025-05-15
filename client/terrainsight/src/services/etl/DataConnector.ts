import { DataSource, DataSourceType } from './ETLTypes';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * Connection config interface for all connectors
 */
export interface ConnectionConfig {
  [key: string]: any;
}

/**
 * Interface for data connectors to implement
 */
export interface IDataConnector {
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  isConnected(): boolean;
  getConnectionError(): Error | null;
  getDataSource(): DataSource;
}

/**
 * Connection result interface
 */
export interface ConnectionResult {
  /** Whether the connection was successful */
  success: boolean;
  
  /** Error message */
  error?: string;
  
  /** Connection details */
  details?: Record<string, any>;
}

/**
 * Extract options interface
 */
export interface ExtractOptions {
  /** Query to execute */
  query?: string;
  
  /** Filters to apply */
  filters?: Record<string, any>;
  
  /** Fields to select */
  fields?: string[];
  
  /** Limit number of records */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
  
  /** Sort field */
  sortBy?: string;
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Extract result interface
 */
export interface ExtractResult {
  /** Whether the extraction was successful */
  success: boolean;
  
  /** Error message */
  error?: string;
  
  /** Extracted data */
  data: any[];
  
  /** Total number of records (for pagination) */
  total?: number;
  
  /** Metadata about the extraction */
  metadata?: Record<string, any>;
}

/**
 * Load options interface
 */
export interface LoadOptions {
  /** Load mode */
  mode?: 'INSERT' | 'UPDATE' | 'UPSERT' | 'REPLACE' | 'APPEND';
  
  /** Target table or collection */
  target: string;
  
  /** Primary key for updates */
  primaryKey?: string;
  
  /** Whether to truncate the target before loading */
  truncate?: boolean;
  
  /** Batch size for loading */
  batchSize?: number;
}

/**
 * Load result interface
 */
export interface LoadResult {
  /** Whether the load was successful */
  success: boolean;
  
  /** Error message */
  error?: string;
  
  /** Number of records loaded */
  count: number;
  
  /** Number of records rejected */
  rejected: number;
  
  /** Rejection reasons */
  rejections?: Record<string, any>[];
  
  /** Metadata about the load */
  metadata?: Record<string, any>;
}

/**
 * Data Connector
 * 
 * This class is responsible for connecting to data sources and extracting/loading data.
 */
class DataConnector {
  /**
   * Test connection to a data source
   */
  async testConnection(dataSource: DataSource): Promise<ConnectionResult> {
    try {
      switch (dataSource.type) {
        case DataSourceType.POSTGRESQL:
        case DataSourceType.MYSQL:
          return this.testDatabaseConnection(dataSource);
          
        case DataSourceType.REST_API:
        case DataSourceType.GRAPHQL_API:
          return this.testApiConnection(dataSource);
          
        case DataSourceType.FILE_CSV:
        case DataSourceType.FILE_JSON:
        case DataSourceType.FILE_XML:
        case DataSourceType.FILE_EXCEL:
          return this.testFileConnection(dataSource);
          
        case DataSourceType.MEMORY:
          return {
            success: true,
            details: {
              records: dataSource.config.data?.length || 0
            }
          };
          
        default:
          return {
            success: false,
            error: `Unsupported data source type: ${dataSource.type}`
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.DATA_SOURCE,
        title: `Connection Error: ${dataSource.name}`,
        message: `Failed to connect to data source "${dataSource.name}": ${errorMessage}`,
        entityId: dataSource.id
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Test database connection
   */
  private async testDatabaseConnection(dataSource: DataSource): Promise<ConnectionResult> {
    // In a real app, we would use a database client to test the connection
    // For now, we'll just validate the configuration
    
    const { host, port, database, user } = dataSource.config;
    
    if (!host || !port || !database || !user) {
      return {
        success: false,
        error: 'Missing database connection parameters'
      };
    }
    
    // Mock successful connection
    return {
      success: true,
      details: {
        host,
        port,
        database,
        user
      }
    };
  }
  
  /**
   * Test API connection
   */
  private async testApiConnection(dataSource: DataSource): Promise<ConnectionResult> {
    const { url, method, headers } = dataSource.config;
    
    if (!url) {
      return {
        success: false,
        error: 'Missing API URL'
      };
    }
    
    // In a real app, we would make a request to the API
    // For now, we'll just validate the configuration and use mock data
    
    // If we have in-memory data, assume success
    if (dataSource.config.data && dataSource.config.data.length > 0) {
      return {
        success: true,
        details: {
          url,
          method: method || 'GET',
          headers: headers || {},
          records: dataSource.config.data.length
        }
      };
    }
    
    // Mock successful connection
    return {
      success: true,
      details: {
        url,
        method: method || 'GET',
        headers: headers || {}
      }
    };
  }
  
  /**
   * Test file connection
   */
  private async testFileConnection(dataSource: DataSource): Promise<ConnectionResult> {
    const { filePath } = dataSource.config;
    
    if (!filePath) {
      return {
        success: false,
        error: 'Missing file path'
      };
    }
    
    // In a real app, we would check if the file exists and is readable
    // For now, we'll just validate the configuration and use mock data
    
    // If we have in-memory data, assume success
    if (dataSource.config.data && dataSource.config.data.length > 0) {
      return {
        success: true,
        details: {
          filePath,
          records: dataSource.config.data.length
        }
      };
    }
    
    // Mock successful connection
    return {
      success: true,
      details: {
        filePath
      }
    };
  }
  
  /**
   * Extract data from a data source
   */
  async extract(sourceId: number, options?: ExtractOptions): Promise<ExtractResult> {
    // This would normally fetch a data source from a repository
    // For now, we'll just use mock data
    
    try {
      // Mock extract process
      // In a real app, we would fetch the data source by ID and then extract data
      
      // Define a type for our mock data
      interface MockDataItem {
        id: number;
        name: string;
        email: string;
        age: number;
        [key: string]: any; // Allow indexing with string
      }
      
      // Mock data
      const mockData: MockDataItem[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 40 },
        { id: 4, name: 'Alice Williams', email: 'alice@example.com', age: 35 },
        { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', age: 28 }
      ];
      
      // Apply filters if provided
      let filteredData = [...mockData];
      
      if (options?.filters) {
        for (const [field, value] of Object.entries(options.filters)) {
          filteredData = filteredData.filter(item => 
            typeof item[field] === 'string' 
              ? item[field].toLowerCase().includes(String(value).toLowerCase())
              : item[field] === value
          );
        }
      }
      
      // Apply field selection if provided
      if (options?.fields && options.fields.length > 0) {
        filteredData = filteredData.map(item => {
          const result: Record<string, any> = {};
          
          for (const field of options.fields!) {
            if (field in item) {
              result[field] = item[field];
            }
          }
          
          return result as MockDataItem;
        });
      }
      
      // Apply sorting if provided
      if (options?.sortBy) {
        const sortField = options.sortBy;
        const sortDirection = options.sortDirection || 'asc';
        
        filteredData.sort((a, b) => {
          if (sortDirection === 'asc') {
            return a[sortField] < b[sortField] ? -1 : a[sortField] > b[sortField] ? 1 : 0;
          } else {
            return a[sortField] > b[sortField] ? -1 : a[sortField] < b[sortField] ? 1 : 0;
          }
        });
      }
      
      // Apply pagination if provided
      const total = filteredData.length;
      
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options?.offset || 0;
        const limit = options?.limit || filteredData.length;
        
        filteredData = filteredData.slice(offset, offset + limit);
      }
      
      return {
        success: true,
        data: filteredData,
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.DATA_SOURCE,
        title: `Extract Error: Source #${sourceId}`,
        message: `Failed to extract data from source #${sourceId}: ${errorMessage}`,
        entityId: sourceId
      });
      
      return {
        success: false,
        error: errorMessage,
        data: []
      };
    }
  }
  
  /**
   * Load data into a destination
   */
  async load(destinationId: number, data: any[], options?: LoadOptions): Promise<LoadResult> {
    // This would normally fetch a data source from a repository
    // For now, we'll just use mock data
    
    try {
      // Mock load process
      // In a real app, we would fetch the data source by ID and then load data
      
      if (!options?.target) {
        throw new Error('Target is required for loading data');
      }
      
      // In a real app, we would actually load the data into the destination
      
      const count = data.length;
      
      // Mock successful load
      alertService.createAlert({
        type: AlertType.SUCCESS,
        severity: AlertSeverity.LOW,
        category: AlertCategory.DATA_SOURCE,
        title: `Load Success: Destination #${destinationId}`,
        message: `Successfully loaded ${count} records into ${options.target} in destination #${destinationId}`,
        entityId: destinationId
      });
      
      return {
        success: true,
        count,
        rejected: 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.DATA_SOURCE,
        title: `Load Error: Destination #${destinationId}`,
        message: `Failed to load data into destination #${destinationId}: ${errorMessage}`,
        entityId: destinationId
      });
      
      return {
        success: false,
        error: errorMessage,
        count: 0,
        rejected: data.length
      };
    }
  }
}

// Export singleton instance
export const dataConnector = new DataConnector();