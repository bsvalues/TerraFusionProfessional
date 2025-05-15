/**
 * Master Control Program (MCP)
 * 
 * This is the central coordinator for the multi-agent system.
 * It manages agent registration, discovery, and orchestration of agent workflows.
 * 
 * The MCP also implements experience replay and continuous learning mechanisms
 * to enable agent collaboration, dynamic task delegation, and adaptive behavior.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  Agent, 
  BaseAgent 
} from './Agent';
import { 
  AgentCapability,
  AgentContext,
  AgentMessage,
  AgentResponse,
  AgentWorkflow,
  MessageFilter,
  MessageHandler,
  MessagePriority,
  MessageType,
  WorkflowResult,
  EventType as MessageEventType,
  AgentTier
} from './types';
import { replayBuffer, ReplayBuffer, Experience } from './ReplayBuffer';
import { eventLogger, EventLogger, EventType, EventSeverity } from './EventLogger';

/**
 * Master Control Program for orchestrating agents
 */
export class MasterControlProgram {
  /** Registered agents by ID */
  private agents: Map<string, Agent> = new Map();
  
  /** Registered capabilities and which agents provide them */
  private capabilities: Map<AgentCapability, string[]> = new Map();
  
  /** Registered workflows */
  private workflows: Map<string, AgentWorkflow> = new Map();
  
  /** Workflow execution history */
  private workflowHistory: Map<string, WorkflowResult> = new Map();
  
  /** Message buffer for inter-agent communication */
  private messageBuffer: AgentMessage[] = [];
  
  /** Active message subscriptions */
  private subscriptions: Map<string, {
    handler: MessageHandler;
    filter?: MessageFilter;
  }> = new Map();
  
  /** Logger instance */
  private logger: (level: string, message: string, data?: any) => void;
  
  /**
   * Initialize a new MCP
   * 
   * @param logger Optional logger function
   */
  constructor(logger?: (level: string, message: string, data?: any) => void) {
    this.logger = logger || ((level, message) => {
      console.log(`[MCP][${level.toUpperCase()}] ${message}`);
    });
    
    this.log('info', 'Master Control Program initialized');
  }
  
  /**
   * Register a new agent with the MCP
   * 
   * @param agent The agent to register
   */
  registerAgent(agent: Agent): void {
    if (this.agents.has(agent.id)) {
      this.log('warn', `Agent with ID ${agent.id} already registered. Replacing.`);
    }
    
    this.agents.set(agent.id, agent);
    
    // Register agent capabilities
    for (const capability of agent.capabilities) {
      const providers = this.capabilities.get(capability) || [];
      providers.push(agent.id);
      this.capabilities.set(capability, providers);
    }
    
    this.log('info', `Registered agent: ${agent.name} (${agent.id})`);
  }
  
  /**
   * Register a workflow with the MCP
   * 
   * @param workflow The workflow to register
   */
  registerWorkflow(workflow: AgentWorkflow): void {
    if (this.workflows.has(workflow.id)) {
      this.log('warn', `Workflow with ID ${workflow.id} already registered. Replacing.`);
    }
    
    this.workflows.set(workflow.id, workflow);
    this.log('info', `Registered workflow: ${workflow.name} (${workflow.id})`);
  }
  
  /**
   * Get an agent by ID
   * 
   * @param agentId The agent ID
   * @returns The agent or undefined if not found
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get agents by capability
   * 
   * @param capability The capability to search for
   * @returns Array of agents that have the capability
   */
  getAgentsByCapability(capability: AgentCapability): Agent[] {
    const agentIds = this.capabilities.get(capability) || [];
    return agentIds
      .map(id => this.agents.get(id))
      .filter((agent): agent is Agent => agent !== undefined);
  }
  
  /**
   * Get a workflow by ID
   * 
   * @param workflowId The workflow ID
   * @returns The workflow or undefined if not found
   */
  getWorkflow(workflowId: string): AgentWorkflow | undefined {
    return this.workflows.get(workflowId);
  }
  
  /**
   * Find agents that match a capability pattern
   * 
   * @param pattern Capability pattern (can be a string or regex)
   * @returns Array of matching agents
   */
  findAgents(pattern: string | RegExp): Agent[] {
    const matchedAgents = new Set<Agent>();
    
    this.capabilities.forEach((agentIds, capability) => {
      const matches = typeof pattern === 'string' 
        ? capability === pattern
        : pattern.test(capability);
      
      if (matches) {
        agentIds.forEach(id => {
          const agent = this.agents.get(id);
          if (agent) {
            matchedAgents.add(agent);
          }
        });
      }
    });
    
    return Array.from(matchedAgents);
  }
  
  /**
   * Execute a specific agent by ID
   * 
   * @param agentId The agent ID
   * @param input The input data for the agent
   * @param contextParams Additional context parameters
   * @returns The agent response
   */
  async executeAgent(
    agentId: string, 
    input: any, 
    contextParams: Partial<AgentContext> = {}
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return {
        status: 'error',
        data: null,
        explanation: `Agent with ID ${agentId} not found`,
        issues: [{
          type: 'not_found',
          severity: 'critical',
          message: `Agent with ID ${agentId} not found`
        }]
      };
    }
    
    // Create execution context
    const context: AgentContext = {
      executionId: uuidv4(),
      timestamp: new Date(),
      parameters: {},
      accessLevel: 'system',
      log: (level, message, data) => {
        this.log(level, `[Agent:${agent.id}] ${message}`, data);
      },
      ...contextParams
    };
    
    try {
      // Validate input
      const validationResult = await agent.validateInput(input);
      if (!validationResult.isValid) {
        return {
          status: 'error',
          data: null,
          explanation: 'Input validation failed',
          issues: validationResult.issues.map(issue => ({
            type: issue.type,
            severity: issue.severity === 'CRITICAL' ? 'critical' : 
                     issue.severity === 'HIGH' ? 'high' : 
                     issue.severity === 'MEDIUM' ? 'medium' : 'low',
            message: issue.description,
            details: { field: issue.field, remediation: issue.remediation }
          }))
        };
      }
      
      // Process the request
      const startTime = Date.now();
      const response = await agent.process(validationResult.validatedData || input, context);
      const endTime = Date.now();
      
      // Add execution metrics if not present
      if (!response.metrics) {
        response.metrics = { executionTimeMs: endTime - startTime };
      } else if (!response.metrics.executionTimeMs) {
        response.metrics.executionTimeMs = endTime - startTime;
      }
      
      return response;
    } catch (error) {
      this.log('error', `Error executing agent ${agent.id}`, error);
      
      return {
        status: 'error',
        data: null,
        explanation: `Error executing agent: ${error instanceof Error ? error.message : String(error)}`,
        issues: [{
          type: 'execution_error',
          severity: 'critical',
          message: `Error executing agent: ${error instanceof Error ? error.message : String(error)}`,
          details: error
        }]
      };
    }
  }
  
  /**
   * Execute a workflow by ID
   * 
   * @param workflowId The workflow ID
   * @param input The input data for the workflow
   * @param contextParams Additional context parameters
   * @returns The workflow result
   */
  async executeWorkflow(
    workflowId: string,
    input: any,
    contextParams: Partial<AgentContext> = {}
  ): Promise<WorkflowResult> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }
    
    if (!workflow.isEnabled) {
      throw new Error(`Workflow with ID ${workflowId} is disabled`);
    }
    
    // Create execution context
    const executionId = uuidv4();
    const startTime = new Date();
    
    const context: AgentContext = {
      executionId,
      workflowId,
      timestamp: startTime,
      parameters: { ...workflow.parameters },
      accessLevel: 'system',
      log: (level, message, data) => {
        this.log(level, `[Workflow:${workflow.id}:${executionId}] ${message}`, data);
      },
      ...contextParams
    };
    
    this.log('info', `Starting workflow execution: ${workflow.name} (${workflow.id})`, { executionId });
    
    // Initialize result
    const workflowResult: WorkflowResult = {
      workflowId,
      executionId,
      status: 'success',
      stepResults: {},
      output: {},
      startTime,
      endTime: new Date(), // Will be updated at the end
      errors: []
    };
    
    // Execute each step in sequence
    const workflowData: Record<string, any> = { input };
    
    try {
      for (const step of workflow.steps) {
        // Check step condition
        if (step.condition) {
          // Very simple condition evaluation - in a real system, use a proper expression evaluator
          if (!this.evaluateCondition(step.condition, workflowData)) {
            this.log('info', `Skipping step ${step.id} due to condition: ${step.condition}`);
            continue;
          }
        }
        
        // Map inputs for this step
        const stepInput = this.mapWorkflowData(workflowData, step.inputMapping);
        
        // Execute the agent
        try {
          const stepResult = await this.executeAgent(
            step.agentId,
            stepInput,
            {
              ...context,
              parameters: { ...context.parameters, stepId: step.id }
            }
          );
          
          // Store the result
          workflowResult.stepResults[step.id] = stepResult;
          
          // Map outputs from this step
          this.mapStepOutput(workflowData, stepResult, step.outputMapping);
          
          // Handle errors
          if (stepResult.status === 'error' && !step.continueOnError) {
            workflowResult.status = 'error';
            if (!workflowResult.errors) workflowResult.errors = [];
            workflowResult.errors.push({
              stepId: step.id,
              message: stepResult.explanation || 'Step execution failed',
              details: stepResult.issues
            });
            break;
          } else if (stepResult.status === 'error' && step.continueOnError) {
            if (workflowResult.status !== 'error') {
              workflowResult.status = 'partial_success';
            }
            if (!workflowResult.errors) workflowResult.errors = [];
            workflowResult.errors.push({
              stepId: step.id,
              message: stepResult.explanation || 'Step execution failed, continuing as specified',
              details: stepResult.issues
            });
          }
        } catch (error) {
          // Handle step execution error
          workflowResult.stepResults[step.id] = {
            status: 'error',
            data: null,
            explanation: `Error executing step: ${error instanceof Error ? error.message : String(error)}`
          };
          
          if (!step.continueOnError) {
            workflowResult.status = 'error';
            if (!workflowResult.errors) workflowResult.errors = [];
            workflowResult.errors.push({
              stepId: step.id,
              message: `Error executing step: ${error instanceof Error ? error.message : String(error)}`,
              details: error
            });
            break;
          } else {
            if (workflowResult.status !== 'error') {
              workflowResult.status = 'partial_success';
            }
            if (!workflowResult.errors) workflowResult.errors = [];
            workflowResult.errors.push({
              stepId: step.id,
              message: `Error executing step (continuing): ${error instanceof Error ? error.message : String(error)}`,
              details: error
            });
          }
        }
      }
      
      // Set the final output
      workflowResult.output = workflowData.output || {};
    } catch (error) {
      // Handle workflow-level error
      workflowResult.status = 'error';
      if (!workflowResult.errors) workflowResult.errors = [];
      workflowResult.errors.push({
        message: `Workflow execution error: ${error instanceof Error ? error.message : String(error)}`,
        details: error
      });
    }
    
    // Finalize the workflow execution
    workflowResult.endTime = new Date();
    
    // Store the workflow result in history
    this.workflowHistory.set(executionId, workflowResult);
    
    this.log('info', `Completed workflow execution: ${workflow.name} (${workflow.id})`, {
      executionId,
      status: workflowResult.status,
      duration: workflowResult.endTime.getTime() - workflowResult.startTime.getTime()
    });
    
    return workflowResult;
  }
  
  /**
   * Get workflow execution history
   * 
   * @param limit Maximum number of results to return (default: 100)
   * @returns Array of workflow results, newest first
   */
  getWorkflowHistory(limit: number = 100): WorkflowResult[] {
    const results = Array.from(this.workflowHistory.values());
    results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    return results.slice(0, limit);
  }
  
  /**
   * Get a specific workflow execution result by ID
   * 
   * @param executionId The execution ID
   * @returns The workflow result or undefined if not found
   */
  getWorkflowExecution(executionId: string): WorkflowResult | undefined {
    return this.workflowHistory.get(executionId);
  }
  
  /**
   * Send a message from one agent to another
   * 
   * @param message The message to send
   * @returns Promise that resolves when the message is delivered
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    // Add the message to the buffer
    this.messageBuffer.push(message);
    
    // Log the message
    this.log('info', `Message sent from ${message.senderId} to ${message.recipientId}`, {
      messageId: message.id,
      messageType: message.type,
      priority: message.priority
    });
    
    // Deliver the message
    await this.deliverMessage(message);
  }
  
  /**
   * Register a message handler for an agent
   * 
   * @param agentId The agent ID
   * @param handler The message handler function
   * @param filter Optional filter for messages
   * @returns Subscription ID that can be used to unsubscribe
   */
  subscribeToMessages(
    agentId: string,
    handler: MessageHandler,
    filter?: MessageFilter
  ): string {
    const subscriptionId = `sub_${uuidv4()}`;
    
    // Get the agent tier if not provided in filter
    let agentTier = filter?.recipientTier;
    if (!agentTier) {
      const agent = this.getAgent(agentId);
      if (agent) {
        // Determine tier based on agent ID
        if (agentId === 'architect-prime') {
          agentTier = AgentTier.STRATEGIC_LEADERSHIP;
        } else if (agentId === 'integration-coordinator') {
          agentTier = AgentTier.TACTICAL_LEADERSHIP;
        } else if (agentId.includes('lead') || agentId.includes('-lead')) {
          agentTier = AgentTier.COMPONENT_LEADERSHIP;
        } else if (agentId === 'core' || agentId === 'master-control-program') {
          agentTier = AgentTier.SYSTEM;
        } else {
          agentTier = AgentTier.SPECIALIST;
        }
      }
    }
    
    // Create enhanced filter with leadership hierarchy information
    const enhancedFilter = filter ? 
      { 
        ...filter, 
        senderId: agentId,
        recipientTier: agentTier 
      } : 
      { 
        senderId: agentId,
        recipientTier: agentTier 
      };
    
    this.subscriptions.set(subscriptionId, {
      handler,
      filter: enhancedFilter
    });
    
    this.log('info', `Agent ${agentId} subscribed to messages`, { 
      subscriptionId,
      filter: enhancedFilter,
      agentTier
    });
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from messages
   * 
   * @param subscriptionId The subscription ID
   * @returns True if the subscription was found and removed
   */
  unsubscribeFromMessages(subscriptionId: string): boolean {
    const found = this.subscriptions.has(subscriptionId);
    
    if (found) {
      this.subscriptions.delete(subscriptionId);
      this.log('info', `Unsubscribed from messages`, { subscriptionId });
    }
    
    return found;
  }
  
  /**
   * Get recent messages for a specific agent
   * 
   * @param agentId The agent ID
   * @param filter Optional filter for messages
   * @param limit Maximum number of messages to return
   * @returns Array of messages, newest first
   */
  getMessages(
    agentId: string,
    filter?: Omit<MessageFilter, 'senderId'>,
    limit: number = 100
  ): AgentMessage[] {
    // Determine the agent tier if available
    let agentTier: AgentTier | undefined;
    if (agentId === 'architect-prime') {
      agentTier = AgentTier.STRATEGIC_LEADERSHIP;
    } else if (agentId === 'integration-coordinator') {
      agentTier = AgentTier.TACTICAL_LEADERSHIP;
    } else if (agentId.includes('lead') || agentId.includes('-lead')) {
      agentTier = AgentTier.COMPONENT_LEADERSHIP;
    } else if (agentId === 'core' || agentId === 'master-control-program') {
      agentTier = AgentTier.SYSTEM;
    } else {
      agentTier = AgentTier.SPECIALIST;
    }
    
    // Create enhanced filter with leadership hierarchy information
    const enhancedFilter = filter ? 
      { 
        ...filter,
        recipientTier: filter.recipientTier || agentTier
      } : 
      { 
        recipientTier: agentTier 
      };
    
    let messages = this.messageBuffer.filter(message => {
      // Include messages that are addressed to this agent or broadcast to all
      const isRecipient = message.recipientId === agentId || message.recipientId === 'all';
      
      if (!isRecipient) return false;
      
      // Apply leadership hierarchy validation
      if (agentTier !== AgentTier.SYSTEM) {
        // Check for valid chain of command
        if (message.metadata.chainOfCommandValid === false) {
          // Only system agents can see invalid chain of command messages
          return false;
        }
        
        // Apply tier-based filtering based on chain of command
        const senderTier = message.metadata.senderTier;
        
        if (senderTier && agentTier) {
          // Special case: Specialists generally only receive messages from their direct component lead
          // or from integration coordinator for specific events
          if (agentTier === AgentTier.SPECIALIST) {
            // Specialists can receive messages from:
            // 1. Component leaders (their direct supervisors)
            // 2. Integration Coordinator for specific events
            // 3. System-level messages
            const validSources = [
              AgentTier.COMPONENT_LEADERSHIP,
              AgentTier.SYSTEM
            ];
            
            // Add Tactical leader if it's a specific coordination event
            if (message.eventType === 'INTEGRATION_CHECKPOINT' || 
                message.eventType === 'COORDINATION_REQUEST' ||
                message.eventType === 'WORKFLOW_ASSIGNMENT') {
              validSources.push(AgentTier.TACTICAL_LEADERSHIP);
            }
            
            if (!validSources.includes(senderTier)) {
              return false;
            }
          }
          
          // Component leads can receive messages from Integration Coordinator and Architect Prime
          if (agentTier === AgentTier.COMPONENT_LEADERSHIP) {
            // Component leads can receive messages from:
            // 1. Tactical leaders (Integration Coordinator)
            // 2. System-level messages
            // 3. Their specialist agents
            const validSources = [
              AgentTier.TACTICAL_LEADERSHIP,
              AgentTier.SYSTEM,
              AgentTier.SPECIALIST
            ];
            
            // Only specific messages from Strategic level
            if (senderTier === AgentTier.STRATEGIC_LEADERSHIP) {
              if (message.eventType === 'STRATEGIC_DIRECTIVE' || 
                  message.eventType === 'ARCHITECTURE_UPDATE') {
                validSources.push(AgentTier.STRATEGIC_LEADERSHIP);
              } else {
                return false;
              }
            }
            
            if (!validSources.includes(senderTier)) {
              return false;
            }
          }
        }
      }
      
      // Apply additional filters if provided
      if (filter) {
        if (filter.types && !filter.types.includes(message.type)) return false;
        if (filter.minPriority) {
          const priorityValues = { low: 1, normal: 2, high: 3, urgent: 4 };
          if (priorityValues[message.priority] < priorityValues[filter.minPriority]) return false;
        }
        if (filter.conversationId && message.conversationId !== filter.conversationId) return false;
        
        // Filter by event type
        if (filter.eventTypes && filter.eventTypes.length > 0 && 
            (!message.eventType || !filter.eventTypes.includes(message.eventType))) {
          return false;
        }
        
        // Filter by integration checkpoint status
        if (filter.integrationCheckpointStatus && 
            (!message.metadata.integrationCheckpoint || 
             message.metadata.integrationCheckpoint.status !== filter.integrationCheckpointStatus)) {
          return false;
        }
        
        // Filter by related component
        if (filter.relatedComponent && 
            (!message.metadata.relatedComponent || 
             message.metadata.relatedComponent !== filter.relatedComponent)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort by timestamp, newest first
    messages.sort((a, b) => {
      const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timestampB - timestampA;
    });
    
    // Return limited number of messages
    return messages.slice(0, limit);
  }
  
  /**
   * Deliver a message to its recipient
   * 
   * @param message The message to deliver
   */
  private async deliverMessage(message: AgentMessage): Promise<void> {
    // Log the message being sent
    eventLogger.log({
      type: EventType.INFO,
      source: 'MasterControlProgram',
      message: `Message sent from ${message.source} to ${message.target}`,
      data: {
        messageId: message.id,
        messageSource: message.source,
        messageTarget: message.target,
        messageCategory: message.category,
        messageContent: message.content,
        priority: message.priority,
        messageType: message.type,
        conversationId: message.conversationId
      }
    });
    
    // Handle broadcast messages
    if (message.recipientId === 'all') {
      // Find all subscriptions and deliver to each one
      const subscriptions = Array.from(this.subscriptions.entries());
      for (const [subscriptionId, subscription] of subscriptions) {
        try {
          if (this.messageMatchesFilter(message, subscription.filter)) {
            // Log message received by subscription
            const subscriberId = subscription.filter?.senderId || 'unknown';
            eventLogger.log({
              type: EventType.INFO,
              source: 'MasterControlProgram',
              message: `Message received by ${subscriberId}`,
              data: {
                messageId: message.id,
                messageSource: message.source,
                messageTarget: message.target,
                messageContent: message.content,
                messageType: message.type,
                subscriptionId,
                deliveryType: 'broadcast'
              }
            });
            
            // Capture state before processing
            const initialState = { 
              messageReceived: true,
              subscriptionActive: true,
              messageType: message.type
            };
            
            // Handle the message
            await subscription.handler(message);
            
            // Record the experience in the replay buffer
            replayBuffer.add({
              agentId: subscriberId,
              state: initialState,
              action: { handleMessage: true, messageId: message.id },
              result: { messageProcessed: true, success: true },
              nextState: { messageHandled: true },
              priority: this.calculateExperiencePriority(message, true)
            });
          }
        } catch (error) {
          this.log('error', `Error delivering broadcast message to subscription ${subscriptionId}`, error);
          
          // Log the error
          eventLogger.log({
            type: EventType.ERROR,
            severity: EventSeverity.HIGH,
            source: 'MasterControlProgram',
            message: `Error processing broadcast message ${message.id}`,
            data: {
              agentId: subscription.filter?.senderId || 'unknown',
              messageId: message.id,
              error: error
            }
          });
          
          // Record the error experience in the replay buffer
          replayBuffer.add({
            agentId: subscription.filter?.senderId || 'unknown',
            state: { messageReceived: true, messageType: message.type },
            action: { handleMessage: true, messageId: message.id },
            result: { messageProcessed: false, error: String(error) },
            nextState: { messageHandled: false, errorState: true },
            priority: this.calculateExperiencePriority(message, false)
          });
        }
      }
      return;
    }
    
    // Handle direct messages
    const recipientAgent = this.agents.get(message.recipientId);
    
    if (!recipientAgent) {
      this.log('warn', `Message recipient agent not found: ${message.recipientId}`, { 
        messageId: message.id
      });
      
      // Log the error
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.MEDIUM,
        source: 'MasterControlProgram',
        message: `Message delivery failure: Recipient agent not found: ${message.recipientId}`,
        data: {
          agentId: 'system',
          messageId: message.id
        }
      });
      return;
    }
    
    // If agent implements handleMessage, call it directly
    if (recipientAgent.handleMessage) {
      try {
        await recipientAgent.handleMessage(message);
        
        // Update acknowledgment if required
        if (message.metadata.requiresAcknowledgment) {
          message.metadata.acknowledged = true;
        }
      } catch (error) {
        this.log('error', `Error delivering message to agent ${message.recipientId}`, error);
      }
    } else {
      this.log('warn', `Agent ${message.recipientId} does not implement handleMessage`, { 
        messageId: message.id
      });
    }
    
    // Find any subscriptions for this agent and deliver through those as well
    const subscriptions = Array.from(this.subscriptions.entries());
    for (const [subscriptionId, subscription] of subscriptions) {
      try {
        if (this.messageMatchesFilter(message, subscription.filter)) {
          await subscription.handler(message);
        }
      } catch (error) {
        this.log('error', `Error delivering message to subscription ${subscriptionId}`, error);
      }
    }
  }
  
  /**
   * Check if a message matches a filter
   * 
   * @param message The message to check
   * @param filter The filter to apply
   * @returns True if the message matches the filter
   */
  private messageMatchesFilter(message: AgentMessage, filter?: MessageFilter): boolean {
    if (!filter) return true;
    
    // Basic message properties
    if (filter.senderId && message.senderId !== filter.senderId) {
      return false;
    }
    
    if (filter.types && filter.types.length > 0 && !filter.types.includes(message.type)) {
      return false;
    }
    
    if (filter.eventTypes && filter.eventTypes.length > 0 && !filter.eventTypes.includes(message.eventType)) {
      return false;
    }
    
    if (filter.minPriority) {
      const priorityValues = { low: 1, normal: 2, high: 3, urgent: 4 };
      if (priorityValues[message.priority] < priorityValues[filter.minPriority]) {
        return false;
      }
    }
    
    // Message identifiers
    if (filter.conversationId && message.conversationId !== filter.conversationId) {
      return false;
    }
    
    if (filter.correlationId && message.correlationId !== filter.correlationId) {
      return false;
    }
    
    // Content-based filtering
    if (filter.contentAction && 
        (!message.content || !message.content.action || message.content.action !== filter.contentAction)) {
      return false;
    }
    
    // Metadata-based filtering
    if (filter.tags && filter.tags.length > 0) {
      const messageTags = message.metadata.tags || [];
      if (!filter.tags.some(tag => messageTags.includes(tag))) {
        return false;
      }
    }
    
    if (filter.userId && (!message.metadata.userId || message.metadata.userId !== filter.userId)) {
      return false;
    }
    
    // Hierarchical structure filtering
    if (filter.senderTier && (!message.metadata.senderTier || message.metadata.senderTier !== filter.senderTier)) {
      return false;
    }
    
    if (filter.recipientTier && (!message.metadata.recipientTier || message.metadata.recipientTier !== filter.recipientTier)) {
      return false;
    }
    
    if (filter.chainOfCommandValid !== undefined && 
        message.metadata.chainOfCommandValid !== filter.chainOfCommandValid) {
      return false;
    }
    
    if (filter.relatedComponent && 
        (!message.metadata.relatedComponent || message.metadata.relatedComponent !== filter.relatedComponent)) {
      return false;
    }
    
    // Integration checkpoint filtering
    if (filter.integrationCheckpointStatus && 
        (!message.metadata.integrationCheckpoint || 
         message.metadata.integrationCheckpoint.status !== filter.integrationCheckpointStatus)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Create a new message
   * 
   * @param type Message type
   * @param senderId Sender agent ID
   * @param recipientId Recipient agent ID (or 'all')
   * @param content Message content
   * @param options Additional message options
   * @returns The created message
   */
  createMessage(
    type: MessageType,
    senderId: string,
    recipientId: string | 'all',
    content: any,
    options: {
      priority?: MessagePriority;
      conversationId?: string;
      requiresAcknowledgment?: boolean;
      expiresInMs?: number;
      inReplyTo?: string;
      context?: Record<string, any>;
      senderTier?: AgentTier;
      recipientTier?: AgentTier;
      relatedComponent?: string;
      eventType?: EventType;
      correlationId?: string;
      integrationCheckpoint?: {
        name: string;
        status: 'pending' | 'passed' | 'failed';
        details?: Record<string, any>;
      };
    } = {}
  ): AgentMessage {
    const now = new Date();
    
    // Determine senderTier if not provided
    let senderTier = options.senderTier;
    if (!senderTier) {
      // Check if sender is a leadership agent
      if (senderId === 'architect-prime') {
        senderTier = AgentTier.STRATEGIC_LEADERSHIP;
      } else if (senderId === 'integration-coordinator') {
        senderTier = AgentTier.TACTICAL_LEADERSHIP;
      } else if (senderId.includes('lead') || senderId.includes('-lead')) {
        senderTier = AgentTier.COMPONENT_LEADERSHIP;
      } else if (senderId === 'core' || senderId === 'master-control-program') {
        senderTier = AgentTier.SYSTEM;
      } else {
        senderTier = AgentTier.SPECIALIST;
      }
    }
    
    // Determine recipientTier if not provided and recipient is not 'all'
    let recipientTier = options.recipientTier;
    if (!recipientTier && recipientId !== 'all') {
      // Check if recipient is a leadership agent
      if (recipientId === 'architect-prime') {
        recipientTier = AgentTier.STRATEGIC_LEADERSHIP;
      } else if (recipientId === 'integration-coordinator') {
        recipientTier = AgentTier.TACTICAL_LEADERSHIP;
      } else if (recipientId.includes('lead') || recipientId.includes('-lead')) {
        recipientTier = AgentTier.COMPONENT_LEADERSHIP;
      } else if (recipientId === 'core' || recipientId === 'master-control-program') {
        recipientTier = AgentTier.SYSTEM;
      } else {
        recipientTier = AgentTier.SPECIALIST;
      }
    }
    
    // Determine if chain of command is valid based on leadership tiers
    let chainOfCommandValid = true;
    if (senderTier && recipientTier && recipientId !== 'all') {
      // Leadership messages can flow down the chain (lower number to higher number)
      // or to the same level, but specialists can only communicate up the chain
      // System level can communicate with anyone
      if (senderTier === AgentTier.SPECIALIST && 
          recipientTier !== AgentTier.COMPONENT_LEADERSHIP && 
          recipientTier !== AgentTier.SYSTEM) {
        chainOfCommandValid = false;
      }
      
      // Component leads should communicate through Integration Coordinator when reaching strategic level
      if (senderTier === AgentTier.COMPONENT_LEADERSHIP && 
          recipientTier === AgentTier.STRATEGIC_LEADERSHIP) {
        chainOfCommandValid = false;
      }
    }
    
    return {
      id: `msg_${uuidv4()}`,
      conversationId: options.conversationId || `conv_${uuidv4()}`,
      correlationId: options.correlationId || options.context?.correlationId || `corr_${uuidv4()}`,
      type,
      eventType: options.eventType || 'EVENT' as EventType,
      senderId,
      recipientId,
      priority: options.priority || 'normal',
      content,
      timestamp: now.toISOString(),
      metadata: {
        timestamp: now,
        expiresAt: options.expiresInMs ? new Date(now.getTime() + options.expiresInMs) : undefined,
        requiresAcknowledgment: options.requiresAcknowledgment,
        acknowledged: false,
        inReplyTo: options.inReplyTo,
        context: options.context,
        senderTier,
        recipientTier,
        chainOfCommandValid,
        relatedComponent: options.relatedComponent,
        integrationCheckpoint: options.integrationCheckpoint
      }
    };
  }
  
  /**
   * Log a message
   * 
   * @param level Log level
   * @param message Message to log
   * @param data Optional data to include
   */
  private log(level: string, message: string, data?: any): void {
    this.logger(level, message, data);
  }
  
  /**
   * Evaluate a condition expression against workflow data
   * 
   * @param condition The condition expression
   * @param data The workflow data
   * @returns True if the condition evaluates to true
   */
  private evaluateCondition(condition: string, data: Record<string, any>): boolean {
    // Very simple condition evaluator - in a real system, use a proper expression evaluator
    // This supports only simple path exists and basic truthy checks
    try {
      const parts = condition.split('.');
      let value = data;
      
      for (const part of parts) {
        if (value === undefined || value === null) {
          return false;
        }
        value = value[part];
      }
      
      return Boolean(value);
    } catch (error) {
      this.log('error', `Error evaluating condition: ${condition}`, error);
      return false;
    }
  }
  
  /**
   * Map workflow data to step input based on mapping
   * 
   * @param data The workflow data
   * @param mapping The input mapping
   * @returns Mapped input data
   */
  private mapWorkflowData(data: Record<string, any>, mapping: Record<string, string>): any {
    const result: Record<string, any> = {};
    
    for (const [targetPath, sourcePath] of Object.entries(mapping)) {
      try {
        // Get the source value
        const sourceValue = this.getValueByPath(data, sourcePath);
        
        // Set the target value
        this.setValueByPath(result, targetPath, sourceValue);
      } catch (error) {
        this.log('warn', `Error mapping workflow data: ${sourcePath} -> ${targetPath}`, error);
      }
    }
    
    return result;
  }
  
  /**
   * Map step output to workflow data based on mapping
   * 
   * @param data The workflow data to update
   * @param stepResult The step execution result
   * @param mapping The output mapping
   */
  private mapStepOutput(
    data: Record<string, any>,
    stepResult: AgentResponse,
    mapping: Record<string, string>
  ): void {
    // Initialize output in workflow data if not present
    if (!data.output) {
      data.output = {};
    }
    
    // Store the raw result
    data.lastStepResult = stepResult;
    
    // Apply the mapping
    for (const [targetPath, sourcePath] of Object.entries(mapping)) {
      try {
        // Get the source value from the step result
        const sourceValue = this.getValueByPath(stepResult, sourcePath);
        
        // Set the target value in the workflow data
        this.setValueByPath(data, targetPath, sourceValue);
      } catch (error) {
        this.log('warn', `Error mapping step output: ${sourcePath} -> ${targetPath}`, error);
      }
    }
  }
  
  /**
   * Get a value from an object by dot-separated path
   * 
   * @param obj The object to get the value from
   * @param path The dot-separated path
   * @returns The value at the path
   */
  private getValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Set a value in an object by dot-separated path
   * 
   * @param obj The object to set the value in
   * @param path The dot-separated path
   * @param value The value to set
   */
  private setValueByPath(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const lastPart = parts.pop();
    
    if (!lastPart) {
      return;
    }
    
    let current = obj;
    
    for (const part of parts) {
      if (current[part] === undefined || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[lastPart] = value;
  }
  
  /**
   * Calculate a priority score for an experience based on message characteristics
   * 
   * @param message The message being processed
   * @param success Whether processing was successful
   * @returns Priority score between 0 and 1
   */
  private calculateExperiencePriority(message: AgentMessage, success: boolean): number {
    // Base priority based on message priority
    const priorityMap: Record<MessagePriority, number> = {
      'low': 0.2,
      'normal': 0.5,
      'high': 0.7,
      'urgent': 0.9
    };
    
    let priority = priorityMap[message.priority] || 0.5;
    
    // Adjust based on message type
    if (message.type === 'error') {
      priority += 0.2;
    } else if (message.type === 'request') {
      priority += 0.1;
    }
    
    // Failed message processing is higher priority for learning
    if (!success) {
      priority += 0.3;
    }
    
    // Message that requires acknowledgment is more important
    if (message.metadata.requiresAcknowledgment) {
      priority += 0.1;
    }
    
    // Cap priority between 0 and 1
    return Math.min(Math.max(priority, 0), 1);
  }
  
  /**
   * Broadcast a message to all agents
   * 
   * @param message The message to broadcast
   */
  async broadcastMessage(message: AgentMessage): Promise<void> {
    // Set recipient to 'all' if not already set
    if (message.recipientId !== 'all') {
      message.recipientId = 'all';
    }
    
    try {
      // Broadcast the message to all agents
      await this.sendMessage(message);
      
      // Log broadcast
      this.log('info', `Message broadcast from ${message.senderId} to all agents`, { 
        messageId: message.id,
        messageType: message.type,
        eventType: message.eventType,
        correlationId: message.correlationId
      });
    } catch (error) {
      // Log error
      this.log('error', `Error broadcasting message from ${message.senderId}`, {
        error: error instanceof Error ? error.message : String(error),
        messageId: message.id
      });
      
      throw error;
    }
  }
}

/**
 * Singleton instance of the Master Control Program
 */
export const masterControlProgram = new MasterControlProgram();