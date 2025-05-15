/**
 * ETLTypes.ts
 * 
 * Type definitions for ETL (Extract, Transform, Load) operations
 */

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  SCHEDULED = 'scheduled',
  PAUSED = 'paused',
  ABORTED = 'aborted',
  IDLE = 'idle'
}

export enum SystemStatus {
  HEALTHY = 'healthy',
  ONLINE = 'online',
  OFFLINE = 'offline',
  DEGRADED = 'degraded',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
  STARTING = 'starting',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  UNKNOWN = 'unknown',
  RUNNING = 'running'
}

export enum JobFrequency {
  MANUAL = 'manual',
  ONCE = 'once',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum DataSourceType {
  DATABASE = 'database',
  API = 'api',
  FILE = 'file',
  FILE_CSV = 'file_csv',
  FILE_JSON = 'file_json',
  FILE_XML = 'file_xml',
  FILE_EXCEL = 'file_excel',
  FTP = 'ftp',
  MEMORY = 'memory',
  SQL_SERVER = 'sqlServer',
  ODBC = 'odbc',
  GEOSPATIAL = 'geospatial',
  SHAPEFILE = 'shapefile',
  POSTGIS = 'postgis',
  // Additional types
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  ORACLE = 'oracle',
  REST_API = 'restApi'
}

// Basic transformation types
export enum TransformationType {
  MAP = 'map',
  FILTER = 'filter',
  JOIN = 'join',
  AGGREGATE = 'aggregate',
  CUSTOM = 'custom',
  VALIDATE = 'validate',
  VALIDATION = 'validation',  // Alias for VALIDATE for better readability
  CLEANSE = 'cleanse',
  CLEAN = 'clean',           // Alias for CLEANSE
  TRANSFORM = 'transform',   // General transformation operation
  ENRICH = 'enrich',         // Data enrichment operation
  ENRICHMENT = 'enrichment',  // Alias for ENRICH for better readability
  NORMALIZE = 'normalize',
  DEDUPLICATE = 'deduplicate',
  SPLIT = 'split',
  MERGE = 'merge',
  TRANSFORM_DATE = 'transformDate',
  CONVERT_TYPE = 'convertType',
  CALCULATED_FIELD = 'calculatedField',
  
  // Include additional transformation types needed by components
  STANDARDIZE = 'standardize',
  GEOCODE = 'geocode',
  COORDINATE_TRANSFORM = 'coordinate_transform',
  TEXT_EXTRACTION = 'text_extraction',
  CLASSIFICATION = 'classification',
  OUTLIER_DETECTION = 'outlier_detection'
}

// Filter operators for data filtering operations
export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_OR_EQUALS = 'greaterThanOrEquals',
  LESS_THAN_OR_EQUALS = 'lessThanOrEquals',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  NOT_IN = 'notIn',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull',
  BETWEEN = 'between',
  NOT_BETWEEN = 'notBetween',
  REGEX = 'regex'
}

// Logical operators for combining filter conditions
export enum FilterLogic {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

// Alert category enumeration
export enum AlertCategory {
  IMPORT = 'import',
  EXPORT = 'export',
  DATA_QUALITY = 'data_quality',
  CONNECTION = 'connection',
  TRANSFORM = 'transform',
  SECURITY = 'security',
  VALIDATION = 'validation',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
  JOB = 'job',
  DATA_SOURCE = 'data_source',
  TRANSFORMATION = 'transformation'
}

// Alert severity levels
export enum AlertSeverity {
  LOW = 'low',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  MEDIUM = 'medium',
  ERROR = 'error',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Alert type enumeration
export enum AlertType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Alert interface
export interface Alert {
  id: string;
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  category: AlertCategory;
  severity: AlertSeverity;
  source: string;
  acknowledged: boolean;
  relatedEntityId?: string;
}

export interface SQLServerConnectionConfig {
  server: string;
  port: number;
  database: string;
  username: string;
  password: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
}

export interface ODBCConnectionConfig {
  connectionString: string;
  username: string;
  password: string;
}

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  getTableSchema(tableName: string): Promise<any>;
  getTableList(): Promise<string[]>;
  testConnection(): Promise<boolean>;
}

export interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: DataSourceType;
  config: Record<string, any>;
  lastSyncDate?: Date;
  enabled: boolean;
  status?: 'active' | 'inactive' | 'error' | 'pending'; // Connection status
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  connectionInfo?: {
    lastConnectionAttempt?: Date;
    lastConnectionSuccess?: Date;
    lastConnectionError?: string;
    connectionErrorCount?: number;
  };
}

export interface FilterConfig {
  conditions: {
    field: string;
    operator: FilterOperator;
    value: any;
  }[];
  logic: FilterLogic;
}

export interface MapConfig {
  mappings: {
    source: string;
    target: string;
  }[];
  includeOriginal: boolean;
}

export interface JoinConfig {
  rightDataset: string;
  joinType: 'inner' | 'left' | 'right' | 'full';
  conditions: {
    leftField: string;
    rightField: string;
  }[];
  includeFields: {
    dataset: 'left' | 'right';
    field: string;
    as?: string;
  }[];
}

export interface AggregateConfig {
  groupBy: string[];
  aggregations: {
    function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'FIRST' | 'LAST' | 'ARRAY_AGG';
    field: string;
    as: string;
  }[];
}

export interface ValidationConfig {
  validations: {
    field: string;
    type: 'REQUIRED' | 'EMAIL' | 'URL' | 'NUMBER' | 'INTEGER' | 'FLOAT' | 'DATE' | 'REGEX' | 'CUSTOM';
    params?: string;
    message: string;
  }[];
  failOnError: boolean;
}

export interface EnrichmentConfig {
  type: 'LOOKUP' | 'GEOCODE' | 'SENTIMENT' | 'CLASSIFY' | 'TRANSLATE' | 'CUSTOM';
  fields: {
    source: string;
    target: string;
  }[];
  options?: Record<string, any>;
}

export interface CustomConfig {
  code: string;
  language: 'javascript' | 'python' | 'sql';
  parameters?: Record<string, any>;
  function?: string;
}

export interface TransformationRule {
  id: string;
  name: string;
  description?: string;
  type: TransformationType;
  config: Record<string, any>;
  enabled: boolean;
}

export interface Transformation {
  id: string;
  name: string;
  description?: string;
  code: string;
  type?: TransformationType;
  config?: Record<string, any>;
  order?: number;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  enabled: boolean;
  tags?: string[];
}

export interface ETLJob {
  id: string;
  name: string;
  description?: string;
  // Support both single source and multiple sources
  source?: DataSource | string;
  sources?: Array<string>;
  transformations: Array<Transformation | string>;
  // Support both single destination and multiple destinations
  destination?: DataSource | string;
  destinations?: Array<string>;
  schedule?: {
    frequency: JobFrequency;
    startDate?: Date;
    endDate?: Date;
    cronExpression?: string;
    startTime?: string; // Time in HH:MM format
    daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  };
  settings?: {
    batchSize?: number;
    timeout?: number;
    maxRetries?: number;
    alertOnSuccess?: boolean;
    alertOnFailure?: boolean;
    validateData?: boolean;
    truncateDestination?: boolean;
    stopOnError?: boolean;  // Whether to stop on transformation errors
  };
  status?: JobStatus;       // Current job status
  enabled: boolean;
  tags?: string[];
  createdAt?: Date;        // Job creation timestamp
  updatedAt?: Date;        // Job last update timestamp
  lastRunId?: string;      // ID of the last job run
  lastRunDate?: Date;      // Date of the last job run
}

export interface JobLogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  data?: Record<string, any>;
}

export interface JobMetrics {
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  recordsSkipped: number;
  executionTimeMs: number;
  progress?: number;
}

export interface ETLJobRun {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date | null;
  status: JobStatus;
  error?: string | null;
  metrics: JobMetrics;
  executionTime?: number;  // Execution time in milliseconds (computed value)
  recordCounts?: {
    extracted: number;
    transformed: number;
    loaded: number;
    failed: number;
    rejected?: number;  // Additional field for rejected records
  };
  logs: JobLogEntry[];
}

export interface ETLError {
  phase: 'extract' | 'transform' | 'load' | 'validation';
  message: string;
  details: string;
  timestamp?: Date;
}

export interface ETLContext {
  job: ETLJob;
  jobRun: ETLJobRun;
  data: any[];
  errors: ETLError[];
  metadata: Record<string, any>;
  progress: number;
  updateProgress: (progress: number) => void;
}

export interface ETLJobResult {
  success: boolean;
  jobRunId?: string;
  message: string;
  metrics?: JobMetrics;
  warnings?: string[];
  details?: Record<string, any>;
}

export interface ETLMetrics {
  jobsCount: number;
  completedJobsCount: number;
  failedJobsCount: number;
  averageJobDuration: number;
  recordsProcessedTotal: number;
  recordsFailedTotal: number;
  lastJobCompletionDate?: Date;
  topFailingJobs: Array<{ jobId: string; jobName: string; failureCount: number }>;
  recentRuns: ETLJobRun[];
}

export interface SystemStatusInfo {
  status: SystemStatus;
  jobCount: number;
  enabledJobCount: number;
  dataSourceCount: number;
  enabledDataSourceCount: number;
  transformationRuleCount: number;
  enabledTransformationRuleCount: number;
  runningJobCount: number;
  schedulerStatus: SystemStatus;
  lastUpdated: Date;
  recentJobRuns: ETLJobRun[];
  successJobRuns: number;
  failedJobRuns: number;
  recordCounts: {
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
    extracted: number;
    transformed: number;
    loaded: number;
    rejected: number;
  };
}

export interface ExecutableETLJob {
  job: ETLJob;
  context: ETLContext;
}

// Extended TransformationType enum with additional transformation operations
export enum ExtendedTransformationType {
  // Column operations
  RENAME_COLUMN = 'rename_column',
  DROP_COLUMN = 'drop_column',
  REORDER_COLUMNS = 'reorder_columns',
  
  // Type conversions
  CAST_TYPE = 'cast_type',
  PARSE_DATE = 'parse_date',
  PARSE_NUMBER = 'parse_number',
  
  // Value operations
  REPLACE_VALUE = 'replace_value',
  FILL_NULL = 'fill_null',
  MAP_VALUES = 'map_values',
  
  // String operations
  TO_UPPERCASE = 'to_uppercase',
  TO_LOWERCASE = 'to_lowercase',
  TRIM = 'trim',
  SUBSTRING = 'substring',
  CONCAT = 'concat',
  SPLIT = 'split',
  
  // Numeric operations
  ROUND = 'round',
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  
  // Data transformation
  FILTER = 'filter',
  SORT = 'sort',
  GROUP_BY = 'group_by',
  AGGREGATE = 'aggregate',
  JOIN = 'join',
  UNION = 'union',
  MAP = 'map',
  
  // Data quality
  REMOVE_DUPLICATES = 'remove_duplicates',
  VALIDATE = 'validate',
  VALIDATION = 'validation',    // Alias for VALIDATE for better readability
  
  // Data enrichment
  ENRICH = 'enrich',
  ENRICHMENT = 'enrichment',    // Alias for ENRICH for better readability
  
  // Advanced
  CUSTOM = 'custom',
  CUSTOM_FUNCTION = 'custom_function',
  JAVASCRIPT = 'javascript',
  SQL = 'sql',
  FORMULA = 'formula',
  
  // Special categories for wizard-based flows
  CLEAN = 'clean',
  STANDARDIZE = 'standardize',
  NORMALIZE = 'normalize',
  GEOCODE = 'geocode',
  COORDINATE_TRANSFORM = 'coordinate_transform',
  PROPERTY_SPECIFIC = 'property_specific',
  TEXT_EXTRACTION = 'text_extraction',
  CLASSIFICATION = 'classification',
  OUTLIER_DETECTION = 'outlier_detection',
  ANOMALY_DETECTION = 'anomaly_detection',
  MISSING_VALUE_PREDICTION = 'missing_value_prediction'
}

// For backward compatibility
export const ExtendedFilterOperator = {
  ...FilterOperator,
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  IS_NULL: 'is_null',
  IS_NOT_NULL: 'is_not_null',
};

// Export all TransformationType values into the main enum
// This ensures compatibility with existing code
export const ExtendedTransformationTypes = {
  ...TransformationType,
  ...ExtendedTransformationType
};