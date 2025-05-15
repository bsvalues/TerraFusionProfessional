/**
 * ConnectionTestService.ts
 * 
 * Service for testing connections to various data sources
 */

import {
  DataSource,
  DataSourceType,
  ConnectionTestResult
} from './ETLTypes';
import { dataConnector } from './DataConnector';

class ConnectionTestService {
  /**
   * Test a connection to a data source
   */
  async testConnection(source: DataSource): Promise<ConnectionTestResult> {
    console.log(`Testing connection to ${source.type} source: ${source.name}`);
    
    const startTime = Date.now();
    
    try {
      // Try to establish a connection using the connector
      const connectionSuccess = await dataConnector.testConnection(source);
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      if (connectionSuccess) {
        return {
          success: true,
          message: `Successfully connected to ${source.name}`,
          details: {
            latency,
            connectionInfo: {
              type: source.type,
              name: source.name
            }
          },
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          message: `Failed to connect to ${source.name}`,
          details: {
            latency,
            error: 'Connection test failed'
          },
          timestamp: new Date()
        };
      }
    } catch (error) {
      const endTime = Date.now();
      
      return {
        success: false,
        message: `Error connecting to ${source.name}`,
        details: {
          latency: endTime - startTime,
          error: error instanceof Error ? error.message : String(error)
        },
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Batch test multiple connections
   */
  async batchTestConnections(sources: DataSource[]): Promise<Map<number, ConnectionTestResult>> {
    console.log(`Batch testing ${sources.length} connections`);
    
    const results = new Map<number, ConnectionTestResult>();
    
    // Test each connection sequentially
    // This could be parallelized, but sequential is safer for resources
    for (const source of sources) {
      results.set(source.id, await this.testConnection(source));
    }
    
    return results;
  }
  
  /**
   * Test an extraction query or configuration
   */
  async testExtraction(source: DataSource): Promise<ConnectionTestResult> {
    console.log(`Testing extraction from ${source.type} source: ${source.name}`);
    
    const startTime = Date.now();
    
    try {
      // First test the connection
      const connectionTest = await this.testConnection(source);
      
      if (!connectionTest.success) {
        return connectionTest;
      }
      
      // Get a connection
      const connection = await dataConnector.getConnection(source);
      
      // Try to extract a small sample (limit the query)
      const limitedSource = { ...source };
      
      // Add a limit to the extraction if possible
      if (limitedSource.extraction) {
        limitedSource.extraction = { 
          ...limitedSource.extraction,
          limit: 5 // Just get a few records for testing
        };
      }
      
      // Extract data
      let data;
      try {
        data = await dataConnector.extractData(connection, limitedSource);
      } catch (error) {
        const endTime = Date.now();
        
        return {
          success: false,
          message: `Extraction query failed for ${source.name}`,
          details: {
            latency: endTime - startTime,
            error: error instanceof Error ? error.message : String(error)
          },
          timestamp: new Date()
        };
      }
      
      const endTime = Date.now();
      
      // Test was successful
      return {
        success: true,
        message: `Successfully extracted ${data.length} records from ${source.name}`,
        details: {
          latency: endTime - startTime,
          connectionInfo: {
            type: source.type,
            recordCount: data.length,
            sampleData: data.slice(0, 2) // Include first two records as sample
          }
        },
        timestamp: new Date()
      };
    } catch (error) {
      const endTime = Date.now();
      
      return {
        success: false,
        message: `Error testing extraction from ${source.name}`,
        details: {
          latency: endTime - startTime,
          error: error instanceof Error ? error.message : String(error)
        },
        timestamp: new Date()
      };
    }
  }
}

// Export a singleton instance
export const connectionTestService = new ConnectionTestService();