/**
 * Workflow Manager
 * 
 * This file implements the workflow management system that coordinates
 * workflows within the multi-agent architecture.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  EventType, 
  eventLogger 
} from './EventLogger';
import { 
  AgentWorkflow, 
  WorkflowResult 
} from './types';
import { masterControlProgram } from './MasterControlProgram';
import { 
  AuditAction, 
  AuditEntityType, 
  auditLogger, 
  auditSystemAction 
} from './AuditLogger';
import { registerAssessmentWorkflows } from './workflows/AssessmentWorkflow';
import { registerGeospatialWorkflows } from './workflows/GeospatialWorkflow';

/**
 * Workflow status enum
 */
export enum WorkflowStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

/**
 * Workflow instance interface
 */
export interface WorkflowInstance {
  /** Unique instance ID */
  id: string;
  
  /** Workflow definition ID */
  workflowId: string;
  
  /** Current status */
  status: WorkflowStatus;
  
  /** Execution start time */
  startTime: Date;
  
  /** Execution end time (if completed) */
  endTime?: Date;
  
  /** Input data */
  input: any;
  
  /** Output data (if completed) */
  output?: any;
  
  /** Currently executing step ID */
  currentStepId?: string;
  
  /** Completed steps */
  completedSteps: string[];
  
  /** User ID if initiated by a user */
  userId?: string;
  
  /** Error information (if failed) */
  error?: {
    message: string;
    details?: any;
    stepId?: string;
  };
  
  /** Workflow parameters */
  parameters: Record<string, any>;
  
  /** Execution context */
  context: Record<string, any>;
}

/**
 * Workflow Manager
 * 
 * Manages workflow definitions, instances, and execution
 */
export class WorkflowManager {
  /** Workflow definitions by ID */
  private workflowDefinitions: Map<string, AgentWorkflow> = new Map();
  
  /** Active workflow instances by ID */
  private workflowInstances: Map<string, WorkflowInstance> = new Map();
  
  /** Completed workflow histories */
  private workflowHistory: WorkflowResult[] = [];
  
  /** Maximum workflow history size */
  private maxHistorySize: number;
  
  /**
   * Create a new WorkflowManager
   * 
   * @param options Configuration options
   */
  constructor(options: {
    maxHistorySize?: number;
  } = {}) {
    this.maxHistorySize = options.maxHistorySize || 1000;
  }
  
  /**
   * Initialize workflow manager
   * Including registering all workflow definitions
   */
  initialize(): void {
    // Register assessment workflows
    registerAssessmentWorkflows(this.registerWorkflow.bind(this));
    
    // Register geospatial workflows
    registerGeospatialWorkflows(this.registerWorkflow.bind(this));
    
    // Register other workflow types as needed
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'WorkflowManager',
      message: `Initialized workflow manager with ${this.workflowDefinitions.size} workflow definitions`
    });
  }
  
  /**
   * Register a workflow definition
   * 
   * @param workflow Workflow definition
   */
  registerWorkflow(workflow: AgentWorkflow): void {
    if (this.workflowDefinitions.has(workflow.id)) {
      eventLogger.log({
        type: EventType.WARNING,
        source: 'WorkflowManager',
        message: `Replacing existing workflow definition: ${workflow.id}`,
        data: workflow
      });
    }
    
    this.workflowDefinitions.set(workflow.id, workflow);
    
    // Also register with MCP
    masterControlProgram.registerWorkflow(workflow);
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'WorkflowManager',
      message: `Registered workflow: ${workflow.name} (${workflow.id})`,
      data: {
        category: workflow.category,
        tags: workflow.tags,
        steps: workflow.steps.length
      }
    });
  }
  
  /**
   * Get a workflow definition by ID
   * 
   * @param workflowId Workflow definition ID
   * @returns Workflow definition or undefined if not found
   */
  getWorkflowDefinition(workflowId: string): AgentWorkflow | undefined {
    return this.workflowDefinitions.get(workflowId);
  }
  
  /**
   * Get all workflow definitions
   * 
   * @param category Optional category filter
   * @param tags Optional tags filter (must match all)
   * @returns Array of workflow definitions
   */
  getAllWorkflowDefinitions(category?: string, tags?: string[]): AgentWorkflow[] {
    let workflows = Array.from(this.workflowDefinitions.values());
    
    if (category) {
      workflows = workflows.filter(w => w.category === category);
    }
    
    if (tags && tags.length > 0) {
      workflows = workflows.filter(w => 
        tags.every(tag => w.tags?.includes(tag))
      );
    }
    
    return workflows;
  }
  
  /**
   * Execute a workflow
   * 
   * @param workflowId Workflow definition ID
   * @param input Input data
   * @param parameters Override workflow parameters
   * @param context Execution context
   * @param userId User ID if initiated by a user
   * @returns Workflow instance
   */
  async executeWorkflow(
    workflowId: string,
    input: any,
    parameters: Record<string, any> = {},
    context: Record<string, any> = {},
    userId?: string
  ): Promise<WorkflowInstance> {
    // Get workflow definition
    const workflow = this.workflowDefinitions.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    if (!workflow.isEnabled) {
      throw new Error(`Workflow is disabled: ${workflowId}`);
    }
    
    // Create instance
    const instanceId = uuidv4();
    const instance: WorkflowInstance = {
      id: instanceId,
      workflowId,
      status: WorkflowStatus.PENDING,
      startTime: new Date(),
      input,
      completedSteps: [],
      parameters: { ...workflow.parameters, ...parameters },
      context,
      userId
    };
    
    // Store instance
    this.workflowInstances.set(instanceId, instance);
    
    // Audit workflow start
    await auditSystemAction(
      'WorkflowManager',
      AuditAction.CREATE,
      {
        instanceId,
        workflowId,
        input,
        parameters: instance.parameters
      },
      {
        userId,
        workflowName: workflow.name
      }
    );
    
    try {
      // Update status
      instance.status = WorkflowStatus.IN_PROGRESS;
      
      // Execute workflow through MCP
      const result = await masterControlProgram.executeWorkflow(
        workflowId,
        input,
        {
          executionId: instanceId,
          parameters: instance.parameters,
          userId,
          workflowId,
          timestamp: instance.startTime,
          log: (level, message, data) => {
            eventLogger.log({
              type: level === 'error' ? EventType.ERROR : 
                    level === 'warn' ? EventType.WARNING : EventType.INFO,
              source: `Workflow:${workflow.id}:${instanceId}`,
              message,
              data
            });
          }
        }
      );
      
      // Update instance with results
      instance.status = result.status === 'success' ? WorkflowStatus.COMPLETED : 
                      result.status === 'error' ? WorkflowStatus.FAILED : 
                      result.status === 'partial_success' ? WorkflowStatus.COMPLETED : 
                      WorkflowStatus.FAILED;
      instance.endTime = result.endTime;
      instance.output = result.output;
      
      if (result.status !== 'success') {
        instance.error = {
          message: result.errors?.[0]?.message || 'Workflow execution failed',
          details: result.errors,
          stepId: result.errors?.[0]?.stepId
        };
      }
      
      // Store in history
      this.addToHistory(result);
      
      // Audit workflow completion
      await auditSystemAction(
        'WorkflowManager',
        AuditAction.UPDATE,
        {
          instanceId,
          status: instance.status,
          output: instance.output,
          error: instance.error
        },
        {
          userId,
          workflowName: workflow.name,
          executionTimeMs: instance.endTime!.getTime() - instance.startTime.getTime()
        }
      );
      
      // Return completed instance
      return instance;
    } catch (error) {
      // Update instance with error
      instance.status = WorkflowStatus.FAILED;
      instance.endTime = new Date();
      instance.error = {
        message: error instanceof Error ? error.message : String(error),
        details: error
      };
      
      // Audit workflow failure
      await auditSystemAction(
        'WorkflowManager',
        AuditAction.UPDATE,
        {
          instanceId,
          status: instance.status,
          error: instance.error
        },
        {
          userId,
          workflowName: workflow.name,
          executionTimeMs: instance.endTime.getTime() - instance.startTime.getTime()
        },
        false,
        instance.error.message
      );
      
      // Log error
      eventLogger.log({
        type: EventType.ERROR,
        source: `WorkflowManager:${workflow.id}:${instanceId}`,
        message: `Workflow execution failed: ${instance.error.message}`,
        data: error
      });
      
      return instance;
    }
  }
  
  /**
   * Get a workflow instance by ID
   * 
   * @param instanceId Workflow instance ID
   * @returns Workflow instance or undefined if not found
   */
  getWorkflowInstance(instanceId: string): WorkflowInstance | undefined {
    return this.workflowInstances.get(instanceId);
  }
  
  /**
   * Get active workflow instances
   * 
   * @param workflowId Optional workflow definition ID filter
   * @param userId Optional user ID filter
   * @returns Array of active workflow instances
   */
  getActiveWorkflowInstances(workflowId?: string, userId?: string): WorkflowInstance[] {
    let instances = Array.from(this.workflowInstances.values())
      .filter(i => i.status === WorkflowStatus.PENDING || i.status === WorkflowStatus.IN_PROGRESS);
    
    if (workflowId) {
      instances = instances.filter(i => i.workflowId === workflowId);
    }
    
    if (userId) {
      instances = instances.filter(i => i.userId === userId);
    }
    
    return instances;
  }
  
  /**
   * Cancel a workflow instance
   * 
   * @param instanceId Workflow instance ID
   * @param userId User ID performing the cancellation
   * @returns Updated workflow instance or undefined if not found
   */
  async cancelWorkflowInstance(instanceId: string, userId: string): Promise<WorkflowInstance | undefined> {
    const instance = this.workflowInstances.get(instanceId);
    if (!instance) {
      return undefined;
    }
    
    // Only cancel if not already completed or failed
    if (instance.status !== WorkflowStatus.PENDING && instance.status !== WorkflowStatus.IN_PROGRESS) {
      return instance;
    }
    
    // Update status
    instance.status = WorkflowStatus.CANCELED;
    instance.endTime = new Date();
    
    // Audit cancellation
    await auditSystemAction(
      'WorkflowManager',
      AuditAction.UPDATE,
      {
        instanceId,
        status: instance.status
      },
      {
        canceledBy: userId,
        workflowId: instance.workflowId,
        executionTimeMs: instance.endTime.getTime() - instance.startTime.getTime()
      }
    );
    
    // Log cancellation
    eventLogger.log({
      type: EventType.WARNING,
      source: 'WorkflowManager',
      message: `Workflow canceled: ${instance.workflowId} (${instanceId})`,
      data: {
        userId,
        startTime: instance.startTime,
        endTime: instance.endTime
      }
    });
    
    return instance;
  }
  
  /**
   * Get workflow history
   * 
   * @param limit Maximum number of results to return
   * @param workflowId Optional workflow definition ID filter
   * @returns Array of workflow results
   */
  getWorkflowHistory(limit: number = 100, workflowId?: string): WorkflowResult[] {
    let history = [...this.workflowHistory];
    
    if (workflowId) {
      history = history.filter(h => h.workflowId === workflowId);
    }
    
    // Sort by execution time (newest first)
    history.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    // Apply limit
    return history.slice(0, limit);
  }
  
  /**
   * Get a workflow execution result by ID
   * 
   * @param executionId Execution ID
   * @returns Workflow result or undefined if not found
   */
  getWorkflowResult(executionId: string): WorkflowResult | undefined {
    return this.workflowHistory.find(h => h.executionId === executionId);
  }
  
  /**
   * Add a workflow result to history
   * 
   * @param result Workflow result
   */
  private addToHistory(result: WorkflowResult): void {
    this.workflowHistory.push(result);
    
    // Trim history if needed
    if (this.workflowHistory.length > this.maxHistorySize) {
      this.workflowHistory.splice(0, this.workflowHistory.length - this.maxHistorySize);
    }
  }
  
  /**
   * Clean up completed workflow instances
   * 
   * @param maxAge Maximum age in milliseconds to keep instances (default: 24 hours)
   */
  cleanupInstances(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const instancesDeleted: string[] = [];
    
    for (const [instanceId, instance] of this.workflowInstances.entries()) {
      // Only clean up completed, failed, or canceled instances
      if (instance.status === WorkflowStatus.PENDING || instance.status === WorkflowStatus.IN_PROGRESS) {
        continue;
      }
      
      // Check if older than max age
      if (instance.endTime && (now - instance.endTime.getTime()) > maxAge) {
        this.workflowInstances.delete(instanceId);
        instancesDeleted.push(instanceId);
      }
    }
    
    if (instancesDeleted.length > 0) {
      eventLogger.log({
        type: EventType.INFO,
        source: 'WorkflowManager',
        message: `Cleaned up ${instancesDeleted.length} workflow instances`
      });
    }
  }
}

/**
 * Singleton instance of the workflow manager
 */
export const workflowManager = new WorkflowManager();

/**
 * Initialize the workflow system
 */
export function initializeWorkflowSystem(): void {
  workflowManager.initialize();
  
  // Set up periodic cleanup
  setInterval(() => {
    workflowManager.cleanupInstances();
  }, 3600000); // Run every hour
}