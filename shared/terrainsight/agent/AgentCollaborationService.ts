/**
 * Agent Collaboration Service
 * 
 * This module implements advanced agent collaboration mechanisms that enable
 * dynamic delegation of tasks, adaptive learning, and continuous improvement
 * of the agent network through experience sharing.
 */

import { v4 as uuidv4 } from 'uuid';
import { masterControlProgram } from './MasterControlProgram';
import { replayBuffer } from './ReplayBuffer';
import { eventLogger, EventType, EventSeverity } from './EventLogger';
import { Agent } from './Agent';
import { AgentCapability, AgentMessage, MessageType } from './types';

/**
 * Options for agent task delegation
 */
export interface TaskDelegationOptions {
  /** Priority of the task */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  /** Maximum time to wait for task completion in milliseconds */
  timeoutMs?: number;
  
  /** Whether to require acknowledgment of the task */
  requiresAcknowledgment?: boolean;
  
  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Task delegation result
 */
export interface TaskDelegationResult {
  /** Whether the delegation was successful */
  success: boolean;
  
  /** ID of the agent that the task was delegated to */
  delegatedAgentId?: string;
  
  /** The result from the delegated agent */
  result?: any;
  
  /** Error message if the delegation failed */
  error?: string;
  
  /** Whether the task was acknowledged (if acknowledgment was required) */
  acknowledged?: boolean;
  
  /** Metrics about the task delegation */
  metrics?: {
    /** Time taken to find an appropriate agent */
    agentFindTimeMs: number;
    
    /** Time taken to complete the task */
    taskCompletionTimeMs: number;
    
    /** Total time from delegation to completion */
    totalTimeMs: number;
  };
}

/**
 * Agent collaboration service
 * Provides mechanisms for agents to collaborate, delegate tasks,
 * and learn from each other's experiences
 */
export class AgentCollaborationService {
  /**
   * Delegate a task to the most appropriate agent
   * 
   * @param requesterAgentId ID of the agent requesting the delegation
   * @param capabilities Required capabilities for the task
   * @param taskData Data needed to complete the task
   * @param options Additional options for the delegation
   * @returns Task delegation result
   */
  async delegateTask(
    requesterAgentId: string,
    capabilities: AgentCapability | AgentCapability[],
    taskData: any,
    options: TaskDelegationOptions = {}
  ): Promise<TaskDelegationResult> {
    const startTime = Date.now();
    
    try {
      // Log the task delegation request
      eventLogger.logAction(
        requesterAgentId,
        'Task delegation requested',
        `Agent ${requesterAgentId} requested delegation of a task`,
        {
          capabilities: Array.isArray(capabilities) ? capabilities : [capabilities],
          options
        }
      );
      
      // Find appropriate agents for the task
      const capabilitiesArray = Array.isArray(capabilities) ? capabilities : [capabilities];
      let candidates: Agent[] = [];
      
      // Get agents for each required capability
      for (const capability of capabilitiesArray) {
        const agentsWithCapability = masterControlProgram.getAgentsByCapability(capability);
        
        if (candidates.length === 0) {
          candidates = agentsWithCapability;
        } else {
          // Keep only agents that have all required capabilities
          candidates = candidates.filter(agent => 
            agentsWithCapability.some(a => a.id === agent.id)
          );
        }
      }
      
      // Filter out the requester agent
      candidates = candidates.filter(agent => agent.id !== requesterAgentId);
      
      if (candidates.length === 0) {
        const error = `No agents found with all required capabilities: ${capabilitiesArray.join(', ')}`;
        
        eventLogger.logError(
          requesterAgentId,
          'Task delegation failed',
          error,
          { capabilities: capabilitiesArray },
          EventSeverity.WARNING
        );
        
        return {
          success: false,
          error
        };
      }
      
      const agentFindTimeMs = Date.now() - startTime;
      
      // Select the best agent for the task
      // For now, just take the first one. In a more advanced implementation,
      // we could use performance metrics, current load, etc.
      const selectedAgent = candidates[0];
      
      // Create a conversation ID for this task
      const conversationId = `task_${uuidv4()}`;
      
      // Create and send the task message
      const message: Partial<AgentMessage> = {
        type: 'request' as MessageType,
        senderId: requesterAgentId,
        recipientId: selectedAgent.id,
        priority: options.priority || 'normal',
        content: {
          action: 'delegated_task',
          data: taskData
        },
        conversationId,
        metadata: {
          requiresAcknowledgment: options.requiresAcknowledgment,
          context: options.context
        }
      };
      
      // Create a promise that will resolve when the task is completed
      const taskCompletionPromise = new Promise<TaskDelegationResult>((resolve, reject) => {
        // Set up a timeout if specified
        let timeoutId: NodeJS.Timeout | undefined;
        if (options.timeoutMs) {
          timeoutId = setTimeout(() => {
            eventLogger.logError(
              requesterAgentId,
              'Task delegation timeout',
              `Task delegation to ${selectedAgent.id} timed out after ${options.timeoutMs}ms`,
              { conversationId },
              EventSeverity.WARNING
            );
            
            reject(new Error(`Task delegation timed out after ${options.timeoutMs}ms`));
          }, options.timeoutMs);
        }
        
        // Subscribe to responses
        masterControlProgram.subscribeToMessages(
          async (responseMessage) => {
            // Only handle messages in this conversation that are responses
            if (responseMessage.conversationId !== conversationId ||
                responseMessage.type !== 'response') {
              return;
            }
            
            // Clear timeout if set
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            
            const taskCompletionTimeMs = Date.now() - startTime - agentFindTimeMs;
            const totalTimeMs = Date.now() - startTime;
            
            // Log the response
            eventLogger.logResult(
              requesterAgentId,
              'Task delegation completed',
              `Agent ${selectedAgent.id} completed the delegated task`,
              {
                result: responseMessage.content,
                metrics: {
                  agentFindTimeMs,
                  taskCompletionTimeMs,
                  totalTimeMs
                }
              }
            );
            
            // Record the experience
            replayBuffer.add({
              agentId: requesterAgentId,
              state: { delegationRequested: true, capabilities: capabilitiesArray },
              action: { delegateTask: true, delegatedAgentId: selectedAgent.id },
              result: { taskCompleted: true, result: responseMessage.content },
              nextState: { taskDelegationCompleted: true },
              priority: 0.8 // High priority experience
            });
            
            // Resolve the promise with the result
            resolve({
              success: true,
              delegatedAgentId: selectedAgent.id,
              result: responseMessage.content,
              acknowledged: responseMessage.metadata.acknowledged,
              metrics: {
                agentFindTimeMs,
                taskCompletionTimeMs,
                totalTimeMs
              }
            });
          },
          {
            senderId: selectedAgent.id,
            types: ['response'],
            conversationId
          }
        );
      });
      
      // Send the task message
      await masterControlProgram.sendMessage(message as AgentMessage);
      
      // Wait for the task to be completed
      return await taskCompletionPromise;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      eventLogger.logError(
        requesterAgentId,
        'Task delegation error',
        `Error during task delegation: ${errorMessage}`,
        error,
        EventSeverity.ERROR
      );
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Get improvement suggestions for an agent based on experiences
   * 
   * @param agentId ID of the agent to get suggestions for
   * @returns Array of suggestions based on past experiences
   */
  async getImprovementSuggestions(agentId: string): Promise<Array<{
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    relatedExperiences: string[];
  }>> {
    // Get agent-specific experiences
    const experiences = replayBuffer.getByAgentId(agentId);
    
    if (experiences.length === 0) {
      return [];
    }
    
    // Look for patterns in failed experiences
    const failedExperiences = experiences.filter(exp => {
      if (typeof exp.result === 'object' && exp.result) {
        return exp.result.success === false || exp.result.error;
      }
      return false;
    });
    
    // Group by similar failures
    const failureGroups: Record<string, {
      count: number;
      priority: number;
      experienceIds: string[];
      description?: string;
    }> = {};
    
    for (const exp of failedExperiences) {
      // Extract failure reason
      let failureReason = 'unknown_error';
      let description = 'Unknown error occurred';
      
      if (typeof exp.result === 'object' && exp.result) {
        if (exp.result.error) {
          failureReason = typeof exp.result.error === 'string' 
            ? exp.result.error.slice(0, 50) // Use truncated error message
            : 'error_object';
          
          description = typeof exp.result.error === 'string'
            ? `Error: ${exp.result.error}`
            : 'Complex error object encountered';
        } else if (exp.result.errorType) {
          failureReason = exp.result.errorType;
          description = exp.result.message || 'Type-specific error';
        }
      }
      
      // Group by failure reason
      if (!failureGroups[failureReason]) {
        failureGroups[failureReason] = {
          count: 0,
          priority: exp.priority,
          experienceIds: [],
          description
        };
      }
      
      failureGroups[failureReason].count++;
      failureGroups[failureReason].priority = Math.max(
        failureGroups[failureReason].priority,
        exp.priority
      );
      failureGroups[failureReason].experienceIds.push(exp.id);
    }
    
    // Convert to suggestions
    const suggestions = Object.entries(failureGroups).map(([type, data]) => {
      let priority: 'low' | 'medium' | 'high' = 'low';
      
      if (data.priority >= 0.7 || data.count >= 5) {
        priority = 'high';
      } else if (data.priority >= 0.4 || data.count >= 2) {
        priority = 'medium';
      }
      
      return {
        type,
        description: data.description || `Improve handling of ${type}`,
        priority,
        relatedExperiences: data.experienceIds
      };
    });
    
    // Sort by priority and count
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] ||
             failureGroups[b.type].count - failureGroups[a.type].count;
    });
  }
  
  /**
   * Request help from the agent network for a specific problem
   * 
   * @param requesterAgentId ID of the agent requesting help
   * @param problemType Type of problem
   * @param description Description of the problem
   * @param data Problem-specific data
   * @returns Array of solutions proposed by other agents
   */
  async requestHelp(
    requesterAgentId: string,
    problemType: string,
    description: string,
    data: any
  ): Promise<Array<{
    agentId: string;
    solution: any;
    confidence: number;
  }>> {
    // Log the help request
    eventLogger.logAction(
      requesterAgentId,
      'Help requested',
      `Agent ${requesterAgentId} requested help for a ${problemType} problem`,
      {
        problemType,
        description,
        data
      }
    );
    
    // Create a unique ID for this help request
    const helpRequestId = `help_${uuidv4()}`;
    
    // Broadcast a help request to all agents
    const message: Partial<AgentMessage> = {
      type: 'query' as MessageType,
      senderId: requesterAgentId,
      recipientId: 'all',
      priority: 'high',
      content: {
        action: 'help_request',
        helpRequestId,
        problemType,
        description,
        data
      },
      metadata: {
        requiresAcknowledgment: false,
        context: { helpRequestId }
      }
    };
    
    // Create a promise that will resolve when we've collected all responses
    const solutionsPromise = new Promise<Array<{
      agentId: string;
      solution: any;
      confidence: number;
    }>>((resolve) => {
      const solutions: Array<{
        agentId: string;
        solution: any;
        confidence: number;
      }> = [];
      
      // Wait a reasonable time for responses
      const timeoutMs = 5000;
      
      // Set a timeout to resolve with whatever solutions we've collected
      const timeoutId = setTimeout(() => {
        eventLogger.logResult(
          requesterAgentId,
          'Help request completed',
          `Collected ${solutions.length} solutions for help request ${helpRequestId}`,
          { solutions }
        );
        
        resolve(solutions);
      }, timeoutMs);
      
      // Subscribe to solution responses
      masterControlProgram.subscribeToMessages(
        async (responseMessage) => {
          // Check if this is a solution for our help request
          if (responseMessage.type !== 'response' ||
              !responseMessage.content ||
              responseMessage.content.helpRequestId !== helpRequestId ||
              responseMessage.content.action !== 'help_solution') {
            return;
          }
          
          // Add the solution
          solutions.push({
            agentId: responseMessage.senderId,
            solution: responseMessage.content.solution,
            confidence: responseMessage.content.confidence || 0.5
          });
          
          // If we have a high-confidence solution, we can resolve early
          if (solutions.some(s => s.confidence >= 0.9) || solutions.length >= 3) {
            clearTimeout(timeoutId);
            
            eventLogger.logResult(
              requesterAgentId,
              'Help request completed early',
              `Collected ${solutions.length} solutions for help request ${helpRequestId}`,
              { solutions }
            );
            
            resolve(solutions);
          }
        },
        {
          types: ['response']
        }
      );
    });
    
    // Send the help request
    await masterControlProgram.sendMessage(message as AgentMessage);
    
    // Wait for solutions
    const solutions = await solutionsPromise;
    
    // Record the experience
    replayBuffer.add({
      agentId: requesterAgentId,
      state: { problemEncountered: true, problemType },
      action: { requestHelp: true, helpRequestId },
      result: { solutionsReceived: solutions.length, solutions },
      nextState: { helpRequestCompleted: true },
      priority: 0.7
    });
    
    // Sort solutions by confidence
    return solutions.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Train the agent network using the replay buffer
   * This method processes experiences and updates agent behavior
   * 
   * @param batchSize Number of experiences to process in this training session
   * @returns Training stats
   */
  async trainAgentNetwork(batchSize: number = 100): Promise<{
    experiencesProcessed: number;
    agentsUpdated: string[];
    improvements: Array<{
      agentId: string;
      area: string;
      description: string;
    }>;
  }> {
    // Log the training start
    eventLogger.logAction(
      'system',
      'Agent network training started',
      `Starting training session with batch size ${batchSize}`,
      { batchSize }
    );
    
    // Get high-priority experiences for training
    const experiences = replayBuffer.getByPriority(0.7);
    const trainingBatch = experiences.slice(0, batchSize);
    
    // Group experiences by agent
    const experiencesByAgent: Record<string, typeof trainingBatch> = {};
    
    for (const exp of trainingBatch) {
      if (!experiencesByAgent[exp.agentId]) {
        experiencesByAgent[exp.agentId] = [];
      }
      experiencesByAgent[exp.agentId].push(exp);
    }
    
    // Process each agent's experiences and identify improvements
    const improvements: Array<{
      agentId: string;
      area: string;
      description: string;
    }> = [];
    
    const agentsUpdated: string[] = [];
    
    for (const [agentId, agentExperiences] of Object.entries(experiencesByAgent)) {
      // Analyze experiences and generate improvement suggestions
      const suggestions = await this.getImprovementSuggestions(agentId);
      
      if (suggestions.length > 0) {
        // Add high and medium priority suggestions as improvements
        for (const suggestion of suggestions) {
          if (suggestion.priority === 'high' || suggestion.priority === 'medium') {
            improvements.push({
              agentId,
              area: suggestion.type,
              description: suggestion.description
            });
          }
        }
        
        // Mark this agent as updated
        agentsUpdated.push(agentId);
        
        // Log the training results for this agent
        eventLogger.logResult(
          agentId,
          'Agent training completed',
          `Processed ${agentExperiences.length} experiences for agent ${agentId}`,
          {
            experiencesProcessed: agentExperiences.length,
            improvements: improvements.filter(imp => imp.agentId === agentId)
          }
        );
      }
    }
    
    // Log the overall training completion
    eventLogger.logResult(
      'system',
      'Agent network training completed',
      `Completed training session with ${trainingBatch.length} experiences`,
      {
        experiencesProcessed: trainingBatch.length,
        agentsUpdated,
        improvements
      }
    );
    
    return {
      experiencesProcessed: trainingBatch.length,
      agentsUpdated,
      improvements
    };
  }
}

/**
 * Singleton instance of the agent collaboration service
 */
export const agentCollaborationService = new AgentCollaborationService();