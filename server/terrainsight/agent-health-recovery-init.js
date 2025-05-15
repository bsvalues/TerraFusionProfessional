/**
 * Agent Health Recovery Initialization
 * 
 * This module initializes the automatic agent health recovery system.
 * It's designed to be imported by the main server and run during startup.
 */

import { agentManager } from '../shared/agent/index.js';
import { agentHealthRecovery } from '../shared/agent/AgentHealthRecovery.js';
import { eventLogger, EventType } from '../shared/agent/EventLogger.js';

const CHECK_INTERVAL_MS = 60000; // Check every minute
const MAX_RECOVERY_ATTEMPTS = 3;
const RECOVERY_COOLDOWN_MS = 5000; 

// Keep track of recovery attempts to avoid recovery storms
const recoveryAttempts = new Map();

/**
 * Check for unhealthy agents and recover them
 */
async function checkAndRecoverAgents() {
  try {
    // Get all agent statuses
    const agentStatusList = agentManager.getAllAgentStatus();
    
    // Find unhealthy agents
    const unhealthyAgents = agentStatusList
      .filter(status => !status.healthy)
      .map(status => status.id);
    
    if (unhealthyAgents.length === 0) {
      // All agents are healthy
      recoveryAttempts.clear();
      return;
    }
    
    console.log(`[AgentHealthRecovery] Found ${unhealthyAgents.length} unhealthy agents:`, unhealthyAgents);
    
    // Recover each unhealthy agent
    for (const agentId of unhealthyAgents) {
      const currentAttempts = recoveryAttempts.get(agentId) || 0;
      
      if (currentAttempts >= MAX_RECOVERY_ATTEMPTS) {
        console.log(`[AgentHealthRecovery] Skipping recovery for ${agentId} - max attempts reached`);
        continue;
      }
      
      const agent = agentManager.getAgent(agentId);
      const status = agentManager.getAgentStatus(agentId);
      
      if (!agent || !status) {
        console.log(`[AgentHealthRecovery] Agent ${agentId} or its status not found, skipping recovery`);
        continue;
      }
      
      try {
        // Attempt recovery with automatic initialization
        const result = await agentHealthRecovery.recoverAgent(agentId, agent, status, {
          autoInitialize: true,
          forceHealthyStatus: true,
          maxAttempts: 3,
          cooldownMs: RECOVERY_COOLDOWN_MS
        });
        
        if (result.success) {
          // Recovery successful - reset attempts
          recoveryAttempts.delete(agentId);
          
          eventLogger.log({
            type: EventType.INFO,
            source: 'AgentHealthRecoverySystem',
            message: `Successfully recovered agent ${agentId}`,
            data: { agentId, result }
          });
        } else {
          // Recovery failed - increment attempts
          recoveryAttempts.set(agentId, currentAttempts + 1);
          
          eventLogger.log({
            type: EventType.WARNING,
            source: 'AgentHealthRecoverySystem',
            message: `Failed to recover agent ${agentId}`,
            data: { 
              agentId, 
              error: result.error,
              attemptCount: currentAttempts + 1,
              maxAttempts: MAX_RECOVERY_ATTEMPTS
            }
          });
        }
      } catch (error) {
        recoveryAttempts.set(agentId, currentAttempts + 1);
        
        eventLogger.log({
          type: EventType.ERROR,
          source: 'AgentHealthRecoverySystem',
          message: `Error during recovery of agent ${agentId}`,
          data: { 
            agentId, 
            error: error instanceof Error ? error.message : String(error),
            attemptCount: currentAttempts + 1
          }
        });
      }
    }
    
  } catch (error) {
    eventLogger.log({
      type: EventType.ERROR,
      source: 'AgentHealthRecoverySystem',
      message: 'Error in agent health recovery check',
      data: { error: error instanceof Error ? error.message : String(error) }
    });
  }
}

/**
 * Initialize the automatic agent health recovery system
 */
export function initializeAgentHealthRecoverySystem() {
  console.log(`[AgentHealthRecoverySystem] Initializing automatic agent health recovery system`);
  
  // Run an initial check
  setTimeout(checkAndRecoverAgents, 5000); // Give agents time to stabilize first
  
  // Set up interval for regular checks
  const intervalId = setInterval(checkAndRecoverAgents, CHECK_INTERVAL_MS);
  
  console.log(`[AgentHealthRecoverySystem] Automatic agent health recovery system initialized`);
  console.log(`[AgentHealthRecoverySystem] Check interval: ${CHECK_INTERVAL_MS}ms, Max recovery attempts: ${MAX_RECOVERY_ATTEMPTS}`);
  
  // Return cleanup function
  return () => {
    console.log(`[AgentHealthRecoverySystem] Shutting down automatic agent health recovery system`);
    clearInterval(intervalId);
  };
}