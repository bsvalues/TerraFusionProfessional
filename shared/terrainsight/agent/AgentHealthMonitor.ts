import { v4 as uuidv4 } from 'uuid';
import { Agent } from './Agent';
import { MasterControlProgram } from './MasterControlProgram';
import { eventLogger, EventType, EventSeverity } from './EventLogger';
import { MessageType, MessagePriority, AgentMessage } from './types';
import { agentHealthRecovery, RecoveryOptions, AgentStatus } from './AgentHealthRecovery';

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  healthy: boolean;
  timestamp: string;
  details?: any;
  criticalIssue?: string;
  recommendedAction?: string;
}

/**
 * Agent performance thresholds interface
 */
export interface AgentPerformanceThresholds {
  maxErrorRate: number;
  maxResponseTime: number;
  minHealthyUptime: number;
}

/**
 * Agent recovery action type
 */
export type RecoveryActionType = 'restart' | 'reset' | 'reload' | 'notify';

/**
 * Agent recovery action interface
 */
export interface RecoveryAction {
  type: RecoveryActionType;
  description: string;
  automatic: boolean;
  executeAction: () => Promise<boolean>;
}

/**
 * Agent health monitor class
 * 
 * This class is responsible for monitoring the health of all agents in the system.
 * It performs regular health checks, tracks performance metrics, and can initiate
 * recovery actions when issues are detected.
 */
export class AgentHealthMonitor {
  private agents: Map<string, Agent>;
  private agentStatus: Map<string, AgentStatus>;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private performanceMonitorInterval: NodeJS.Timeout | null = null;
  private recoveryAttempts: Map<string, number> = new Map();
  private lastRecoveryTime: Map<string, Date> = new Map();
  private masterControlProgram: MasterControlProgram;
  
  // Default performance thresholds
  private defaultThresholds: AgentPerformanceThresholds = {
    maxErrorRate: 0.1, // 10% error rate
    maxResponseTime: 5000, // 5 seconds
    minHealthyUptime: 0.95 // 95% uptime
  };
  
  constructor(
    agents: Map<string, Agent>,
    agentStatus: Map<string, AgentStatus>,
    masterControlProgram: MasterControlProgram
  ) {
    this.agents = agents;
    this.agentStatus = agentStatus;
    this.masterControlProgram = masterControlProgram;
  }
  
  /**
   * Start the health monitoring system
   * @param healthCheckIntervalMs Health check interval in milliseconds
   * @param performanceCheckIntervalMs Performance check interval in milliseconds
   */
  public start(
    healthCheckIntervalMs: number = 60000, // 1 minute
    performanceCheckIntervalMs: number = 300000 // 5 minutes
  ): void {
    this.stopMonitoring(); // Stop any existing monitoring
    
    // Start health check interval
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, healthCheckIntervalMs);
    
    // Start performance monitoring interval
    this.performanceMonitorInterval = setInterval(() => {
      this.checkAgentPerformance();
    }, performanceCheckIntervalMs);
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'AgentHealthMonitor',
      message: 'Agent health monitoring started',
      data: { 
        healthCheckIntervalMs, 
        performanceCheckIntervalMs,
        agentCount: this.agents.size
      }
    });
  }
  
  /**
   * Stop health monitoring
   */
  public stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.performanceMonitorInterval) {
      clearInterval(this.performanceMonitorInterval);
      this.performanceMonitorInterval = null;
    }
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'AgentHealthMonitor',
      message: 'Agent health monitoring stopped'
    });
  }
  
  /**
   * Perform health checks on all agents
   */
  private async performHealthChecks(): Promise<void> {
    const unhealthyAgents: string[] = [];
    
    for (const [agentId, agent] of this.agents.entries()) {
      try {
        // Get agent status
        const status = await agent.getStatus();
        
        // Update agent status
        const currentStatus = this.agentStatus.get(agentId);
        if (currentStatus) {
          const wasHealthy = currentStatus.healthy;
          currentStatus.healthy = status.healthy;
          currentStatus.metrics.lastHealthCheckTime = new Date().toISOString();
          
          // Update metrics
          if (status.metrics) {
            Object.assign(currentStatus.metrics, status.metrics);
          }
          
          // Check for health status change
          if (wasHealthy !== status.healthy) {
            if (status.healthy) {
              // Agent recovered
              eventLogger.log({
                type: EventType.INFO,
                source: agentId,
                message: `Agent ${agentId} has recovered to healthy status`,
                data: { status }
              });
              
              // Reset recovery attempts
              this.recoveryAttempts.set(agentId, 0);
            } else {
              // Agent became unhealthy
              unhealthyAgents.push(agentId);
              
              eventLogger.log({
                type: EventType.WARNING,
                severity: EventSeverity.HIGH,
                source: agentId,
                message: `Agent ${agentId} is reporting as unhealthy`,
                data: { status }
              });
              
              // Attempt recovery if applicable
              await this.attemptRecovery(agentId, agent, status);
            }
          } else if (!status.healthy) {
            // Still unhealthy
            unhealthyAgents.push(agentId);
          }
        }
      } catch (error) {
        // Health check failed
        unhealthyAgents.push(agentId);
        
        eventLogger.log({
          type: EventType.ERROR,
          severity: EventSeverity.HIGH,
          source: 'AgentHealthMonitor',
          message: `Error checking health for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
          data: error
        });
        
        // Mark agent as unhealthy
        const currentStatus = this.agentStatus.get(agentId);
        if (currentStatus) {
          const wasHealthy = currentStatus.healthy;
          currentStatus.healthy = false;
          currentStatus.lastError = {
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            details: error
          };
          
          // If newly unhealthy, attempt recovery
          if (wasHealthy) {
            await this.attemptRecovery(agentId, agent, currentStatus);
          }
        }
      }
    }
    
    // Report system status based on agent health
    if (unhealthyAgents.length > 0) {
      eventLogger.log({
        type: EventType.WARNING,
        severity: EventSeverity.MEDIUM,
        source: 'AgentHealthMonitor',
        message: `${unhealthyAgents.length} unhealthy agents detected during health check`,
        data: { unhealthyAgents }
      });
      
      // Broadcast system status
      await this.broadcastHealthStatus('degraded', unhealthyAgents);
    } else {
      // All agents healthy
      await this.broadcastHealthStatus('healthy', []);
    }
  }
  
  /**
   * Check agent performance against thresholds
   */
  private checkAgentPerformance(): void {
    for (const [agentId, status] of this.agentStatus.entries()) {
      // Skip inactive or already unhealthy agents
      if (!status.active || !status.healthy) {
        continue;
      }
      
      const agent = this.agents.get(agentId);
      if (!agent) continue;
      
      // Get performance metrics
      const { metrics } = status;
      
      // Calculate error rate if we have enough data
      if (metrics.requestsProcessed > 0) {
        const errorRate = metrics.errorsEncountered / metrics.requestsProcessed;
        
        // Check error rate against threshold
        if (errorRate > this.defaultThresholds.maxErrorRate) {
          eventLogger.log({
            type: EventType.WARNING,
            severity: EventSeverity.MEDIUM,
            source: agentId,
            message: `Agent ${agentId} error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold (${(this.defaultThresholds.maxErrorRate * 100).toFixed(2)}%)`,
            data: { 
              errorRate,
              errorsEncountered: metrics.errorsEncountered,
              requestsProcessed: metrics.requestsProcessed
            }
          });
          
          // Mark agent as potentially degraded, but don't mark as unhealthy yet
          // This will be noted in the performance metrics
          metrics.performanceWarnings = metrics.performanceWarnings || [];
          metrics.performanceWarnings.push({
            type: 'error_rate',
            message: `Error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold (${(this.defaultThresholds.maxErrorRate * 100).toFixed(2)}%)`,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Check response time
      if (metrics.avgProcessingTimeMs > this.defaultThresholds.maxResponseTime) {
        eventLogger.log({
          type: EventType.WARNING,
          severity: EventSeverity.LOW,
          source: agentId,
          message: `Agent ${agentId} average response time (${metrics.avgProcessingTimeMs.toFixed(2)}ms) exceeds threshold (${this.defaultThresholds.maxResponseTime}ms)`,
          data: { 
            avgProcessingTimeMs: metrics.avgProcessingTimeMs,
            threshold: this.defaultThresholds.maxResponseTime
          }
        });
        
        // Add to performance warnings
        metrics.performanceWarnings = metrics.performanceWarnings || [];
        metrics.performanceWarnings.push({
          type: 'response_time',
          message: `Average response time (${metrics.avgProcessingTimeMs.toFixed(2)}ms) exceeds threshold (${this.defaultThresholds.maxResponseTime}ms)`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  /**
   * Attempt to recover an unhealthy agent
   * @param agentId The ID of the agent to recover
   * @param agent The agent instance
   * @param status The current agent status
   */
  private async attemptRecovery(
    agentId: string,
    agent: Agent,
    status: AgentStatus
  ): Promise<boolean> {
    // Use the enhanced recovery system
    const result = await agentHealthRecovery.recoverAgent(agentId, agent, status, {
      autoInitialize: true,
      forceHealthyStatus: true,
      maxAttempts: 3,
      cooldownMs: 60000
    });
    
    // Log recovery attempt result
    if (result.success) {
      eventLogger.log({
        type: EventType.INFO,
        source: 'AgentHealthMonitor',
        message: `Successfully recovered agent ${agentId}`,
        data: { agentId, result }
      });
      
      // If recovery was successful, reset our local recovery attempts counter
      this.recoveryAttempts.set(agentId, 0);
      
      return true;
    } else {
      // Check if we've exceeded max attempts
      if (result.attemptCount >= 3) {
        eventLogger.log({
          type: EventType.ERROR,
          severity: EventSeverity.HIGH,
          source: 'AgentHealthMonitor',
          message: `Maximum recovery attempts (3) reached for agent ${agentId}, manual intervention required`,
          data: { agentId, result }
        });
        
        // Notify system administrators
        await this.notifySystemAdministrators(agentId, status);
      } else {
        eventLogger.log({
          type: EventType.WARNING,
          severity: EventSeverity.MEDIUM,
          source: 'AgentHealthMonitor',
          message: `Failed to recover agent ${agentId} (attempt ${result.attemptCount})`,
          data: { agentId, result }
        });
      }
      
      return false;
    }
  }
  
  /**
   * Broadcast system health status to all agents
   */
  private async broadcastHealthStatus(status: 'healthy' | 'degraded', unhealthyAgents: string[]): Promise<void> {
    try {
      // Create a properly typed message object
      const message = {
        id: `health_${uuidv4()}`,
        correlationId: `health_corr_${uuidv4()}`,
        conversationId: `health_conv_${uuidv4()}`,
        type: 'notification' as MessageType,
        eventType: 'STATUS_UPDATE' as any, // Use 'as any' to bypass type checking for now
        senderId: 'agent-health-monitor',
        recipientId: 'all',
        content: {
          status,
          unhealthyAgentCount: unhealthyAgents.length,
          unhealthyAgents,
          totalAgents: this.agents.size
        },
        priority: 'high' as MessagePriority,
        timestamp: new Date().toISOString(),
        metadata: {
          ttl: 300, // 5 minutes
          requiresAcknowledgment: false,
          context: {
            broadcast: true,
            topic: 'system_health'
          },
          tags: ['health_status', 'system_monitoring']
        }
      };
      
      // Use MCP to broadcast message
      await this.masterControlProgram.broadcastMessage(message);
    } catch (error) {
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.MEDIUM,
        source: 'AgentHealthMonitor',
        message: `Error broadcasting health status: ${error instanceof Error ? error.message : String(error)}`,
        data: error
      });
    }
  }
  
  /**
   * Notify system administrators about an agent that requires manual intervention
   */
  private async notifySystemAdministrators(agentId: string, status: AgentStatus): Promise<void> {
    // This would typically integrate with an alerting system
    // For now, we'll log it and send a message to the MCP
    try {
      const message = {
        id: `alert_${uuidv4()}`,
        correlationId: `alert_corr_${uuidv4()}`,
        conversationId: `alert_conv_${uuidv4()}`,
        type: 'notification' as MessageType,
        eventType: 'STATUS_UPDATE' as any, // Use 'as any' to bypass type checking for now
        senderId: 'agent-health-monitor',
        recipientId: 'system-admin',
        content: {
          agentId,
          status,
          message: `Agent ${agentId} requires manual intervention after 3 failed recovery attempts`,
          recommendedActions: [
            'Check agent logs for errors',
            'Verify agent configuration',
            'Manually restart agent or entire system if needed'
          ]
        },
        priority: 'urgent' as MessagePriority,
        timestamp: new Date().toISOString(),
        metadata: {
          ttl: 3600, // 1 hour
          requiresAcknowledgment: true,
          context: {
            alert: true,
            topic: 'system_health',
            severity: 'critical'
          },
          tags: ['alert', 'system_health', 'critical']
        }
      };
      
      // Use MCP to send a message
      await this.masterControlProgram.sendMessage(message);
      
      eventLogger.log({
        type: EventType.ERROR, // Use ERROR as ALERT doesn't exist
        severity: EventSeverity.HIGH,
        source: 'AgentHealthMonitor',
        message: `System administrator notification sent for agent ${agentId}`,
        data: message
      });
    } catch (error) {
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.HIGH,
        source: 'AgentHealthMonitor',
        message: `Error notifying system administrators: ${error instanceof Error ? error.message : String(error)}`,
        data: error
      });
    }
  }
  
  /**
   * Get the health report for all agents
   * @returns A health report object with status and details for all agents
   */
  public getHealthReport(): any {
    const report = {
      timestamp: new Date().toISOString(),
      systemStatus: 'healthy' as 'healthy' | 'degraded' | 'critical',
      agentCount: this.agents.size,
      healthyAgentCount: 0,
      unhealthyAgentCount: 0,
      agents: [] as any[],
      performanceWarnings: [] as any[]
    };
    
    // Compile agent status
    for (const [agentId, status] of this.agentStatus.entries()) {
      const agent = this.agents.get(agentId);
      if (!agent) continue;
      
      if (status.healthy) {
        report.healthyAgentCount++;
      } else {
        report.unhealthyAgentCount++;
      }
      
      // Add agent details to report
      report.agents.push({
        id: agentId,
        name: agent.name,
        status: status.healthy ? 'healthy' : 'unhealthy',
        active: status.active,
        metrics: status.metrics,
        lastError: status.lastError
      });
      
      // Collect performance warnings
      if (status.metrics.performanceWarnings && status.metrics.performanceWarnings.length > 0) {
        report.performanceWarnings.push({
          agentId,
          warnings: status.metrics.performanceWarnings
        });
      }
    }
    
    // Determine overall system status
    if (report.unhealthyAgentCount > Math.floor(report.agentCount * 0.3)) {
      report.systemStatus = 'critical';
    } else if (report.unhealthyAgentCount > 0) {
      report.systemStatus = 'degraded';
    }
    
    return report;
  }
}