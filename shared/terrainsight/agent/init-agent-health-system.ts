/**
 * Agent Health System Initialization
 * 
 * This module initializes the agent health monitoring and recovery systems
 * to ensure the health of all agents in the multi-agent system.
 */

import { agentManager } from './AgentManager';
import { masterControlProgram } from './MasterControlProgram';
import { AgentHealthMonitor } from './AgentHealthMonitor';
import { agentHealthRecovery } from './AgentHealthRecovery';
import { eventLogger, EventType } from './EventLogger';

/**
 * Initialize the agent health monitoring and recovery systems
 */
export async function initializeAgentHealthSystem() {
  try {
    // Get agents and create maps
    const agentsList = agentManager.getAllAgents();
    const agentStatusList = agentManager.getAllAgentStatus();
    
    // Convert to maps for the health monitor
    const agents = new Map();
    const agentStatus = new Map();
    
    // Populate agents map
    agentsList.forEach(agent => {
      if (agent && agent.id) {
        agents.set(agent.id, agent);
      }
    });
    
    // Populate agent status map
    agentStatusList.forEach(status => {
      if (status && status.id) {
        agentStatus.set(status.id, status);
      }
    });
    
    // Create health monitor
    const healthMonitor = new AgentHealthMonitor(
      agents,
      agentStatus,
      masterControlProgram
    );
    
    // Start health monitoring
    healthMonitor.start(
      60000,  // Check health every minute
      300000  // Check performance every 5 minutes
    );
    
    // Check and recover any existing unhealthy agents
    const unhealthyAgentIds: string[] = [];
    
    // Manually iterate through entries to avoid compatibility issues
    agentStatus.forEach((status, id) => {
      if (status && !status.healthy) {
        unhealthyAgentIds.push(id);
      }
    });
    
    if (unhealthyAgentIds.length > 0) {
      eventLogger.log({
        type: EventType.INFO,
        source: 'AgentHealthSystem',
        message: `Found ${unhealthyAgentIds.length} unhealthy agents during startup, attempting recovery`,
        data: { unhealthyAgentIds }
      });
      
      // Recover each unhealthy agent
      for (const agentId of unhealthyAgentIds) {
        const agent = agents.get(agentId);
        const status = agentStatus.get(agentId);
        
        if (agent && status) {
          await agentHealthRecovery.recoverAgent(agentId, agent, status, {
            autoInitialize: true,
            forceHealthyStatus: true,
            maxAttempts: 1
          });
        }
      }
    }
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'AgentHealthSystem',
      message: 'Agent health system initialized and started',
      data: {
        agentCount: agents.size,
        unhealthyAgentsAtStartup: unhealthyAgentIds.length
      }
    });
    
    return healthMonitor;
  } catch (error) {
    eventLogger.log({
      type: EventType.ERROR,
      source: 'AgentHealthSystem',
      message: `Error initializing agent health system: ${error instanceof Error ? error.message : String(error)}`,
      data: error
    });
    throw error;
  }
}