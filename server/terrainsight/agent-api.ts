/**
 * Agent API
 * 
 * This file provides API endpoints for interacting with the agent framework.
 */
import { Request, Response } from 'express';
import { initializeAgentFramework, masterControlProgram, agentManager } from '../shared/agent';
import { v4 as uuidv4 } from 'uuid';
import type { MessageType } from '../shared/agent/types';
import { AgentTier } from '../shared/agent/types';
import { agentHealthRecovery } from '../shared/agent/AgentHealthRecovery';

// Define EventType enum directly to avoid import issues
const EventType = {
  COMMAND: 'COMMAND',
  EVENT: 'EVENT',
  QUERY: 'QUERY',
  RESPONSE: 'RESPONSE',
  ERROR: 'ERROR',
  STATUS_UPDATE: 'STATUS_UPDATE',
  STRATEGIC_DIRECTIVE: 'STRATEGIC_DIRECTIVE',
  INTEGRATION_CHECKPOINT: 'INTEGRATION_CHECKPOINT',
  ARCHITECTURE_UPDATE: 'ARCHITECTURE_UPDATE',
  COORDINATION_REQUEST: 'COORDINATION_REQUEST',
  WORKFLOW_ASSIGNMENT: 'WORKFLOW_ASSIGNMENT'
} as const;

// We now import AgentTier from shared/agent/types.ts, so we can remove this duplicate definition
// Import statement for AgentTier has been added at the top of the file

// Initialize agent framework
let agentsInitialized = false;

/**
 * Initialize the agent framework if not already initialized
 */
function ensureAgentsInitialized() {
  if (!agentsInitialized) {
    console.log('Initializing agent framework...');
    initializeAgentFramework();
    agentsInitialized = true;
    console.log('Agent framework initialized successfully');
  }
}

/**
 * Register agent API routes
 * 
 * @param app Express application
 */
export function registerAgentRoutes(app: any) {
  // Ensure agents are initialized
  ensureAgentsInitialized();
  
  // Get agent information
  app.get('/api/agents', getAgents);
  
  // Get agent capabilities
  app.get('/api/agents/capabilities', getAgentCapabilities);
  
  // Execute agent
  app.post('/api/agents/:agentId/execute', executeAgent);
  
  // Get workflow definitions
  app.get('/api/workflows', getWorkflowDefinitions);
  
  // Execute workflow
  app.post('/api/workflows/:workflowId/execute', executeWorkflow);
  
  // Get workflow results
  app.get('/api/workflows/history', getWorkflowHistory);
  
  // Get workflow instance
  app.get('/api/workflows/instances/:instanceId', getWorkflowInstance);
  
  // System diagnostics
  app.get('/api/system/agent-diagnostics', getAgentDiagnostics);
  
  // Test agent communication
  app.post('/api/system/test-agent-communication', testAgentCommunication);
  
  // Test hierarchical agent communication with chain of command validation
  app.post('/api/agent/test-communication', testHierarchicalCommunication);
  
  // Broadcast a test message to all agents
  app.get('/api/agent/broadcast-message', broadcastAgentMessage);
  
  // Agent health monitoring routes
  app.get('/api/agents/health', getAgentHealth);
  app.post('/api/agents/:id/recover', recoverAgent);
  app.post('/api/agents/recover-all', recoverAllAgents);
  
  console.log('Agent API routes registered');
}

/**
 * Get all registered agents
 */
async function getAgents(req: Request, res: Response) {
  try {
    const agentIds = Array.from(masterControlProgram['agents'].keys());
    const agents = agentIds.map(id => {
      const agent = masterControlProgram['agents'].get(id);
      return {
        id: agent.id,
        name: agent.name,
        capabilities: agent.capabilities
      };
    });
    
    res.json({ agents });
  } catch (error) {
    console.error('Error getting agents:', error);
    res.status(500).json({ error: 'Failed to get agents' });
  }
}

/**
 * Get agent capabilities
 */
async function getAgentCapabilities(req: Request, res: Response) {
  try {
    const capabilities = Array.from(masterControlProgram['capabilities'].keys());
    const capabilitiesMap = {};
    
    for (const capability of capabilities) {
      const agentIds = masterControlProgram['capabilities'].get(capability);
      capabilitiesMap[capability] = agentIds;
    }
    
    res.json({ capabilities: capabilitiesMap });
  } catch (error) {
    console.error('Error getting agent capabilities:', error);
    res.status(500).json({ error: 'Failed to get agent capabilities' });
  }
}

/**
 * Execute an agent
 */
async function executeAgent(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    const { input, context } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }
    
    // Basic check for input object presence
    if (!input || typeof input !== 'object') {
      return res.status(400).json({ error: 'Input must be a non-null object' });
    }
    
    // Create execution context
    const executionContext = {
      executionId: uuidv4(),
      timestamp: new Date(),
      parameters: context?.parameters || {},
      accessLevel: context?.accessLevel || 'user',
      userId: req.body.userId || 'anonymous',
      log: (level: string, message: string, data?: any) => {
        console.log(`[API][${agentId}][${level.toUpperCase()}] ${message}`, data);
      }
    };
    
    // Execute agent via MasterControlProgram
    const result = await masterControlProgram.executeAgent(agentId, input, executionContext);
    
    // Check the result status and set HTTP status accordingly
    if (result.status === 'error') {
      // Determine appropriate HTTP status code based on error type/explanation
      // Default to 400 for validation-like errors, 500 for execution errors
      let statusCode = 500; 
      const isValidationError = result.explanation?.toLowerCase().includes('validation') || 
                                result.issues?.some(issue => issue.type === 'validation_error' || issue.type === 'invalid_type' || issue.type === 'missing_required_field');
      
      if (isValidationError) {
        statusCode = 400; // Bad Request for validation issues
      } else if (result.issues?.some(issue => issue.type === 'not_found')) {
        statusCode = 404; // Not Found if agent ID was invalid
      } else if (result.issues?.some(issue => issue.type === 'execution_error')) {
        statusCode = 500; // Internal Server Error for agent execution problems
      }

      console.error(`Agent execution failed for ${agentId} with status ${statusCode}:`, result);
      // Return the detailed error response from MCP with the determined HTTP status
      return res.status(statusCode).json(result);
    } else {
      // If status is not 'error' (e.g., 'success', 'warning'), return 200 OK
      res.status(200).json(result);
    }

  } catch (error) {
    // Catch any unexpected errors during the API handling itself
    console.error('Unexpected error in executeAgent endpoint:', error);
    res.status(500).json({ 
      status: 'error',
      explanation: 'Internal server error during agent execution',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get workflow definitions
 */
async function getWorkflowDefinitions(req: Request, res: Response) {
  try {
    const { category, enabled, tags, limit, offset } = req.query;
    
    // Find workflow agent
    const workflowAgent = Array.from(masterControlProgram['agents'].values())
      .find(agent => agent.id === 'workflow-agent');
    
    if (!workflowAgent) {
      return res.status(404).json({ error: 'Workflow agent not found' });
    }
    
    // Execute agent to get workflow definitions
    const result = await workflowAgent.process({
      operation: 'list_workflow_definitions',
      data: {
        category: category as string,
        enabled: enabled === 'true',
        tags: tags ? (tags as string).split(',') : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    }, {
      executionId: uuidv4(),
      timestamp: new Date(),
      parameters: {},
      accessLevel: 'system',
      log: (level, message, data) => {
        console.log(`[${level.toUpperCase()}] ${message}`, data);
      }
    });
    
    res.json(result.data);
  } catch (error) {
    console.error('Error getting workflow definitions:', error);
    res.status(500).json({ error: 'Failed to get workflow definitions' });
  }
}

/**
 * Execute a workflow
 */
async function executeWorkflow(req: Request, res: Response) {
  try {
    const { workflowId } = req.params;
    const { parameters, options } = req.body;
    
    if (!workflowId) {
      return res.status(400).json({ error: 'Workflow ID is required' });
    }
    
    if (!parameters) {
      return res.status(400).json({ error: 'Parameters are required' });
    }
    
    // Find workflow agent
    const workflowAgent = Array.from(masterControlProgram['agents'].values())
      .find(agent => agent.id === 'workflow-agent');
    
    if (!workflowAgent) {
      return res.status(404).json({ error: 'Workflow agent not found' });
    }
    
    // Execute agent to run workflow
    const result = await workflowAgent.process({
      operation: 'execute_workflow',
      data: {
        workflowId,
        parameters,
        options
      }
    }, {
      executionId: uuidv4(),
      timestamp: new Date(),
      parameters: {},
      accessLevel: 'system',
      userId: req.body.userId || 'anonymous',
      log: (level, message, data) => {
        console.log(`[${level.toUpperCase()}] ${message}`, data);
      }
    });
    
    res.json(result.data);
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({ 
      error: 'Failed to execute workflow',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get workflow history
 */
async function getWorkflowHistory(req: Request, res: Response) {
  try {
    const { limit } = req.query;
    
    // Get workflow history from MCP
    const history = masterControlProgram.getWorkflowHistory(
      limit ? parseInt(limit as string) : undefined
    );
    
    res.json({ history });
  } catch (error) {
    console.error('Error getting workflow history:', error);
    res.status(500).json({ error: 'Failed to get workflow history' });
  }
}

/**
 * Get workflow instance
 */
async function getWorkflowInstance(req: Request, res: Response) {
  try {
    const { instanceId } = req.params;
    
    if (!instanceId) {
      return res.status(400).json({ error: 'Instance ID is required' });
    }
    
    // Get workflow instance from MCP
    const instance = masterControlProgram.getWorkflowExecution(instanceId);
    
    if (!instance) {
      return res.status(404).json({ error: 'Workflow instance not found' });
    }
    
    res.json({ instance });
  } catch (error) {
    console.error('Error getting workflow instance:', error);
    res.status(500).json({ error: 'Failed to get workflow instance' });
  }
}

/**
 * Get agent system diagnostics
 */
async function getAgentDiagnostics(req: Request, res: Response) {
  try {
    // Get all agents
    const agents = Array.from(masterControlProgram['agents'].values());
    
    // Get agent status
    const agentStatus = await Promise.all(
      agents.map(async agent => {
        try {
          const status = await agent.getStatus();
          return {
            id: agent.id,
            name: agent.name,
            status
          };
        } catch (error) {
          return {
            id: agent.id,
            name: agent.name,
            status: {
              available: false,
              healthy: false,
              error: error instanceof Error ? error.message : String(error)
            }
          };
        }
      })
    );
    
    // Get system metrics
    const systemMetrics = {
      agentCount: agents.length,
      capabilityCount: masterControlProgram['capabilities'].size,
      workflowDefinitionCount: masterControlProgram['workflows']?.size || 0,
      workflowInstanceCount: masterControlProgram['workflowHistory']?.size || 0,
      uptime: process.uptime()
    };
    
    res.json({
      agents: agentStatus,
      metrics: systemMetrics,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting agent diagnostics:', error);
    res.status(500).json({ error: 'Failed to get agent diagnostics' });
  }
}

/**
 * Test inter-agent communication
 */
async function testAgentCommunication(req: Request, res: Response) {
  try {
    console.log('Starting agent communication test...');
    
    // Get references to our leadership agents
    const architectPrime = agentManager.getAgent('architect-prime');
    const integrationCoordinator = agentManager.getAgent('integration-coordinator');
    const bsbcMasterLead = agentManager.getAgent('bsbcmaster-lead');
    
    // Get references to domain agents
    const dataValidationAgent = agentManager.getAgent('data-validation-agent');
    const legalComplianceAgent = agentManager.getAgent('legal-compliance-agent');
    const valuationAgent = agentManager.getAgent('valuation-agent');
    const workflowAgent = agentManager.getAgent('workflow-agent');
    
    if (!architectPrime || !integrationCoordinator || !bsbcMasterLead) {
      return res.status(404).json({ error: 'One or more leadership agents not found' });
    }
    
    if (!dataValidationAgent || !legalComplianceAgent || !valuationAgent || !workflowAgent) {
      return res.status(404).json({ error: 'One or more domain agents not found' });
    }
    
    console.log('All agents found successfully');
    
    // Get status of all agents
    const allStatus = agentManager.getAllAgentStatus();
    const agentStatusObj = Object.fromEntries(
      [...allStatus.entries()].map(([id, status]) => [id, status])
    );
    
    const results = {
      agentStatus: agentStatusObj,
      messages: [] as any[]
    };
    
    // Create a test message from Architect Prime to all agents
    const broadcastMessage = masterControlProgram.createMessage(
      'broadcast',
      'architect-prime',
      'all',
      {
        action: 'status_check',
        timestamp: new Date().toISOString()
      },
      {
        priority: 'high',
        requiresAcknowledgment: true,
        correlationId: uuidv4(),
        eventType: EventType.COMMAND,
        senderTier: AgentTier.STRATEGIC_LEADERSHIP,
        relatedComponent: 'BSBCmaster'
      }
    );
    
    // Send the message
    try {
      console.log('Sending broadcast message from Architect Prime...');
      await masterControlProgram.sendMessage(broadcastMessage);
      console.log('Broadcast message sent successfully');
      results.messages.push({
        type: 'broadcast',
        id: broadcastMessage.id,
        status: 'sent',
        from: 'architect-prime',
        to: 'all',
        content: broadcastMessage.content
      });
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      results.messages.push({
        type: 'broadcast',
        status: 'error',
        from: 'architect-prime',
        to: 'all',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Create a direct message from Integration Coordinator to Data Validation Agent
    const directMessage = masterControlProgram.createMessage(
      'command' as MessageType,
      'integration-coordinator',
      'data-validation-agent',
      {
        action: 'validate_property',
        propertyId: 'TEST-123',
        timestamp: new Date().toISOString()
      },
      {
        priority: 'normal',
        requiresAcknowledgment: true,
        correlationId: uuidv4(),
        eventType: EventType.COMMAND,
        senderTier: AgentTier.TACTICAL_LEADERSHIP,
        recipientTier: AgentTier.SPECIALIST,
        integrationCheckpoint: {
          name: 'validation_request',
          status: 'pending',
          details: {
            validation_type: 'property',
            requested_at: new Date().toISOString()
          }
        }
      }
    );
    
    // Send the direct message
    try {
      console.log('Sending direct message from Integration Coordinator to Data Validation Agent...');
      await masterControlProgram.sendMessage(directMessage);
      console.log('Direct message sent successfully');
      results.messages.push({
        type: 'direct',
        id: directMessage.id,
        status: 'sent',
        from: 'integration-coordinator',
        to: 'data-validation-agent',
        content: directMessage.content
      });
    } catch (error) {
      console.error('Error sending direct message:', error);
      results.messages.push({
        type: 'direct',
        status: 'error',
        from: 'integration-coordinator',
        to: 'data-validation-agent',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Create a message from BSBCmaster Lead to Architect Prime - this should be flagged
    // as an invalid chain of command (component lead should go through integration coordinator)
    const invalidChainMessage = masterControlProgram.createMessage(
      'request' as MessageType,
      'bsbcmaster-lead',
      'architect-prime',
      {
        action: 'strategic_request',
        requestId: 'REQ-456',
        timestamp: new Date().toISOString()
      },
      {
        priority: 'high',
        requiresAcknowledgment: true,
        correlationId: uuidv4(),
        eventType: EventType.COMMAND,
        senderTier: AgentTier.COMPONENT_LEADERSHIP,
        recipientTier: AgentTier.STRATEGIC_LEADERSHIP,
        relatedComponent: 'BSBCmaster'
      }
    );
    
    // Send the message that should have invalid chain of command
    try {
      console.log('Sending message from BSBCmaster Lead to Architect Prime (invalid chain)...');
      await masterControlProgram.sendMessage(invalidChainMessage);
      console.log('Message sent successfully, checking chain of command validation');
      results.messages.push({
        type: 'chain_test',
        id: invalidChainMessage.id,
        status: 'sent',
        from: 'bsbcmaster-lead',
        to: 'architect-prime',
        chainOfCommandValid: invalidChainMessage.metadata.chainOfCommandValid,
        content: invalidChainMessage.content
      });
    } catch (error) {
      console.error('Error sending chain test message:', error);
      results.messages.push({
        type: 'chain_test',
        status: 'error',
        from: 'bsbcmaster-lead',
        to: 'architect-prime',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Wait for possible acknowledgments or responses
    console.log('Waiting for message processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Log test completion and return results
    console.log('Agent communication test completed');
    res.json({
      success: true,
      results,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error testing agent communication:', error);
    res.status(500).json({ 
      error: 'Failed to test agent communication',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Test hierarchical agent communication with chain of command validation
 */
async function testHierarchicalCommunication(req: Request, res: Response) {
  try {
    console.log('Starting hierarchical communication test with chain of command validation...');
    
    // Verify all leadership agents are available
    const architectPrime = agentManager.getAgent('architect-prime');
    const integrationCoordinator = agentManager.getAgent('integration-coordinator');
    const bsbcMasterLead = agentManager.getAgent('bsbcmaster-lead');
    
    // Verify domain agents are available
    const dataValidationAgent = agentManager.getAgent('data-validation-agent');
    const legalComplianceAgent = agentManager.getAgent('legal-compliance-agent');
    const valuationAgent = agentManager.getAgent('valuation-agent');
    
    if (!architectPrime || !integrationCoordinator || !bsbcMasterLead) {
      return res.status(404).json({ error: 'One or more leadership agents not found' });
    }
    
    if (!dataValidationAgent || !legalComplianceAgent || !valuationAgent) {
      return res.status(404).json({ error: 'One or more domain agents not found' });
    }
    
    console.log('All agents available for hierarchical communication test');
    
    const results = {
      messages: [] as any[],
      hierarchicalTests: [] as any[],
      chainOfCommand: {
        valid: [] as any[],
        invalid: [] as any[]
      }
    };
    
    // Test 1: Strategic Leadership -> Tactical Leadership -> Component Leadership -> Specialist
    // This is the proper chain of command
    
    // ArchitectPrime (Strategic) to IntegrationCoordinator (Tactical)
    const strategic1 = masterControlProgram.createMessage(
      'directive' as MessageType,
      'architect-prime',
      'integration-coordinator',
      {
        action: 'implement_strategic_directive',
        directiveId: 'DIR-001',
        description: 'Implement core BSBCmaster component architecture',
        timestamp: new Date().toISOString()
      },
      {
        priority: 'high',
        requiresAcknowledgment: true,
        correlationId: uuidv4(),
        eventType: EventType.STRATEGIC_DIRECTIVE,
        senderTier: AgentTier.STRATEGIC_LEADERSHIP,
        recipientTier: AgentTier.TACTICAL_LEADERSHIP,
        relatedComponent: 'BSBCmaster'
      }
    );
    
    try {
      await masterControlProgram.sendMessage(strategic1);
      console.log('Strategic directive sent successfully via proper chain of command');
      results.hierarchicalTests.push({
        level: 'Strategic -> Tactical',
        id: strategic1.id,
        status: 'sent',
        from: 'architect-prime',
        to: 'integration-coordinator',
        chainOfCommandValid: strategic1.metadata.chainOfCommandValid,
        content: strategic1.content
      });
      
      if (strategic1.metadata.chainOfCommandValid === true) {
        results.chainOfCommand.valid.push({
          id: strategic1.id,
          from: 'architect-prime (Strategic)',
          to: 'integration-coordinator (Tactical)',
          type: 'strategic_directive'
        });
      } else {
        results.chainOfCommand.invalid.push({
          id: strategic1.id,
          from: 'architect-prime (Strategic)',
          to: 'integration-coordinator (Tactical)',
          type: 'strategic_directive',
          reason: 'Expected valid chain of command but was marked invalid'
        });
      }
    } catch (error) {
      console.error('Error sending strategic directive:', error);
      results.hierarchicalTests.push({
        level: 'Strategic -> Tactical',
        status: 'error',
        from: 'architect-prime',
        to: 'integration-coordinator',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // IntegrationCoordinator (Tactical) to BSBCmasterLead (Component)
    const tactical1 = masterControlProgram.createMessage(
      'command' as MessageType,
      'integration-coordinator',
      'bsbcmaster-lead',
      {
        action: 'coordinate_component_development',
        taskId: 'TASK-001',
        description: 'Coordinate BSBCmaster component development',
        timestamp: new Date().toISOString()
      },
      {
        priority: 'high',
        requiresAcknowledgment: true,
        correlationId: uuidv4(),
        eventType: EventType.COORDINATION_REQUEST,
        senderTier: AgentTier.TACTICAL_LEADERSHIP,
        recipientTier: AgentTier.COMPONENT_LEADERSHIP,
        relatedComponent: 'BSBCmaster',
        integrationCheckpoint: {
          name: 'component_coordination',
          status: 'pending',
          details: {
            component: 'BSBCmaster',
            requested_at: new Date().toISOString()
          }
        }
      }
    );
    
    try {
      await masterControlProgram.sendMessage(tactical1);
      console.log('Tactical coordination request sent successfully via proper chain of command');
      results.hierarchicalTests.push({
        level: 'Tactical -> Component',
        id: tactical1.id,
        status: 'sent',
        from: 'integration-coordinator',
        to: 'bsbcmaster-lead',
        chainOfCommandValid: tactical1.metadata.chainOfCommandValid,
        content: tactical1.content
      });
      
      if (tactical1.metadata.chainOfCommandValid === true) {
        results.chainOfCommand.valid.push({
          id: tactical1.id,
          from: 'integration-coordinator (Tactical)',
          to: 'bsbcmaster-lead (Component)',
          type: 'coordination_request'
        });
      } else {
        results.chainOfCommand.invalid.push({
          id: tactical1.id,
          from: 'integration-coordinator (Tactical)',
          to: 'bsbcmaster-lead (Component)',
          type: 'coordination_request',
          reason: 'Expected valid chain of command but was marked invalid'
        });
      }
    } catch (error) {
      console.error('Error sending tactical coordination request:', error);
      results.hierarchicalTests.push({
        level: 'Tactical -> Component',
        status: 'error',
        from: 'integration-coordinator',
        to: 'bsbcmaster-lead',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // BSBCmasterLead (Component) to DataValidationAgent (Specialist)
    const component1 = masterControlProgram.createMessage(
      'command' as MessageType,
      'bsbcmaster-lead',
      'data-validation-agent',
      {
        action: 'validate_component_data',
        taskId: 'TASK-002',
        description: 'Validate BSBCmaster component data',
        timestamp: new Date().toISOString()
      },
      {
        priority: 'normal',
        requiresAcknowledgment: true,
        correlationId: uuidv4(),
        eventType: EventType.WORKFLOW_ASSIGNMENT,
        senderTier: AgentTier.COMPONENT_LEADERSHIP,
        recipientTier: AgentTier.SPECIALIST,
        relatedComponent: 'BSBCmaster'
      }
    );
    
    try {
      await masterControlProgram.sendMessage(component1);
      console.log('Component work assignment sent successfully via proper chain of command');
      results.hierarchicalTests.push({
        level: 'Component -> Specialist',
        id: component1.id,
        status: 'sent',
        from: 'bsbcmaster-lead',
        to: 'data-validation-agent',
        chainOfCommandValid: component1.metadata.chainOfCommandValid,
        content: component1.content
      });
      
      if (component1.metadata.chainOfCommandValid === true) {
        results.chainOfCommand.valid.push({
          id: component1.id,
          from: 'bsbcmaster-lead (Component)',
          to: 'data-validation-agent (Specialist)',
          type: 'workflow_assignment'
        });
      } else {
        results.chainOfCommand.invalid.push({
          id: component1.id,
          from: 'bsbcmaster-lead (Component)',
          to: 'data-validation-agent (Specialist)',
          type: 'workflow_assignment',
          reason: 'Expected valid chain of command but was marked invalid'
        });
      }
    } catch (error) {
      console.error('Error sending component work assignment:', error);
      results.hierarchicalTests.push({
        level: 'Component -> Specialist',
        status: 'error',
        from: 'bsbcmaster-lead',
        to: 'data-validation-agent',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Test 2: Invalid chain of command tests
    
    // Skip level: Strategic Leadership -> Component Leadership (skipping Tactical)
    const invalidChain1 = masterControlProgram.createMessage(
      'directive' as MessageType,
      'architect-prime',
      'bsbcmaster-lead',
      {
        action: 'implement_direct_directive',
        directiveId: 'DIR-002',
        description: 'Direct strategic directive to component lead (invalid chain)',
        timestamp: new Date().toISOString()
      },
      {
        priority: 'high',
        requiresAcknowledgment: true,
        correlationId: uuidv4(),
        eventType: EventType.STRATEGIC_DIRECTIVE,
        senderTier: AgentTier.STRATEGIC_LEADERSHIP,
        recipientTier: AgentTier.COMPONENT_LEADERSHIP,
        relatedComponent: 'BSBCmaster'
      }
    );
    
    try {
      await masterControlProgram.sendMessage(invalidChain1);
      console.log('Invalid chain test 1 message sent, checking chain of command validation');
      results.hierarchicalTests.push({
        level: 'Strategic -> Component (Invalid: Skips Tactical)',
        id: invalidChain1.id,
        status: 'sent',
        from: 'architect-prime',
        to: 'bsbcmaster-lead',
        chainOfCommandValid: invalidChain1.metadata.chainOfCommandValid,
        content: invalidChain1.content
      });
      
      if (invalidChain1.metadata.chainOfCommandValid === false) {
        results.chainOfCommand.invalid.push({
          id: invalidChain1.id,
          from: 'architect-prime (Strategic)',
          to: 'bsbcmaster-lead (Component)',
          type: 'strategic_directive',
          reason: 'Skipped tactical leadership tier'
        });
      } else {
        results.chainOfCommand.valid.push({
          id: invalidChain1.id,
          from: 'architect-prime (Strategic)',
          to: 'bsbcmaster-lead (Component)',
          type: 'strategic_directive',
          note: 'Expected invalid chain but was marked valid'
        });
      }
    } catch (error) {
      console.error('Error sending invalid chain test 1:', error);
      results.hierarchicalTests.push({
        level: 'Strategic -> Component (Invalid: Skips Tactical)',
        status: 'error',
        from: 'architect-prime',
        to: 'bsbcmaster-lead',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Reverse direction: Component Leadership -> Strategic Leadership
    const invalidChain2 = masterControlProgram.createMessage(
      'request' as MessageType,
      'bsbcmaster-lead',
      'architect-prime',
      {
        action: 'request_approval',
        requestId: 'REQ-001',
        description: 'Component lead direct request to architect prime (invalid chain)',
        timestamp: new Date().toISOString()
      },
      {
        priority: 'high',
        requiresAcknowledgment: true,
        correlationId: uuidv4(),
        eventType: EventType.COMMAND,
        senderTier: AgentTier.COMPONENT_LEADERSHIP,
        recipientTier: AgentTier.STRATEGIC_LEADERSHIP,
        relatedComponent: 'BSBCmaster'
      }
    );
    
    try {
      await masterControlProgram.sendMessage(invalidChain2);
      console.log('Invalid chain test 2 message sent, checking chain of command validation');
      results.hierarchicalTests.push({
        level: 'Component -> Strategic (Invalid: Skips Tactical)',
        id: invalidChain2.id,
        status: 'sent',
        from: 'bsbcmaster-lead',
        to: 'architect-prime',
        chainOfCommandValid: invalidChain2.metadata.chainOfCommandValid,
        content: invalidChain2.content
      });
      
      if (invalidChain2.metadata.chainOfCommandValid === false) {
        results.chainOfCommand.invalid.push({
          id: invalidChain2.id,
          from: 'bsbcmaster-lead (Component)',
          to: 'architect-prime (Strategic)',
          type: 'request',
          reason: 'Skipped tactical leadership tier'
        });
      } else {
        results.chainOfCommand.valid.push({
          id: invalidChain2.id,
          from: 'bsbcmaster-lead (Component)',
          to: 'architect-prime (Strategic)',
          type: 'request',
          note: 'Expected invalid chain but was marked valid'
        });
      }
    } catch (error) {
      console.error('Error sending invalid chain test 2:', error);
      results.hierarchicalTests.push({
        level: 'Component -> Strategic (Invalid: Skips Tactical)',
        status: 'error',
        from: 'bsbcmaster-lead',
        to: 'architect-prime',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Wait for processing
    console.log('Waiting for message processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    res.json({
      success: true,
      results,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error testing hierarchical communication:', error);
    res.status(500).json({ 
      error: 'Failed to test hierarchical communication',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Broadcast a test message to all agents
 */
async function broadcastAgentMessage(req: Request, res: Response) {
  try {
    const { message, priority, eventType } = req.query;
    
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Create a broadcast message from system to all agents
    const broadcastMessage = masterControlProgram.createMessage(
      'broadcast',
      'system',
      'all',
      {
        content: message,
        timestamp: new Date().toISOString()
      },
      {
        priority: (priority as string || 'normal') as any,
        requiresAcknowledgment: true,
        correlationId: uuidv4(),
        eventType: (eventType as string || EventType.COMMAND) as any,
        senderTier: AgentTier.SYSTEM
      }
    );
    
    // Send the message
    await masterControlProgram.sendMessage(broadcastMessage);
    
    res.json({
      success: true,
      messageId: broadcastMessage.id,
      sent: broadcastMessage.timestamp,
      recipients: 'all'
    });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({ 
      error: 'Failed to broadcast message',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get all agent health statuses
 */
async function getAgentHealth(req: Request, res: Response) {
  try {
    const agentStatusList = agentManager.getAllAgentStatus();
    
    const healthyCount = agentStatusList.filter(s => s.healthy).length;
    const systemStatus = healthyCount === agentStatusList.length ? 'healthy' : 'degraded';
    
    res.json({
      status: systemStatus,
      healthy: healthyCount,
      total: agentStatusList.length,
      unhealthy: agentStatusList.length - healthyCount,
      agents: agentStatusList.map(status => ({
        id: status.id,
        healthy: status.healthy,
        active: status.active
      }))
    });
  } catch (error) {
    console.error('Error getting agent health:', error);
    res.status(500).json({ 
      error: 'Error getting agent health',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Recover an unhealthy agent
 */
async function recoverAgent(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    const agent = agentManager.getAgent(id);
    const status = agentManager.getAgentStatus(id);
    
    if (!agent) {
      return res.status(404).json({ error: `Agent ${id} not found` });
    }
    
    if (!status) {
      return res.status(404).json({ error: `Status for agent ${id} not found` });
    }
    
    if (status.healthy) {
      return res.json({ 
        message: `Agent ${id} is already healthy`,
        success: true,
        agent: { id, healthy: true }
      });
    }
    
    const result = await agentHealthRecovery.recoverAgent(id, agent, status, {
      autoInitialize: true,
      forceHealthyStatus: true,
      maxAttempts: 3,
      cooldownMs: 1000
    });
    
    res.json({
      message: result.success 
        ? `Successfully recovered agent ${id}` 
        : `Failed to recover agent ${id}`,
      success: result.success,
      error: result.error,
      agent: {
        id,
        healthy: result.healthStatus,
        recoveryAttempts: result.attemptCount
      }
    });
  } catch (error) {
    console.error(`Error recovering agent ${id}:`, error);
    res.status(500).json({ 
      error: `Error recovering agent ${id}`,
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Recover all unhealthy agents
 */
async function recoverAllAgents(req: Request, res: Response) {
  try {
    const agentStatusList = agentManager.getAllAgentStatus();
    const unhealthyAgents = agentStatusList.filter(status => !status.healthy);
    
    if (unhealthyAgents.length === 0) {
      return res.json({
        message: 'All agents are healthy',
        success: true,
        recovered: 0,
        failed: 0,
        total: 0
      });
    }
    
    let successCount = 0;
    let failCount = 0;
    const results = [];
    
    // Recover each unhealthy agent
    for (const status of unhealthyAgents) {
      const agent = agentManager.getAgent(status.id);
      
      if (agent) {
        try {
          const result = await agentHealthRecovery.recoverAgent(status.id, agent, status, {
            autoInitialize: true,
            forceHealthyStatus: true,
            maxAttempts: 3,
            cooldownMs: 1000
          });
          
          results.push({
            id: status.id,
            success: result.success,
            error: result.error
          });
          
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          results.push({
            id: status.id,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
          failCount++;
        }
      } else {
        results.push({
          id: status.id,
          success: false,
          error: 'Agent not found'
        });
        failCount++;
      }
    }
    
    // Get updated status
    const updatedStatusList = agentManager.getAllAgentStatus();
    const remainingUnhealthy = updatedStatusList.filter(status => !status.healthy).length;
    
    res.json({
      message: `Recovered ${successCount} of ${unhealthyAgents.length} unhealthy agents`,
      success: failCount === 0,
      recovered: successCount,
      failed: failCount,
      total: unhealthyAgents.length,
      remaining: remainingUnhealthy,
      systemStatus: remainingUnhealthy === 0 ? 'healthy' : 'degraded',
      results
    });
  } catch (error) {
    console.error('Error recovering agents:', error);
    res.status(500).json({ 
      error: 'Error recovering agents',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}