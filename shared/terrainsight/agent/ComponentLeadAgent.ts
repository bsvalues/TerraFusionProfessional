/**
 * Component Lead Agent
 * 
 * Base class for all component lead agents, which are responsible for
 * managing and coordinating specific system components. Each component
 * lead specializes in a particular domain (geospatial, valuation, etc.)
 * and oversees the work of specialist agents in that domain.
 */

import { Agent } from './Agent';
import { 
  AgentContext, 
  AgentResponse, 
  ValidationResult, 
  ValidationIssue,
  AgentMessage
} from './types';
import { EventSeverity, eventLogger } from './EventLogger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Component status
 */
export enum ComponentStatus {
  /** Component is initializing */
  INITIALIZING = 'initializing',
  
  /** Component is operational */
  OPERATIONAL = 'operational',
  
  /** Component is degraded but functioning */
  DEGRADED = 'degraded',
  
  /** Component is in maintenance mode */
  MAINTENANCE = 'maintenance',
  
  /** Component has errors */
  ERROR = 'error',
  
  /** Component is offline */
  OFFLINE = 'offline'
}

/**
 * Component health metrics
 */
export interface ComponentHealthMetrics {
  /** Component uptime in seconds */
  uptimeSeconds: number;
  
  /** Error rate (0-1) */
  errorRate: number;
  
  /** Average response time in milliseconds */
  avgResponseTimeMs: number;
  
  /** Number of requests processed */
  requestsProcessed: number;
  
  /** Timestamp of last status update */
  lastUpdateTime: string;
  
  /** Latest health check result */
  healthCheckResult: 'passed' | 'failed';
  
  /** Memory usage (if applicable) */
  memoryUsage?: {
    /** Used memory in bytes */
    used: number;
    
    /** Total memory in bytes */
    total: number;
    
    /** Used percentage */
    percentage: number;
  };
  
  /** CPU usage percentage */
  cpuUsage?: number;
}

/**
 * Component issue
 */
export interface ComponentIssue {
  /** Issue ID */
  id: string;
  
  /** Issue description */
  description: string;
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Is the issue resolved */
  resolved: boolean;
  
  /** When the issue was identified */
  identifiedAt: string;
  
  /** When the issue was resolved (if applicable) */
  resolvedAt?: string;
  
  /** Tags for categorization */
  tags: string[];
}

/**
 * Component specification
 */
export interface ComponentSpecification {
  /** Component ID */
  id: string;
  
  /** Component version */
  version: string;
  
  /** Component description */
  description: string;
  
  /** Capabilities provided by this component */
  capabilities: string[];
  
  /** API endpoints exposed by this component */
  apiEndpoints: Array<{
    /** Path of the endpoint */
    path: string;
    
    /** HTTP method */
    method: string;
    
    /** Description of the endpoint */
    description: string;
  }>;
  
  /** Dependencies on other components */
  dependencies: string[];
  
  /** Technical details */
  technicalDetails?: {
    /** Technology stack */
    stack: string[];
    
    /** Repository location */
    repository?: string;
    
    /** Documentation links */
    documentationLinks?: string[];
  };
}

/**
 * Base Component Lead Agent implementation
 */
export abstract class ComponentLeadAgent extends Agent {
  /** Component ID */
  protected componentId: string;
  
  /** Component version */
  protected version: string = '1.0.0';
  
  /** Component status */
  protected status: ComponentStatus = ComponentStatus.INITIALIZING;
  
  /** Component specification */
  protected specification: ComponentSpecification;
  
  /** Health metrics */
  protected healthMetrics: ComponentHealthMetrics;
  
  /** Active issues */
  protected issues: ComponentIssue[] = [];
  
  /** Resolved issues */
  protected resolvedIssues: ComponentIssue[] = [];
  
  /** Specialist agents managed by this lead */
  protected specialistAgents: string[] = [];
  
  /** Start time */
  private startTime: Date;
  
  /** Health check interval handle */
  private healthCheckInterval?: NodeJS.Timeout;
  
  /**
   * Initialize a new Component Lead Agent
   * 
   * @param componentId The component ID
   * @param agentId The agent ID
   * @param name The agent name
   */
  constructor(componentId: string, agentId: string, name: string) {
    super(agentId, name);
    
    this.componentId = componentId;
    this.startTime = new Date();
    
    // Initialize base specification
    this.specification = {
      id: componentId,
      version: this.version,
      description: `${name} component`,
      capabilities: [],
      apiEndpoints: [],
      dependencies: []
    };
    
    // Initialize health metrics
    this.healthMetrics = {
      uptimeSeconds: 0,
      errorRate: 0,
      avgResponseTimeMs: 0,
      requestsProcessed: 0,
      lastUpdateTime: new Date().toISOString(),
      healthCheckResult: 'passed'
    };
    
    // Register base capabilities
    this.capabilities = [
      'component_management',
      'health_monitoring',
      'issue_tracking',
      'specialist_coordination'
    ];
  }
  
  /**
   * Initialize the Component Lead Agent
   */
  async initialize(): Promise<boolean> {
    try {
      // Call base initialization
      const baseInitialized = await super.initialize();
      
      if (!baseInitialized) {
        return false;
      }
      
      // Start health checks
      this.startHealthChecks();
      
      // Set status to operational
      this.status = ComponentStatus.OPERATIONAL;
      
      return true;
    } catch (error) {
      eventLogger.logError(
        this.id,
        'Initialization error',
        `Error initializing Component Lead: ${error instanceof Error ? error.message : String(error)}`,
        error,
        EventSeverity.ERROR
      );
      
      this.status = ComponentStatus.ERROR;
      
      return false;
    }
  }
  
  /**
   * Process a request to the Component Lead Agent
   * 
   * @param context Context for the agent request
   * @returns Agent response
   */
  async process(context: AgentContext): Promise<AgentResponse> {
    try {
      const { action, data } = context.input;
      
      // Process based on action
      switch (action) {
        case 'get_component_status':
          return {
            success: true,
            result: {
              componentId: this.componentId,
              status: this.status,
              version: this.version,
              healthMetrics: this.healthMetrics
            }
          };
          
        case 'get_component_specification':
          return {
            success: true,
            result: {
              specification: this.specification
            }
          };
          
        case 'update_component_specification':
          if (!data.specification) {
            return {
              success: false,
              error: 'Specification is required'
            };
          }
          
          // Update specification, but preserve the component ID
          const updatedSpec = {
            ...data.specification,
            id: this.componentId
          };
          
          this.specification = updatedSpec;
          
          return {
            success: true,
            result: {
              message: 'Component specification updated successfully',
              specification: this.specification
            }
          };
          
        case 'get_active_issues':
          return {
            success: true,
            result: {
              issues: this.issues
            }
          };
          
        case 'get_resolved_issues':
          return {
            success: true,
            result: {
              issues: this.resolvedIssues
            }
          };
          
        case 'report_issue':
          if (!data.description || !data.severity) {
            return {
              success: false,
              error: 'Issue description and severity are required'
            };
          }
          
          const issue: ComponentIssue = {
            id: `issue_${uuidv4()}`,
            description: data.description,
            severity: data.severity,
            resolved: false,
            identifiedAt: new Date().toISOString(),
            tags: data.tags || []
          };
          
          this.issues.push(issue);
          
          // Broadcast the issue to integration coordinator
          await this.notifyIssue(issue);
          
          return {
            success: true,
            result: {
              message: 'Issue reported successfully',
              issue
            }
          };
          
        case 'resolve_issue':
          if (!data.issueId) {
            return {
              success: false,
              error: 'Issue ID is required'
            };
          }
          
          const issueIndex = this.issues.findIndex(i => i.id === data.issueId);
          
          if (issueIndex === -1) {
            return {
              success: false,
              error: `Issue with ID '${data.issueId}' not found`
            };
          }
          
          const resolvedIssue = this.issues[issueIndex];
          resolvedIssue.resolved = true;
          resolvedIssue.resolvedAt = new Date().toISOString();
          
          // Move to resolved issues
          this.resolvedIssues.push(resolvedIssue);
          this.issues.splice(issueIndex, 1);
          
          return {
            success: true,
            result: {
              message: 'Issue resolved successfully',
              issue: resolvedIssue
            }
          };
          
        case 'get_specialist_agents':
          return {
            success: true,
            result: {
              specialistAgents: this.specialistAgents
            }
          };
          
        case 'register_specialist_agent':
          if (!data.agentId) {
            return {
              success: false,
              error: 'Agent ID is required'
            };
          }
          
          if (!this.specialistAgents.includes(data.agentId)) {
            this.specialistAgents.push(data.agentId);
          }
          
          return {
            success: true,
            result: {
              message: `Specialist agent '${data.agentId}' registered successfully`,
              specialistAgents: this.specialistAgents
            }
          };
          
        case 'unregister_specialist_agent':
          if (!data.agentId) {
            return {
              success: false,
              error: 'Agent ID is required'
            };
          }
          
          const agentIndex = this.specialistAgents.indexOf(data.agentId);
          
          if (agentIndex === -1) {
            return {
              success: false,
              error: `Specialist agent '${data.agentId}' not registered with this component`
            };
          }
          
          this.specialistAgents.splice(agentIndex, 1);
          
          return {
            success: true,
            result: {
              message: `Specialist agent '${data.agentId}' unregistered successfully`,
              specialistAgents: this.specialistAgents
            }
          };
          
        default:
          // Allow the extending class to handle the action
          return this.handleComponentSpecificAction(action, data);
      }
    } catch (error) {
      eventLogger.logError(
        this.id,
        'Request processing error',
        `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
        error,
        EventSeverity.ERROR
      );
      
      return {
        success: false,
        error: `Internal error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Handle component-specific actions
   * 
   * @param action The action to handle
   * @param data The action data
   * @returns Response for the action
   */
  protected abstract handleComponentSpecificAction(
    action: string,
    data: any
  ): Promise<AgentResponse>;
  
  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    // Clear existing interval if any
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Perform health checks every minute
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // 1 minute
  }
  
  /**
   * Perform a health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Update uptime
      this.healthMetrics.uptimeSeconds = Math.floor(
        (Date.now() - this.startTime.getTime()) / 1000
      );
      
      // Update last update time
      this.healthMetrics.lastUpdateTime = new Date().toISOString();
      
      // Call component-specific health check
      const healthCheckResult = await this.checkComponentHealth();
      
      // Update health metrics
      this.healthMetrics.healthCheckResult = healthCheckResult.healthy ? 'passed' : 'failed';
      
      // Update component status based on health check
      if (!healthCheckResult.healthy) {
        this.status = ComponentStatus.DEGRADED;
        
        // Create issue if any critical problems
        if (healthCheckResult.criticalIssue) {
          const issue: ComponentIssue = {
            id: `issue_${uuidv4()}`,
            description: healthCheckResult.criticalIssue,
            severity: 'high',
            resolved: false,
            identifiedAt: new Date().toISOString(),
            tags: ['health_check', 'automatic']
          };
          
          this.issues.push(issue);
          await this.notifyIssue(issue);
        }
      } else if (this.status === ComponentStatus.DEGRADED) {
        // Restore to operational if previously degraded
        this.status = ComponentStatus.OPERATIONAL;
      }
      
      // Broadcast health status to integration coordinator
      await this.broadcastHealthStatus();
    } catch (error) {
      eventLogger.logError(
        this.id,
        'Health check error',
        `Error performing health check: ${error instanceof Error ? error.message : String(error)}`,
        error,
        EventSeverity.ERROR
      );
      
      this.status = ComponentStatus.ERROR;
      this.healthMetrics.healthCheckResult = 'failed';
    }
  }
  
  /**
   * Check component health
   * 
   * @returns Health check result
   */
  protected async checkComponentHealth(): Promise<{ 
    healthy: boolean; 
    criticalIssue?: string 
  }> {
    // Default implementation - should be overridden by subclasses
    return { healthy: true };
  }
  
  /**
   * Notify about a new issue
   * 
   * @param issue The issue to notify about
   */
  private async notifyIssue(issue: ComponentIssue): Promise<void> {
    try {
      // Create issue notification message
      const message: AgentMessage = {
        id: `msg_${uuidv4()}`,
        correlationId: `corr_${uuidv4()}`,
        conversationId: undefined,
        type: 'notification',
        eventType: 'EVENT',
        senderId: this.id,
        recipientId: 'integration-coordinator',
        priority: issue.severity === 'critical' ? 'urgent' : 'normal',
        content: {
          event: 'component_issue',
          componentId: this.componentId,
          issue
        },
        timestamp: new Date().toISOString(),
        metadata: {
          tags: ['component', 'issue', issue.severity]
        }
      };
      
      // Send the message
      await this.sendMessage(message);
      
      // Log the notification
      eventLogger.logAction(
        this.id,
        'Issue notification sent',
        `Notified about issue '${issue.id}' to integration coordinator`,
        { issueId: issue.id, severity: issue.severity }
      );
    } catch (error) {
      eventLogger.logError(
        this.id,
        'Issue notification error',
        `Error notifying about issue: ${error instanceof Error ? error.message : String(error)}`,
        error,
        EventSeverity.ERROR
      );
    }
  }
  
  /**
   * Broadcast health status
   */
  private async broadcastHealthStatus(): Promise<void> {
    try {
      // Create health status message
      const message: AgentMessage = {
        id: `msg_${uuidv4()}`,
        correlationId: `corr_${uuidv4()}`,
        conversationId: undefined,
        type: 'notification',
        eventType: 'STATUS_UPDATE',
        senderId: this.id,
        recipientId: 'integration-coordinator',
        priority: 'normal',
        content: {
          event: 'component_health_update',
          componentId: this.componentId,
          status: this.status,
          healthMetrics: this.healthMetrics
        },
        timestamp: new Date().toISOString(),
        metadata: {
          tags: ['component', 'health', 'status']
        }
      };
      
      // Send the message
      await this.sendMessage(message);
    } catch (error) {
      eventLogger.logError(
        this.id,
        'Health broadcast error',
        `Error broadcasting health status: ${error instanceof Error ? error.message : String(error)}`,
        error,
        EventSeverity.ERROR
      );
    }
  }
  
  /**
   * Shut down the component
   */
  shutdown(): void {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Set status to offline
    this.status = ComponentStatus.OFFLINE;
    
    eventLogger.logAction(
      this.id,
      'Component Lead shutdown',
      'Component Lead is shutting down',
      { componentId: this.componentId, shutdownTime: new Date().toISOString() }
    );
  }
}