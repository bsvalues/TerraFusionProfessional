/**
 * Integration Coordinator Agent
 * 
 * Manages cross-component integration, ensuring seamless interaction
 * between system components. Responsible for API contract validation,
 * dependency management, and integration checkpoints.
 */

import { Agent } from './Agent';
import { 
  AgentContext, 
  AgentResponse, 
  ValidationResult, 
  ValidationIssue,
  AgentMessage
} from './types';
import { EventSeverity, eventLogger } from './EventLogger';
import { v4 as uuidv4 } from 'uuid';

/**
 * API contract definition
 */
interface ApiContract {
  /** API contract ID */
  id: string;
  
  /** Component that owns the API */
  componentId: string;
  
  /** Version of the API */
  version: string;
  
  /** Endpoints defined in the API */
  endpoints: Array<{
    /** Path of the endpoint */
    path: string;
    
    /** HTTP method (GET, POST, etc.) */
    method: string;
    
    /** Description of the endpoint */
    description: string;
    
    /** Request schema (simplified) */
    requestSchema?: Record<string, any>;
    
    /** Response schema (simplified) */
    responseSchema?: Record<string, any>;
  }>;
  
  /** Last updated timestamp */
  updatedAt: string;
}

/**
 * Integration checkpoint
 */
interface IntegrationCheckpoint {
  /** Checkpoint ID */
  id: string;
  
  /** Timestamp of the checkpoint */
  timestamp: string;
  
  /** Components involved in the checkpoint */
  components: string[];
  
  /** Status of the checkpoint */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  
  /** Results of the checkpoint */
  results?: {
    /** Whether the checkpoint was successful */
    success: boolean;
    
    /** Issues found during the checkpoint */
    issues: Array<{
      /** Component where the issue was found */
      componentId: string;
      
      /** Description of the issue */
      description: string;
      
      /** Severity of the issue */
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  };
}

/**
 * Integration Coordinator Agent implementation
 */
export class IntegrationCoordinatorAgent extends Agent {
  /** API contracts managed by the coordinator */
  private apiContracts: Map<string, ApiContract> = new Map();
  
  /** Integration checkpoints */
  private integrationCheckpoints: IntegrationCheckpoint[] = [];
  
  /** Integration interval handle */
  private integrationInterval?: NodeJS.Timeout;
  
  /** Component dependencies */
  private componentDependencies: Map<string, string[]> = new Map();
  
  /**
   * Initialize a new Integration Coordinator Agent
   */
  constructor() {
    super('integration-coordinator', 'Integration Coordinator');
    
    // Register capabilities
    this.capabilities = [
      'api_contract_management',
      'integration_checkpoint_management',
      'cross_component_dependency_tracking',
      'integration_validation',
      'component_synchronization'
    ];
  }
  
  /**
   * Initialize the Integration Coordinator
   */
  async initialize(): Promise<boolean> {
    try {
      // Call base initialization
      const baseInitialized = await super.initialize();
      
      if (!baseInitialized) {
        return false;
      }
      
      // Start integration checkpoint interval
      this.startIntegrationCheckpoints();
      
      return true;
    } catch (error) {
      eventLogger.logError(
        this.id,
        'Initialization error',
        `Error initializing Integration Coordinator: ${error instanceof Error ? error.message : String(error)}`,
        error,
        EventSeverity.ERROR
      );
      
      return false;
    }
  }
  
  /**
   * Process a request to the Integration Coordinator Agent
   * 
   * @param context Context for the agent request
   * @returns Agent response with integration information
   */
  async process(context: AgentContext): Promise<AgentResponse> {
    try {
      const { action, data } = context.input;
      
      // Process based on action
      switch (action) {
        case 'register_api_contract':
          if (!data.componentId || !data.version || !Array.isArray(data.endpoints)) {
            return {
              success: false,
              error: 'Component ID, version, and endpoints are required'
            };
          }
          
          const contractId = data.id || `api_${data.componentId}_${data.version}`;
          
          const apiContract: ApiContract = {
            id: contractId,
            componentId: data.componentId,
            version: data.version,
            endpoints: data.endpoints,
            updatedAt: new Date().toISOString()
          };
          
          this.apiContracts.set(contractId, apiContract);
          
          return {
            success: true,
            result: {
              contractId,
              message: 'API contract registered successfully'
            }
          };
          
        case 'get_api_contract':
          const requestedContractId = data.contractId;
          const requestedContract = this.apiContracts.get(requestedContractId);
          
          if (!requestedContract) {
            return {
              success: false,
              error: `API contract with ID '${requestedContractId}' not found`
            };
          }
          
          return {
            success: true,
            result: {
              contract: requestedContract
            }
          };
          
        case 'validate_api_contract':
          if (!data.contractId) {
            return {
              success: false,
              error: 'Contract ID is required'
            };
          }
          
          const contract = this.apiContracts.get(data.contractId);
          
          if (!contract) {
            return {
              success: false,
              error: `API contract with ID '${data.contractId}' not found`
            };
          }
          
          const validationResult = await this.validateApiContract(contract);
          
          return {
            success: true,
            result: validationResult
          };
          
        case 'register_dependencies':
          if (!data.componentId || !Array.isArray(data.dependencies)) {
            return {
              success: false,
              error: 'Component ID and dependencies array are required'
            };
          }
          
          this.componentDependencies.set(data.componentId, data.dependencies);
          
          return {
            success: true,
            result: {
              message: `Dependencies for component '${data.componentId}' registered successfully`
            }
          };
          
        case 'get_dependencies':
          const componentId = data.componentId;
          
          if (componentId) {
            const dependencies = this.componentDependencies.get(componentId);
            
            if (!dependencies) {
              return {
                success: false,
                error: `No dependencies found for component '${componentId}'`
              };
            }
            
            return {
              success: true,
              result: {
                componentId,
                dependencies
              }
            };
          }
          
          // Return complete dependency map
          const dependencyMap: Record<string, string[]> = {};
          
          for (const [component, deps] of this.componentDependencies.entries()) {
            dependencyMap[component] = deps;
          }
          
          return {
            success: true,
            result: {
              dependencyMap
            }
          };
          
        case 'get_integration_checkpoints':
          return {
            success: true,
            result: {
              checkpoints: this.integrationCheckpoints
            }
          };
          
        case 'trigger_integration_checkpoint':
          const checkpoint = await this.performIntegrationCheckpoint();
          
          return {
            success: true,
            result: {
              checkpoint
            }
          };
          
        default:
          return {
            success: false,
            error: `Unsupported action: ${action}`
          };
      }
    } catch (error) {
      eventLogger.logError(
        this.id,
        'Request processing error',
        `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
        error,
        EventSeverity.ERROR
      );
      
      return {
        success: false,
        error: `Internal error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Start regular integration checkpoints
   */
  private startIntegrationCheckpoints(): void {
    // Clear existing interval if any
    if (this.integrationInterval) {
      clearInterval(this.integrationInterval);
    }
    
    // Perform checkpoints hourly (in a real system, the interval would be configurable)
    this.integrationInterval = setInterval(async () => {
      await this.performIntegrationCheckpoint();
    }, 3600000); // 1 hour
    
    eventLogger.logAction(
      this.id,
      'Integration checkpoints started',
      'Hourly integration checkpoints have been scheduled',
      { checkpointIntervalMs: 3600000 }
    );
  }
  
  /**
   * Perform an integration checkpoint
   * 
   * @returns The created checkpoint
   */
  private async performIntegrationCheckpoint(): Promise<IntegrationCheckpoint> {
    const checkpointId = `checkpoint_${uuidv4()}`;
    
    // Create checkpoint entry
    const checkpoint: IntegrationCheckpoint = {
      id: checkpointId,
      timestamp: new Date().toISOString(),
      components: Array.from(this.componentDependencies.keys()),
      status: 'in_progress'
    };
    
    // Add to checkpoints list
    this.integrationCheckpoints.push(checkpoint);
    
    try {
      // In a real implementation, this would perform actual validation
      // between components based on API contracts and dependencies
      
      // For now, simulate the validation
      const issues: IntegrationCheckpoint['results']['issues'] = [];
      
      // Check for components with circular dependencies
      const circularDependencies = this.detectCircularDependencies();
      
      for (const [component, circular] of circularDependencies) {
        issues.push({
          componentId: component,
          description: `Circular dependency detected: ${circular.join(' -> ')}`,
          severity: 'high'
        });
      }
      
      // Check for API contracts without proper schemas
      for (const [contractId, contract] of this.apiContracts.entries()) {
        const missingSchemas = contract.endpoints.filter(
          endpoint => !endpoint.requestSchema || !endpoint.responseSchema
        );
        
        if (missingSchemas.length > 0) {
          issues.push({
            componentId: contract.componentId,
            description: `API contract '${contractId}' has ${missingSchemas.length} endpoints with missing schemas`,
            severity: 'medium'
          });
        }
      }
      
      // Update checkpoint with results
      checkpoint.status = issues.length === 0 ? 'completed' : 'failed';
      checkpoint.results = {
        success: issues.length === 0,
        issues
      };
      
      // Broadcast checkpoint results
      await this.broadcastCheckpointResults(checkpoint);
      
      return checkpoint;
    } catch (error) {
      // Log error
      eventLogger.logError(
        this.id,
        'Integration checkpoint error',
        `Error performing integration checkpoint: ${error instanceof Error ? error.message : String(error)}`,
        error,
        EventSeverity.ERROR
      );
      
      // Update checkpoint with error status
      checkpoint.status = 'failed';
      checkpoint.results = {
        success: false,
        issues: [{
          componentId: 'integration-coordinator',
          description: `Error performing integration checkpoint: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'critical'
        }]
      };
      
      return checkpoint;
    }
  }
  
  /**
   * Validate an API contract
   * 
   * @param contract The API contract to validate
   * @returns Validation results
   */
  private async validateApiContract(contract: ApiContract): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    
    // Check for missing endpoint information
    for (const [index, endpoint] of contract.endpoints.entries()) {
      if (!endpoint.path) {
        issues.push({
          field: `endpoints[${index}].path`,
          issue: 'Endpoint path is missing',
          severity: 'high',
          recommendation: 'Provide a path for this endpoint'
        });
      }
      
      if (!endpoint.method) {
        issues.push({
          field: `endpoints[${index}].method`,
          issue: 'HTTP method is missing',
          severity: 'high',
          recommendation: 'Specify the HTTP method (GET, POST, etc.)'
        });
      }
      
      if (!endpoint.description) {
        issues.push({
          field: `endpoints[${index}].description`,
          issue: 'Endpoint description is missing',
          severity: 'medium',
          recommendation: 'Add a description for this endpoint'
        });
      }
      
      if (!endpoint.requestSchema) {
        issues.push({
          field: `endpoints[${index}].requestSchema`,
          issue: 'Request schema is missing',
          severity: 'medium',
          recommendation: 'Define the request schema for this endpoint'
        });
      }
      
      if (!endpoint.responseSchema) {
        issues.push({
          field: `endpoints[${index}].responseSchema`,
          issue: 'Response schema is missing',
          severity: 'medium',
          recommendation: 'Define the response schema for this endpoint'
        });
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Detect circular dependencies in components
   * 
   * @returns Map of components with circular dependencies
   */
  private detectCircularDependencies(): Map<string, string[]> {
    const circularDependencies = new Map<string, string[]>();
    
    // For each component, check if there's a path back to itself
    for (const [component, _] of this.componentDependencies.entries()) {
      const visited = new Set<string>();
      const path: string[] = [component];
      
      if (this.hasCircularDependency(component, visited, path)) {
        circularDependencies.set(component, [...path, component]);
      }
    }
    
    return circularDependencies;
  }
  
  /**
   * Check if a component has a circular dependency
   * 
   * @param component The component to check
   * @param visited Set of already visited components
   * @param path Current dependency path
   * @returns Whether a circular dependency was found
   */
  private hasCircularDependency(
    component: string,
    visited: Set<string>,
    path: string[]
  ): boolean {
    visited.add(component);
    
    const dependencies = this.componentDependencies.get(component) || [];
    
    for (const dependency of dependencies) {
      if (dependency === path[0]) {
        // Found circular dependency back to the start
        return true;
      }
      
      if (!visited.has(dependency)) {
        path.push(dependency);
        
        if (this.hasCircularDependency(dependency, visited, path)) {
          return true;
        }
        
        path.pop();
      }
    }
    
    return false;
  }
  
  /**
   * Broadcast integration checkpoint results
   * 
   * @param checkpoint The checkpoint to broadcast
   */
  private async broadcastCheckpointResults(checkpoint: IntegrationCheckpoint): Promise<void> {
    try {
      // Create checkpoint message
      const message: AgentMessage = {
        id: `msg_${uuidv4()}`,
        correlationId: `corr_${uuidv4()}`,
        conversationId: undefined,
        type: 'notification',
        eventType: 'EVENT',
        senderId: this.id,
        recipientId: 'all',
        priority: 'normal',
        content: {
          event: 'integration_checkpoint',
          checkpoint
        },
        timestamp: new Date().toISOString(),
        metadata: {
          tags: ['integration', 'checkpoint']
        }
      };
      
      // Send the message
      await this.sendBroadcastMessage(message);
      
      // Log the broadcast
      eventLogger.logAction(
        this.id,
        'Checkpoint results broadcast',
        'Broadcast integration checkpoint results to all agents',
        { 
          checkpointId: checkpoint.id,
          success: checkpoint.results?.success || false,
          issueCount: checkpoint.results?.issues.length || 0
        }
      );
    } catch (error) {
      eventLogger.logError(
        this.id,
        'Checkpoint broadcast error',
        `Error broadcasting checkpoint results: ${error instanceof Error ? error.message : String(error)}`,
        error,
        EventSeverity.ERROR
      );
    }
  }
  
  /**
   * Shut down the integration coordinator
   */
  shutdown(): void {
    // Clear integration interval
    if (this.integrationInterval) {
      clearInterval(this.integrationInterval);
    }
    
    eventLogger.logAction(
      this.id,
      'Integration Coordinator shutdown',
      'Integration Coordinator is shutting down',
      { shutdownTime: new Date().toISOString() }
    );
  }
}