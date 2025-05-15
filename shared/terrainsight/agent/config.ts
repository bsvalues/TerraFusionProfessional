/**
 * Agent System Configuration
 * 
 * This file defines the configuration structure for the agent system.
 * It includes settings for message broker, replay buffer, training parameters,
 * and agent-specific configurations.
 */

/**
 * Message broker configuration
 */
export interface MessageBrokerConfig {
  /** Type of message broker to use */
  type: 'in-memory' | 'redis' | 'kafka' | 'mqtt';
  
  /** Connection endpoint (if applicable) */
  endpoint?: string;
  
  /** Authentication credentials (if applicable) */
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
  
  /** Topics configuration */
  topics?: {
    /** Default topic for broadcast messages */
    broadcast: string;
    
    /** Topic for system events */
    system: string;
    
    /** Topic for errors */
    errors: string;
    
    /** Agent-specific topics */
    agents: Record<string, string>;
  };
  
  /** Security settings */
  security?: {
    /** Whether to use TLS/SSL */
    useTls: boolean;
    
    /** Whether to verify server certificates */
    verifyCertificates: boolean;
    
    /** Whether to use client certificates */
    useClientCerts: boolean;
    
    /** Path to client certificate file (if applicable) */
    clientCertPath?: string;
    
    /** Path to client key file (if applicable) */
    clientKeyPath?: string;
  };
}

/**
 * Replay buffer configuration
 */
export interface ReplayBufferConfig {
  /** Type of storage for the replay buffer */
  type: 'in-memory' | 'redis' | 'database' | 'file';
  
  /** Maximum capacity of the buffer */
  maxSize: number;
  
  /** Minimum priority threshold for important experiences */
  priorityThreshold: number;
  
  /** Whether to use prioritized experience sampling */
  usePrioritizedSampling: boolean;
  
  /** Whether to persist experiences to storage */
  persistExperiences: boolean;
  
  /** Path to file storage (if applicable) */
  filePath?: string;
  
  /** Database connection details (if applicable) */
  database?: {
    /** Connection string */
    url: string;
    
    /** Table name */
    table: string;
  };
  
  /** Experience retention period in days (0 = indefinite) */
  retentionDays: number;
}

/**
 * Training configuration
 */
export interface TrainingConfig {
  /** How training is triggered */
  triggerType: 'buffer-size' | 'time-interval' | 'manual';
  
  /** Threshold for buffer-size trigger */
  bufferSizeThreshold?: number;
  
  /** Interval for time-interval trigger (in milliseconds) */
  intervalMs?: number;
  
  /** Batch size for training */
  batchSize: number;
  
  /** Whether to automatically apply training results */
  autoApply: boolean;
}

/**
 * Agent-specific configuration
 */
export interface AgentConfig {
  /** Agent identifier */
  id: string;
  
  /** Human-readable agent name */
  name: string;
  
  /** Agent capabilities */
  capabilities: string[];
  
  /** Whether the agent is enabled */
  enabled: boolean;
  
  /** Path to agent-specific configuration files (if applicable) */
  configPath?: string;
  
  /** Performance thresholds for triggering help requests */
  performanceThresholds?: {
    /** Maximum acceptable error rate (0-1) */
    maxErrorRate?: number;
    
    /** Maximum acceptable average processing time (ms) */
    maxAvgProcessingTime?: number;
    
    /** Maximum number of consecutive failures before requesting help */
    maxConsecutiveFailures?: number;
  };
  
  /** Custom agent settings */
  settings?: Record<string, any>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  
  /** Whether to log to console */
  console: boolean;
  
  /** Whether to log to file */
  file: boolean;
  
  /** Path to log file (if applicable) */
  filePath?: string;
  
  /** Whether to log to a remote service */
  remote?: boolean;
  
  /** Remote logging service details (if applicable) */
  remoteService?: {
    /** Type of remote service */
    type: 'elasticsearch' | 'datadog' | 'custom';
    
    /** Endpoint URL */
    url: string;
    
    /** API key or token */
    apiKey?: string;
  };
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  /** Whether the dashboard is enabled */
  enabled: boolean;
  
  /** Dashboard port */
  port: number;
  
  /** Dashboard host */
  host: string;
  
  /** Authentication settings */
  auth?: {
    /** Whether authentication is required */
    required: boolean;
    
    /** Username */
    username?: string;
    
    /** Password */
    password?: string;
  };
  
  /** Refresh interval in milliseconds */
  refreshIntervalMs: number;
}

/**
 * Complete agent system configuration
 */
export interface AgentSystemConfig {
  /** System name */
  systemName: string;
  
  /** System version */
  version: string;
  
  /** Environment (development, staging, production) */
  environment: 'development' | 'staging' | 'production';
  
  /** Message broker configuration */
  messageBroker: MessageBrokerConfig;
  
  /** Replay buffer configuration */
  replayBuffer: ReplayBufferConfig;
  
  /** Training configuration */
  training: TrainingConfig;
  
  /** Agents configuration */
  agents: AgentConfig[];
  
  /** Logger configuration */
  logger: LoggerConfig;
  
  /** Dashboard configuration */
  dashboard: DashboardConfig;
  
  /** Security settings */
  security?: {
    /** Whether to encrypt sensitive data */
    encryptSensitiveData: boolean;
    
    /** Key for encryption (if applicable) */
    encryptionKey?: string;
  };
}

/**
 * Default configuration for development environment
 */
export const defaultConfig: AgentSystemConfig = {
  systemName: 'Spatialest Agent System',
  version: '1.0.0',
  environment: 'development',
  
  messageBroker: {
    type: 'in-memory'
  },
  
  replayBuffer: {
    type: 'in-memory',
    maxSize: 10000,
    priorityThreshold: 0.7,
    usePrioritizedSampling: true,
    persistExperiences: false,
    retentionDays: 30
  },
  
  training: {
    triggerType: 'buffer-size',
    bufferSizeThreshold: 1000,
    batchSize: 100,
    autoApply: false
  },
  
  agents: [
    // Leadership Hierarchy Agents
    {
      id: 'architect-prime',
      name: 'Architect Prime',
      capabilities: [
        'system_architecture',
        'vision_maintenance',
        'architectural_decision_making',
        'system_integrity_validation',
        'cross_component_dependency_management'
      ],
      enabled: true,
      performanceThresholds: {
        maxErrorRate: 0.02,
        maxAvgProcessingTime: 3000,
        maxConsecutiveFailures: 1
      }
    },
    {
      id: 'integration-coordinator',
      name: 'Integration Coordinator',
      capabilities: [
        'api_contract_management',
        'integration_checkpoint_management',
        'cross_component_dependency_tracking',
        'integration_validation',
        'component_synchronization'
      ],
      enabled: true,
      performanceThresholds: {
        maxErrorRate: 0.05,
        maxAvgProcessingTime: 4000,
        maxConsecutiveFailures: 2
      }
    },
    {
      id: 'bsbcmaster-lead',
      name: 'BSBCmaster Lead',
      capabilities: [
        'component_management',
        'authentication_management',
        'user_management',
        'permission_control',
        'data_foundation',
        'service_discovery'
      ],
      enabled: true,
      performanceThresholds: {
        maxErrorRate: 0.05,
        maxAvgProcessingTime: 5000,
        maxConsecutiveFailures: 2
      }
    },
    
    // Specialized Domain Agents
    {
      id: 'data-validation-agent',
      name: 'Data Validation Agent',
      capabilities: ['property:validation', 'data:validation'],
      enabled: true,
      performanceThresholds: {
        maxErrorRate: 0.1,
        maxAvgProcessingTime: 5000,
        maxConsecutiveFailures: 3
      }
    },
    {
      id: 'legal-compliance-agent',
      name: 'Legal Compliance Agent',
      capabilities: ['compliance:check', 'regulation:validation'],
      enabled: true,
      performanceThresholds: {
        maxErrorRate: 0.05,
        maxConsecutiveFailures: 2
      }
    },
    {
      id: 'valuation-agent',
      name: 'Valuation Agent',
      capabilities: ['property:valuation', 'market:analysis'],
      enabled: true,
      performanceThresholds: {
        maxErrorRate: 0.1,
        maxAvgProcessingTime: 10000
      }
    },
    {
      id: 'workflow-agent',
      name: 'Workflow Agent',
      capabilities: ['workflow:orchestration', 'task:delegation'],
      enabled: true,
      performanceThresholds: {
        maxErrorRate: 0.05,
        maxConsecutiveFailures: 3
      }
    },
    
    // Development Agents
    {
      id: 'god-tier-builder',
      name: 'God Tier Builder',
      capabilities: [
        'model_creation',
        'parameter_optimization',
        'feature_selection',
        'code_generation',
        'feature_implementation',
        'bug_fixing',
        'refactoring'
      ],
      enabled: true,
      performanceThresholds: {
        maxErrorRate: 0.08,
        maxAvgProcessingTime: 8000,
        maxConsecutiveFailures: 2
      }
    },
    {
      id: 'tdd-validator',
      name: 'TDD Validator',
      capabilities: [
        'model_testing',
        'regression_testing',
        'validation_reporting',
        'code_verification',
        'test_generation',
        'code_quality_analysis'
      ],
      enabled: true,
      performanceThresholds: {
        maxErrorRate: 0.05,
        maxAvgProcessingTime: 6000,
        maxConsecutiveFailures: 2
      }
    }
  ],
  
  logger: {
    level: 'info',
    console: true,
    file: false
  },
  
  dashboard: {
    enabled: false,
    port: 8080,
    host: '0.0.0.0',
    refreshIntervalMs: 5000
  }
};

/**
 * Configuration for production environment
 */
export const productionConfig: AgentSystemConfig = {
  ...defaultConfig,
  environment: 'production',
  
  replayBuffer: {
    ...defaultConfig.replayBuffer,
    type: 'database',
    persistExperiences: true,
    database: {
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/spatialest',
      table: 'agent_experiences'
    }
  },
  
  logger: {
    level: 'warn',
    console: true,
    file: true,
    filePath: './logs/agent-system.log'
  },
  
  dashboard: {
    ...defaultConfig.dashboard,
    enabled: true,
    auth: {
      required: true,
      username: process.env.DASHBOARD_USERNAME || 'admin',
      password: process.env.DASHBOARD_PASSWORD || 'password'
    }
  },
  
  security: {
    encryptSensitiveData: true,
    encryptionKey: process.env.ENCRYPTION_KEY
  }
};

/**
 * Get the appropriate configuration based on environment
 */
export function getConfig(): AgentSystemConfig {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return productionConfig;
  }
  
  return defaultConfig;
}

/**
 * Current system configuration
 */
export const config = getConfig();