/**
 * Agent Manager
 * 
 * This module implements the Agent Manager responsible for initializing,
 * monitoring, and managing agents in the system.
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent } from './Agent';
import { masterControlProgram } from './MasterControlProgram';
import { eventLogger, EventType, EventSeverity } from './EventLogger';
import { replayBuffer } from './ReplayBuffer';
import { config, AgentConfig } from './config';
import { 
  DataValidationAgent,
  LegalComplianceAgent, 
  ValuationAgent,
  WorkflowAgent,
  ArchitectPrimeAgent,
  IntegrationCoordinatorAgent,
  BSBCmasterLeadAgent
} from './index';
import { GodTierBuilderAgent } from './GodTierBuilderAgent';
import { TDDValidatorAgent } from './TDDValidatorAgent';

/**
 * Agent status information
 */
export interface AgentStatus {
  /** Agent identifier */
  id: string;
  
  /** Whether the agent is active */
  active: boolean;
  
  /** Whether the agent is healthy */
  healthy: boolean;
  
  /** Agent metrics */
  metrics: {
    /** Number of requests processed */
    requestsProcessed: number;
    
    /** Number of errors encountered */
    errorsEncountered: number;
    
    /** Average processing time in milliseconds */
    avgProcessingTimeMs: number;
    
    /** Last health check timestamp */
    lastHealthCheckTime: string;
    
    /** Custom agent-specific metrics */
    [key: string]: any;
  };
  
  /** Last error encountered (if any) */
  lastError?: {
    /** Error message */
    message: string;
    
    /** Error timestamp */
    timestamp: string;
    
    /** Error details */
    details?: any;
  };
}

/**
 * Agent Manager responsible for managing agents in the system
 */
export class AgentManager {
  /** Map of agent IDs to initialized agents */
  private agents: Map<string, Agent> = new Map();
  
  /** Map of agent IDs to agent status */
  private agentStatus: Map<string, AgentStatus> = new Map();
  
  /** Health check interval handle */
  private healthCheckInterval?: NodeJS.Timeout;
  
  /** Performance monitoring interval handle */
  private performanceMonitorInterval?: NodeJS.Timeout;
  
  /**
   * Initialize the Agent Manager
   */
  constructor() {
    eventLogger.log({
      type: EventType.INFO,
      source: 'AgentManager',
      message: 'Agent Manager initialized',
      data: { timestamp: new Date().toISOString() }
    });
  }
  
  /**
   * Initialize agents based on configuration
   */
  async initializeAgents(): Promise<void> {
    // Initialize each agent from configuration
    for (const agentConfig of config.agents) {
      if (agentConfig.enabled) {
        await this.initializeAgent(agentConfig);
      }
    }
    
    // Start health checking
    this.startHealthChecks();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'AgentManager',
      message: `Initialized ${this.agents.size} agents`,
      data: { agentCount: this.agents.size }
    });
  }
  
  /**
   * Initialize a specific agent
   * 
   * @param agentConfig Agent configuration
   */
  async initializeAgent(agentConfig: AgentConfig): Promise<Agent | undefined> {
    try {
      // Check if agent already exists
      if (this.agents.has(agentConfig.id)) {
        eventLogger.log({
          type: EventType.WARNING,
          severity: EventSeverity.LOW,
          source: 'AgentManager',
          message: `Agent with ID ${agentConfig.id} is already initialized`,
          data: { agentId: agentConfig.id }
        });
        
        return this.agents.get(agentConfig.id);
      }
      
      // Create the agent based on ID
      let agent: Agent | undefined;
      
      switch (agentConfig.id) {
        // Specialized domain agents
        case 'data-validation-agent':
          agent = new DataValidationAgent();
          break;
          
        case 'legal-compliance-agent':
          agent = new LegalComplianceAgent();
          break;
          
        case 'valuation-agent':
          agent = new ValuationAgent();
          break;
          
        case 'workflow-agent':
          agent = new WorkflowAgent();
          break;
        
        // Leadership hierarchy agents
        case 'architect-prime':
          agent = new ArchitectPrimeAgent();
          break;
          
        case 'integration-coordinator':
          agent = new IntegrationCoordinatorAgent();
          break;
          
        case 'bsbcmaster-lead':
          agent = new BSBCmasterLeadAgent();
          break;
          
        // Development agents
        case 'god-tier-builder':
          agent = new GodTierBuilderAgent();
          break;
          
        case 'tdd-validator':
          agent = new TDDValidatorAgent();
          break;
          
        default:
          eventLogger.log({
            type: EventType.ERROR,
            severity: EventSeverity.HIGH,
            source: 'AgentManager',
            message: `Unknown agent type for ID ${agentConfig.id}`,
            data: { agentId: agentConfig.id }
          });
          return undefined;
      }
      
      // Register the agent with the MCP
      masterControlProgram.registerAgent(agent);
      
      // Store the agent
      this.agents.set(agentConfig.id, agent);
      
      // Initialize agent status
      this.agentStatus.set(agentConfig.id, {
        id: agentConfig.id,
        active: true,
        healthy: true,
        metrics: {
          requestsProcessed: 0,
          errorsEncountered: 0,
          avgProcessingTimeMs: 0,
          lastHealthCheckTime: new Date().toISOString()
        }
      });
      
      // Log agent initialization
      eventLogger.log({
        type: EventType.INFO,
        source: 'AgentManager',
        message: `Agent registered: ${agent.name} (${agent.id})`,
        data: {
          id: agent.id,
          name: agent.name,
          capabilities: agent.capabilities
        }
      });
      
      return agent;
    } catch (error) {
      // Log initialization error
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.HIGH,
        source: 'AgentManager',
        message: `Error initializing agent ${agentConfig.id}: ${error instanceof Error ? error.message : String(error)}`,
        data: error
      });
      
      return undefined;
    }
  }
  
  /**
   * Get an agent by ID
   * 
   * @param agentId Agent ID
   * @returns The agent or undefined if not found
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all agents
   * 
   * @returns Array of all registered agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get agent status
   * 
   * @param agentId Agent ID
   * @returns Agent status or undefined if agent not found
   */
  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agentStatus.get(agentId);
  }
  
  /**
   * Get status for all agents
   * 
   * @returns Array of status for all agents
   */
  getAllAgentStatus(): AgentStatus[] {
    return Array.from(this.agentStatus.values());
  }
  
  /**
   * Start regular health checks for all agents
   */
  private startHealthChecks(): void {
    // Clear existing interval if any
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Start health check interval
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Check every minute
  }
  
  /**
   * Perform health checks on all agents
   */
  private async performHealthChecks(): Promise<void> {
    for (const [agentId, agent] of this.agents.entries()) {
      try {
        // Get agent status
        const status = await agent.getStatus();
        
        // Update agent status
        const currentStatus = this.agentStatus.get(agentId);
        if (currentStatus) {
          currentStatus.healthy = status.healthy;
          currentStatus.metrics.lastHealthCheckTime = new Date().toISOString();
          
          // Update metrics
          if (status.metrics) {
            Object.assign(currentStatus.metrics, status.metrics);
          }
          
          // Log status change if health status changed
          if (currentStatus.healthy !== status.healthy) {
            if (status.healthy) {
              eventLogger.log({
                type: EventType.INFO,
                source: agentId,
                message: `Agent ${agentId} has recovered to healthy status`,
                data: { status }
              });
            } else {
              eventLogger.log({
                type: EventType.WARNING,
                severity: EventSeverity.HIGH,
                source: agentId,
                message: `Agent ${agentId} is reporting as unhealthy`,
                data: { status }
              });
            }
          }
        }
      } catch (error) {
        // Log health check error
        eventLogger.log({
          type: EventType.ERROR,
          severity: EventSeverity.HIGH,
          source: agentId,
          message: `Error checking health for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
          data: error
        });
        
        // Mark agent as unhealthy
        const currentStatus = this.agentStatus.get(agentId);
        if (currentStatus) {
          currentStatus.healthy = false;
          currentStatus.lastError = {
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            details: error
          };
        }
      }
    }
  }
  
  /**
   * Start performance monitoring for all agents
   */
  private startPerformanceMonitoring(): void {
    // Clear existing interval if any
    if (this.performanceMonitorInterval) {
      clearInterval(this.performanceMonitorInterval);
    }
    
    // Start performance monitoring interval
    this.performanceMonitorInterval = setInterval(() => {
      this.checkAgentPerformance();
    }, 300000); // Check every 5 minutes
  }
  
  /**
   * Check agent performance against thresholds
   */
  private checkAgentPerformance(): void {
    for (const [agentId, status] of this.agentStatus.entries()) {
      // Skip inactive or unhealthy agents
      if (!status.active || !status.healthy) {
        continue;
      }
      
      // Get agent config
      const agentConfig = config.agents.find(a => a.id === agentId);
      if (!agentConfig || !agentConfig.performanceThresholds) {
        continue;
      }
      
      // Check performance thresholds
      const thresholds = agentConfig.performanceThresholds;
      const metrics = status.metrics;
      
      // Check error rate threshold
      if (thresholds.maxErrorRate !== undefined && 
          metrics.requestsProcessed > 0) {
        const errorRate = metrics.errorsEncountered / metrics.requestsProcessed;
        
        if (errorRate > thresholds.maxErrorRate) {
          // Log performance issue
          eventLogger.log({
            type: EventType.WARNING,
            severity: EventSeverity.MEDIUM,
            source: agentId,
            message: `Agent ${agentId} has a high error rate of ${(errorRate * 100).toFixed(2)}%, exceeding threshold of ${(thresholds.maxErrorRate * 100).toFixed(2)}%`,
            data: { 
              errorRate,
              threshold: thresholds.maxErrorRate,
              errorsEncountered: metrics.errorsEncountered,
              requestsProcessed: metrics.requestsProcessed
            }
          });
          
          // Request assistance
          this.requestAssistance(agentId, 'high_error_rate', {
            errorRate,
            threshold: thresholds.maxErrorRate,
            metrics
          });
        }
      }
      
      // Check processing time threshold
      if (thresholds.maxAvgProcessingTime !== undefined && 
          metrics.avgProcessingTimeMs > thresholds.maxAvgProcessingTime) {
        // Log performance issue
        eventLogger.log({
          type: EventType.WARNING,
          severity: EventSeverity.MEDIUM,
          source: agentId,
          message: `Agent ${agentId} has a high average processing time of ${metrics.avgProcessingTimeMs}ms, exceeding threshold of ${thresholds.maxAvgProcessingTime}ms`,
          data: { 
            avgProcessingTime: metrics.avgProcessingTimeMs,
            threshold: thresholds.maxAvgProcessingTime
          }
        });
        
        // Request assistance
        this.requestAssistance(agentId, 'slow_processing', {
          avgProcessingTime: metrics.avgProcessingTimeMs,
          threshold: thresholds.maxAvgProcessingTime,
          metrics
        });
      }
    }
  }
  
  /**
   * Request assistance for an agent
   * 
   * @param agentId Agent ID
   * @param issueType Type of issue
   * @param data Issue-specific data
   */
  private async requestAssistance(
    agentId: string,
    issueType: string,
    data: any
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return;
    }
    
    try {
      // Create assistance request message
      const message = masterControlProgram.createMessage(
        'query',
        agentId,
        'all',
        {
          action: 'assistance_request',
          assistanceRequestId: `assist_${uuidv4()}`,
          issueType,
          data
        },
        {
          priority: 'high',
          requiresAcknowledgment: true
        }
      );
      
      // Send the message
      await masterControlProgram.sendMessage(message);
      
      // Log assistance request
      eventLogger.log({
        type: EventType.INFO,
        source: agentId,
        message: `Agent ${agentId} requested assistance for issue type: ${issueType}`,
        data: { issueType, data }
      });
    } catch (error) {
      // Log error
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.ERROR,
        source: agentId,
        message: `Error requesting assistance for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
        data: error
      });
    }
  }
  
  /**
   * Stop and clean up the Agent Manager
   */
  shutdown(): void {
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.performanceMonitorInterval) {
      clearInterval(this.performanceMonitorInterval);
    }
    
    // Log shutdown
    eventLogger.log({
      type: EventType.INFO,
      source: 'AgentManager',
      message: `Agent Manager shutting down, managed ${this.agents.size} agents`,
      data: { agentCount: this.agents.size }
    });
  }
}

/**
 * Singleton instance of the Agent Manager
 */
export const agentManager = new AgentManager();