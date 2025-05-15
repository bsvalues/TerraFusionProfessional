/**
 * ETL Module Index
 * 
 * This file exports all ETL-related types, interfaces, and services
 * to provide a clean import interface for consumers.
 */

// Export all types
export * from './ETLTypes';

// Export services as named exports
export { default as fieldMappingService } from './FieldMappingService';
export { jobExecutionService } from './JobExecutionService';
export { alertService } from './AlertService';
export { etlPipelineManager } from './ETLPipelineManager';

// Initialize function
export function initializeETL(): void {
  console.log('Initializing ETL subsystem...');
  // In a real implementation, this would initialize all ETL services,
  // connect to data sources, and restore state from persistence
}

// Type aliases for backward compatibility
export type TransformationRule = import('./ETLTypes').Transformation;
export type JobRun = import('./ETLTypes').ETLJobRun;
export type SystemStatus = import('./ETLTypes').SystemStatusInfo;
export type Alert = {
  id: string;
  severity: import('./AlertService').AlertSeverity;
  message: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  details?: string;
  category: import('./AlertService').AlertCategory;
  relatedEntityId?: string;
  title: string;
};

// Import enums directly
import { DataSourceType as DSType, JobStatus as JStatus, SystemStatus as SStatus } from './ETLTypes';

// Define DataSourceType constants for backward compatibility
export const DataSourceType = {
  ...DSType,
  POSTGRESQL: 'postgresql' as DSType,
  MYSQL: 'mysql' as DSType,
  ORACLE: 'oracle' as DSType,
  SQL_SERVER: 'sqlServer' as DSType,
  ODBC: 'odbc' as DSType,
  REST_API: 'restApi' as DSType,
  FILE_CSV: 'fileCsv' as DSType,
  FILE_JSON: 'fileJson' as DSType,
  MEMORY: 'memory' as DSType,
};

// Add SUCCEEDED and FAILED job status constants for backward compatibility
export const JobStatus = {
  ...JStatus,
  SUCCEEDED: 'success' as JStatus,
  FAILED: 'error' as JStatus,
  CANCELED: 'cancelled' as JStatus, // Alias for CANCELLED for backward compatibility
};

// Export system status enum
export const SystemStatus = {
  ...SStatus,
};