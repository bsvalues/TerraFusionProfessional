/**
 * Agent Framework
 * 
 * This file exports the complete agent framework for the Benton County Assessor's Office platform.
 */

// Base types
export * from './types';

// Agent interface and base implementation
export * from './Agent';

// Configuration
export * from './config';

// Core (Master Hub)
export * from './Core';

// Agent Manager
export * from './AgentManager';

// Master Control Program
export * from './MasterControlProgram';

// Event Logger (importing only EventSeverity as we import eventLogger below)
import { EventSeverity } from './EventLogger';
export { EventSeverity };

// Replay Buffer
export * from './ReplayBuffer';

// Audit Logger (for regulatory compliance)
export * from './AuditLogger';

// Agent Collaboration Service
export * from './AgentCollaborationService';

// Workflow Manager
export * from './WorkflowManager';

// Workflow definitions
export * from './workflows/AssessmentWorkflow';
export * from './workflows/GeospatialWorkflow';

// Import specialized agents
import { DataValidationAgent } from './DataValidationAgent';
import { LegalComplianceAgent } from './LegalComplianceAgent';
import { ValuationAgent } from './ValuationAgent';
import { WorkflowAgent } from './WorkflowAgent';

// Import leadership hierarchy agents
import { ArchitectPrimeAgent } from './ArchitectPrimeAgent';
import { IntegrationCoordinatorAgent } from './IntegrationCoordinatorAgent';
import { ComponentLeadAgent } from './ComponentLeadAgent';
import { BSBCmasterLeadAgent } from './BSBCmasterLeadAgent';

// Re-export the specialized agents
export { 
  DataValidationAgent, 
  LegalComplianceAgent, 
  ValuationAgent, 
  WorkflowAgent,
  // Leadership hierarchy
  ArchitectPrimeAgent,
  IntegrationCoordinatorAgent,
  ComponentLeadAgent,
  BSBCmasterLeadAgent
};

// Import and re-export the singleton instances
import { core } from './Core';
import { masterControlProgram } from './MasterControlProgram';
import { agentManager } from './AgentManager';
import { replayBuffer } from './ReplayBuffer';
import { eventLogger, EventType } from './EventLogger';
import { agentCollaborationService } from './AgentCollaborationService';
import { auditLogger } from './AuditLogger';
import { workflowManager, initializeWorkflowSystem } from './WorkflowManager';

// Re-export the singleton instances
export { 
  core, 
  masterControlProgram, 
  agentManager, 
  replayBuffer, 
  eventLogger,
  agentCollaborationService,
  auditLogger,
  workflowManager
};

// Import the development agents initialization
import { registerDevAgents } from './initDevAgents';

/**
 * Initialize the agent framework
 * 
 * This function initializes the complete agent framework by:
 * 1. Starting the Core (Master Hub)
 * 2. Initializing the AgentManager with agents
 * 3. Configuring the MCP
 * 4. Setting up the AuditLogger for regulatory compliance
 * 5. Initializing the WorkflowManager with workflow definitions
 * 6. Registering development agents for building assistance
 * 
 * @returns The initialized system components
 */
export async function initializeAgentFramework() {
  // Start the Core
  await core.start();
  
  // Initialize agents through AgentManager
  await agentManager.initializeAgents();
  
  // Initialize workflow system
  initializeWorkflowSystem();
  
  // Register the Core with itself as a module
  core.registerModule('core', core);
  core.registerModule('masterControlProgram', masterControlProgram);
  core.registerModule('agentManager', agentManager);
  core.registerModule('replayBuffer', replayBuffer);
  core.registerModule('eventLogger', eventLogger);
  core.registerModule('agentCollaborationService', agentCollaborationService);
  core.registerModule('auditLogger', auditLogger);
  core.registerModule('workflowManager', workflowManager);
  
  // Initialize agent health monitoring and recovery system
  // Dynamic import to avoid circular dependencies
  try {
    const { initializeAgentHealthSystem } = await import('./init-agent-health-system');
    const healthMonitor = await initializeAgentHealthSystem();
    core.registerModule('agentHealthMonitor', healthMonitor);
    eventLogger.log({
      type: EventType.INFO,
      source: 'AgentFramework',
      message: 'Agent health monitoring and recovery system initialized successfully'
    });
  } catch (error) {
    eventLogger.log({
      type: EventType.ERROR,
      source: 'AgentFramework',
      message: `Failed to initialize agent health system: ${error instanceof Error ? error.message : String(error)}`,
      data: error
    });
  }
  
  // Register the development agents for building assistance
  await registerDevAgents(masterControlProgram);
  
  // Return the system components
  return {
    core,
    masterControlProgram,
    agentManager,
    replayBuffer,
    eventLogger,
    agentCollaborationService,
    auditLogger,
    workflowManager
  };
}