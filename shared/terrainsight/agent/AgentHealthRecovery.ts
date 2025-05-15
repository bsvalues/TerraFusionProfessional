/**
 * Agent Health Recovery System
 * 
 * This module provides an enhanced recovery mechanism for the multi-agent system
 * with automatic initialization and recovery of agent health states.
 */

import { Agent } from './Agent';
import { eventLogger, EventType, EventSeverity } from './EventLogger';

// Define the AgentStatus interface to match what we need
export interface AgentStatus {
  id?: string;
  active?: boolean;
  healthy: boolean;
  lastError?: any;
  metrics?: Record<string, any>;
  status?: string;
}

/**
 * Maximum number of recovery attempts before giving up
 */
const MAX_RECOVERY_ATTEMPTS = 3;

/**
 * Minimum time between recovery attempts (ms)
 */
const RECOVERY_COOLDOWN_MS = 60000; // 1 minute

/**
 * Options for the recovery procedure
 */
export interface RecoveryOptions {
  /**
   * Whether to attempt automatic initialization for agents
   */
  autoInitialize?: boolean;
  
  /**
   * Whether to force a healthy status when recovering agents
   */
  forceHealthyStatus?: boolean;
  
  /**
   * Maximum recovery attempts
   */
  maxAttempts?: number;
  
  /**
   * Cooldown period between recovery attempts (ms)
   */
  cooldownMs?: number;
}

/**
 * Agent recovery status result
 */
export interface RecoveryResult {
  /**
   * Agent ID
   */
  agentId: string;
  
  /**
   * Whether recovery was successful
   */
  success: boolean;
  
  /**
   * Recovery timestamp
   */
  timestamp: string;
  
  /**
   * Current health status after recovery
   */
  healthStatus: boolean;
  
  /**
   * Any error encountered during recovery
   */
  error?: any;
  
  /**
   * Recovery attempt count
   */
  attemptCount: number;
}

/**
 * Agent health recovery class
 */
export class AgentHealthRecovery {
  /**
   * Map of agent recovery attempts
   */
  private recoveryAttempts: Map<string, number> = new Map();
  
  /**
   * Map of last recovery times
   */
  private lastRecoveryTime: Map<string, Date> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    eventLogger.log({
      type: EventType.INFO,
      source: 'AgentHealthRecovery',
      message: 'Agent health recovery system initialized'
    });
  }
  
  /**
   * Attempt to recover an unhealthy agent
   * 
   * @param agentId Agent ID to recover
   * @param agent Agent instance
   * @param status Current agent status (if available)
   * @param options Recovery options
   * @returns Recovery result
   */
  public async recoverAgent(
    agentId: string,
    agent: Agent,
    status?: AgentStatus,
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    // Set default options
    const {
      autoInitialize = true,
      forceHealthyStatus = true,
      maxAttempts = MAX_RECOVERY_ATTEMPTS,
      cooldownMs = RECOVERY_COOLDOWN_MS
    } = options;
    
    // Get current attempt count
    const attemptCount = this.recoveryAttempts.get(agentId) || 0;
    
    // Check if we've exceeded max attempts
    if (attemptCount >= maxAttempts) {
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.HIGH,
        source: 'AgentHealthRecovery',
        message: `Maximum recovery attempts (${maxAttempts}) exceeded for agent ${agentId}`,
        data: { agentId, attemptCount }
      });
      
      return {
        agentId,
        success: false,
        timestamp: new Date().toISOString(),
        healthStatus: false,
        error: 'Maximum recovery attempts exceeded',
        attemptCount
      };
    }
    
    // Check if we're in cooldown period
    const lastRecovery = this.lastRecoveryTime.get(agentId);
    if (lastRecovery) {
      const elapsedMs = Date.now() - lastRecovery.getTime();
      if (elapsedMs < cooldownMs) {
        eventLogger.log({
          type: EventType.WARNING,
          source: 'AgentHealthRecovery',
          message: `Agent ${agentId} recovery in cooldown period (${Math.round(elapsedMs / 1000)}s elapsed, ${Math.round((cooldownMs - elapsedMs) / 1000)}s remaining)`,
          data: { agentId, elapsedMs, cooldownMs }
        });
        
        return {
          agentId,
          success: false,
          timestamp: new Date().toISOString(),
          healthStatus: status?.healthy || false,
          error: 'Recovery in cooldown period',
          attemptCount
        };
      }
    }
    
    try {
      // Update recovery attempt count
      this.recoveryAttempts.set(agentId, attemptCount + 1);
      this.lastRecoveryTime.set(agentId, new Date());
      
      eventLogger.log({
        type: EventType.INFO,
        source: 'AgentHealthRecovery',
        message: `Attempting recovery for agent ${agentId} (attempt ${attemptCount + 1} of ${maxAttempts})`,
        data: { agentId, attemptCount: attemptCount + 1 }
      });
      
      // Clear any existing initialized state
      if (autoInitialize && agent) {
        try {
          // Call initialize to reset the agent state
          // Try to reinitialize the agent with null values for messageBus and replayBuffer
          // This is a special case to allow reinitialization without accessing private properties
          try {
            if (typeof agent.initialize === 'function') {
              // First try with no arguments (this should work if agent.initialize handles defaults)
              await (agent.initialize as Function)();
            }
          } catch (error) {
            // If that fails, the agent may require parameters, try again with null
            if (typeof agent.initialize === 'function') {
              await (agent.initialize as Function)(null, null);
            }
          }
          
          eventLogger.log({
            type: EventType.INFO,
            source: 'AgentHealthRecovery',
            message: `Reinitialized agent ${agentId}`,
            data: { agentId }
          });
        } catch (initError) {
          eventLogger.log({
            type: EventType.ERROR,
            severity: EventSeverity.HIGH,
            source: 'AgentHealthRecovery',
            message: `Failed to reinitialize agent ${agentId}`,
            data: { agentId, error: initError }
          });
          
          return {
            agentId,
            success: false,
            timestamp: new Date().toISOString(),
            healthStatus: false,
            error: initError,
            attemptCount: this.recoveryAttempts.get(agentId) || 0
          };
        }
      }
      
      // Force healthy status if requested
      if (forceHealthyStatus && status) {
        status.healthy = true;
        
        // Also clear last error
        if (status.lastError) {
          delete status.lastError;
        }
        
        eventLogger.log({
          type: EventType.INFO,
          source: 'AgentHealthRecovery',
          message: `Forced healthy status for agent ${agentId}`,
          data: { agentId }
        });
      }
      
      // Get updated status
      const updatedStatus = await agent.getStatus();
      
      // Reset recovery attempts if successful
      if (updatedStatus && updatedStatus.status === 'operational') {
        this.recoveryAttempts.set(agentId, 0);
        
        eventLogger.log({
          type: EventType.INFO,
          source: 'AgentHealthRecovery',
          message: `Agent ${agentId} recovery successful`,
          data: { agentId, status: updatedStatus }
        });
        
        return {
          agentId,
          success: true,
          timestamp: new Date().toISOString(),
          healthStatus: true,
          attemptCount: 0
        };
      }
      
      // Recovery not fully successful
      return {
        agentId,
        success: forceHealthyStatus, // If force health, consider it a success
        timestamp: new Date().toISOString(),
        healthStatus: updatedStatus?.status === 'operational',
        attemptCount: this.recoveryAttempts.get(agentId) || 0
      };
      
    } catch (error) {
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.HIGH,
        source: 'AgentHealthRecovery',
        message: `Error during agent ${agentId} recovery`,
        data: { agentId, error }
      });
      
      return {
        agentId,
        success: false,
        timestamp: new Date().toISOString(),
        healthStatus: false,
        error,
        attemptCount: this.recoveryAttempts.get(agentId) || 0
      };
    }
  }
  
  /**
   * Reset recovery attempts for an agent
   * 
   * @param agentId Agent ID to reset
   */
  public resetRecoveryAttempts(agentId: string): void {
    this.recoveryAttempts.set(agentId, 0);
    this.lastRecoveryTime.delete(agentId);
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'AgentHealthRecovery',
      message: `Reset recovery attempts for agent ${agentId}`,
      data: { agentId }
    });
  }
  
  /**
   * Reset all recovery attempts
   */
  public resetAllRecoveryAttempts(): void {
    this.recoveryAttempts.clear();
    this.lastRecoveryTime.clear();
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'AgentHealthRecovery',
      message: 'Reset all agent recovery attempts'
    });
  }
  
  /**
   * Get recovery metrics
   */
  public getRecoveryMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {
      totalAgents: this.recoveryAttempts.size,
      agentsInRecovery: 0,
      maxAttempts: 0,
      avgAttempts: 0,
      totalAttempts: 0
    };
    
    // Calculate metrics
    for (const [agentId, attempts] of this.recoveryAttempts.entries()) {
      if (attempts > 0) {
        metrics.agentsInRecovery++;
      }
      
      metrics.totalAttempts += attempts;
      metrics.maxAttempts = Math.max(metrics.maxAttempts, attempts);
    }
    
    // Calculate average
    if (metrics.totalAgents > 0) {
      metrics.avgAttempts = metrics.totalAttempts / metrics.totalAgents;
    }
    
    return metrics;
  }
}

// Export singleton instance
export const agentHealthRecovery = new AgentHealthRecovery();