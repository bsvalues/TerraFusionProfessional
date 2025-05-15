/**
 * Agent Framework Type Definitions
 * 
 * This file contains the core type definitions for the multi-agent architecture
 * that powers the Benton County Assessor's Office platform.
 */

/**
 * Agent capability type identifying what an agent can do
 */
export enum AgentCapability {
  // Core capabilities
  COMMUNICATION = 'communication',
  COORDINATION = 'coordination',
  EXECUTION = 'execution',
  MONITORING = 'monitoring',
  
  // Domain-specific capabilities
  PROPERTY_VALIDATION = 'property_validation',
  LEGAL_COMPLIANCE = 'legal_compliance',
  VALUATION = 'valuation',
  SPATIAL_ANALYSIS = 'spatial_analysis',
  
  // Data capabilities
  DATA_VALIDATION = 'data_validation',
  DATA_TRANSFORMATION = 'data_transformation',
  DATA_ORCHESTRATION = 'data_orchestration', 
  PIPELINE_MANAGEMENT = 'pipeline_management',
  SCHEMA_VALIDATION = 'schema_validation',
  DATA_LINEAGE_TRACKING = 'data_lineage_tracking',
  
  // Development capabilities
  MODEL_CREATION = 'model_creation',
  PARAMETER_OPTIMIZATION = 'parameter_optimization',
  FEATURE_SELECTION = 'feature_selection',
  CODE_GENERATION = 'code_generation',
  FEATURE_IMPLEMENTATION = 'feature_implementation',
  BUG_FIXING = 'bug_fixing',
  REFACTORING = 'refactoring',
  MODEL_TESTING = 'model_testing',
  REGRESSION_TESTING = 'regression_testing',
  VALIDATION_REPORTING = 'validation_reporting',
  CODE_VERIFICATION = 'code_verification',
  TEST_GENERATION = 'test_generation',
  CODE_QUALITY_ANALYSIS = 'code_quality_analysis'
}

/**
 * Message type for inter-agent communication
 */
export type MessageType = 
  | 'request' 
  | 'response' 
  | 'notification' 
  | 'error' 
  | 'broadcast'
  | 'query';

/**
 * Priority level for inter-agent messages
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Agent context containing information about the current execution environment
 */
export interface AgentContext {
  /** Unique execution ID */
  executionId: string;
  
  /** Current workflow ID if part of a workflow */
  workflowId?: string;
  
  /** Execution timestamp */
  timestamp: Date;
  
  /** Execution parameters */
  parameters: Record<string, any>;
  
  /** User ID if initiated by a user */
  userId?: string;
  
  /** Correlation ID for tracking related operations */
  correlationId?: string;
  
  /** Access level for the execution */
  accessLevel: 'user' | 'admin' | 'system';
  
  /** Parent context if this is a sub-operation */
  parentContext?: AgentContext;
  
  /** Logging function for the agent to use */
  log: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void;
}

/**
 * Agent response status
 */
export type AgentResponseStatus = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'blockedByCompliance' 
  | 'needsHumanReview' 
  | 'partialSuccess' 
  | 'pending';

/**
 * Standard response format from agents
 */
export interface AgentResponse {
  /** Response status */
  status: AgentResponseStatus;
  
  /** Response data */
  data: any;
  
  /** Explanation of the response */
  explanation?: string;
  
  /** Message (for backward compatibility) */
  message?: string;
  
  /** Recommendations for next steps */
  recommendations?: string[];
  
  /** References to compliance requirements (for legal compliance responses) */
  legalReferences?: string[];
  
  /** Metrics about the operation */
  metrics?: {
    executionTimeMs: number;
    resourceUsage?: Record<string, number>;
    [key: string]: any;
  };
  
  /** Any issues encountered */
  issues?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details?: any;
  }>;
}

/**
 * Validation result for agent input
 */
export interface ValidationResult {
  /** Whether the input is valid */
  isValid: boolean;
  
  /** Any validation issues */
  issues: ValidationIssue[];
  
  /** The validated data (potentially transformed) */
  validatedData?: any;
}

/**
 * Validation issue details
 */
export interface ValidationIssue {
  /** Field with the issue */
  field: string;
  
  /** Issue type */
  type: string;
  
  /** Issue description */
  description: string;
  
  /** Issue severity */
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  /** Remediation suggestion */
  remediation?: string;
}

/**
 * Agent workflow definition
 */
export interface AgentWorkflow {
  /** Unique workflow ID */
  id: string;
  
  /** Workflow name */
  name: string;
  
  /** Workflow description */
  description: string;
  
  /** Whether this workflow is enabled */
  isEnabled: boolean;
  
  /** Workflow steps */
  steps: AgentWorkflowStep[];
  
  /** Workflow parameters */
  parameters: Record<string, any>;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Agent workflow step
 */
export interface AgentWorkflowStep {
  /** Step ID */
  id: string;
  
  /** Agent ID to execute */
  agentId: string;
  
  /** Input mapping */
  inputMapping: Record<string, string>;
  
  /** Output mapping */
  outputMapping: Record<string, string>;
  
  /** Condition for executing this step */
  condition?: string;
  
  /** Whether to continue on error */
  continueOnError: boolean;
  
  /** Timeout in milliseconds */
  timeoutMs?: number;
  
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Agent workflow execution result
 */
export interface WorkflowResult {
  /** Workflow ID */
  workflowId: string;
  
  /** Execution ID */
  executionId: string;
  
  /** Execution status */
  status: 'success' | 'error' | 'partial_success' | 'cancelled';
  
  /** Step results */
  stepResults: Record<string, AgentResponse>;
  
  /** Output data */
  output: any;
  
  /** Execution start time */
  startTime: Date;
  
  /** Execution end time */
  endTime: Date;
  
  /** Any errors encountered */
  errors?: any[];
}

/**
 * Washington State specific property rules
 */
export interface WashingtonPropertyRules {
  /** Parcel ID format by county */
  parcelIdFormats: Record<string, string>;
  
  /** Valid property types */
  validPropertyTypes: string[];
  
  /** Valid zoning codes */
  validZoningCodes: string[];
  
  /** Required fields for different property types */
  requiredFields: Record<string, string[]>;
  
  /** Value range constraints */
  valueRanges: Record<string, {min: number, max: number}>;
}

/**
 * Agent tiers in the leadership hierarchy
 */
export enum AgentTier {
  STRATEGIC_LEADERSHIP = 'strategic_leadership',  // Architect Prime
  TACTICAL_LEADERSHIP = 'tactical_leadership',    // Integration Coordinator
  COMPONENT_LEADERSHIP = 'component_leadership',  // Component Leads (BSBCmaster Lead, etc.)
  SPECIALIST = 'specialist',                      // Domain-specific agents
  SYSTEM = 'system'                               // System-level agents
}

/**
 * Message event types for the standardized communication protocol
 */
export enum EventType {
  COMMAND = 'COMMAND',                 // Directs an agent to perform an action
  EVENT = 'EVENT',                     // Notifies about something that happened
  QUERY = 'QUERY',                     // Requests information
  RESPONSE = 'RESPONSE',               // Replies to a query or command
  ERROR = 'ERROR',                     // Reports an error condition
  STATUS_UPDATE = 'STATUS_UPDATE',     // Provides agent status information
  
  // Data orchestration event types
  DATA_QUERY = 'data_query',                  // Request to retrieve data
  DATA_TRANSFORM = 'data_transform',          // Request to transform data
  DATA_PIPELINE_EXECUTE = 'data_pipeline_execute',  // Request to execute a data pipeline
  DATA_SOURCE_REGISTER = 'register_data_source',    // Register a new data source
  DATA_SCHEMA_REGISTER = 'register_data_schema',    // Register a new data schema
  DATA_FLOW_STATUS = 'data_flow_status'       // Status update about data flow
}

/**
 * Message event types (legacy - kept for backward compatibility)
 */
export type MessageEventType = 
  | 'COMMAND'         
  | 'EVENT'           
  | 'QUERY'           
  | 'RESPONSE'        
  | 'ERROR'           
  | 'STATUS_UPDATE'
  | 'data_query'
  | 'data_transform'
  | 'data_pipeline_execute'
  | 'register_data_source'
  | 'register_data_schema'
  | 'data_flow_status';

/**
 * Inter-agent message for communication between agents
 * Following the standardized message format from the communication protocol
 */
export interface AgentMessage {
  /** Unique message ID */
  id: string;
  
  /** Correlation ID to track a specific task or workflow */
  correlationId: string;
  
  /** Conversation ID to group related messages (backward compatibility) */
  conversationId?: string;
  
  /** Message type (backward compatibility) */
  type: MessageType;
  
  /** Event type following the standardized protocol */
  eventType: MessageEventType;
  
  /** Sender agent ID */
  senderId: string;
  
  /** Recipient agent ID (or 'all' for broadcast) */
  recipientId: string | 'all';
  
  /** Message priority */
  priority: MessagePriority;
  
  /** Message content */
  content: any;
  
  /** Timestamp when message was created */
  timestamp: string;
  
  /** Message metadata */
  metadata: {
    /** Time-to-live in seconds (0 = indefinite) */
    ttl?: number;
    
    /** Message expiration time (absolute timestamp) */
    expiresAt?: Date;
    
    /** Whether this message requires acknowledgment */
    requiresAcknowledgment?: boolean;
    
    /** Whether this message has been acknowledged */
    acknowledged?: boolean;
    
    /** Reference to another message (for replies) */
    inReplyTo?: string;
    
    /** Domain-specific context information */
    context?: Record<string, any>;
    
    /** User ID if message initiated by a user action */
    userId?: string;
    
    /** Tags for message categorization */
    tags?: string[];
    
    /** Debug information (development only) */
    debug?: Record<string, any>;
    
    /** Message creation timestamp */
    timestamp?: Date;
    
    /** Leadership tier of the sending agent */
    senderTier?: AgentTier;
    
    /** Leadership tier of the recipient agent */
    recipientTier?: AgentTier;
    
    /** Chain of command verification - ensures messages respect hierarchy */
    chainOfCommandValid?: boolean;
    
    /** Component this message relates to (e.g., BSBCmaster, BCBSGISPRO) */
    relatedComponent?: string;
    
    /** Integration checkpoint information */
    integrationCheckpoint?: {
      /** Checkpoint name */
      name: string;
      
      /** Checkpoint status */
      status: 'pending' | 'passed' | 'failed';
      
      /** Checkpoint details */
      details?: Record<string, any>;
    };
  };
}

/**
 * Handler for agent message subscription
 */
export type MessageHandler = (message: AgentMessage) => Promise<void>;

/**
 * Filter for agent message subscription
 */
export interface MessageFilter {
  /** Sender agent ID to filter for */
  senderId?: string;
  
  /** Message types to filter for (legacy) */
  types?: MessageType[];
  
  /** Event types to filter for */
  eventTypes?: MessageEventType[];
  
  /** Minimum priority level */
  minPriority?: MessagePriority;
  
  /** Only messages for a specific conversation */
  conversationId?: string;
  
  /** Only messages for a specific correlation */
  correlationId?: string;
  
  /** Filter by content action if present */
  contentAction?: string;
  
  /** Filter by metadata tags */
  tags?: string[];
  
  /** Filter by user ID */
  userId?: string;
  
  /** Filter by sender's leadership tier */
  senderTier?: AgentTier;
  
  /** Filter by recipient's leadership tier */
  recipientTier?: AgentTier;
  
  /** Filter by chain of command validity */
  chainOfCommandValid?: boolean;
  
  /** Filter by related component */
  relatedComponent?: string;
  
  /** Filter by integration checkpoint status */
  integrationCheckpointStatus?: 'pending' | 'passed' | 'failed';
}

/**
 * Agent Code Generation Request
 */
export interface AgentCodeGenerationRequest {
  /** Operation type */
  operation: 'generate_code';
  
  /** Request data */
  data: {
    /** Implementation plan with tasks and requirements */
    implementationPlan: any;
    
    /** Design specifications for the feature */
    designSpec: any;
    
    /** Context from the existing codebase */
    codebaseContext: any;
  };
}