/**
 * Architect Prime Agent
 * 
 * The highest level in the leadership hierarchy, responsible for maintaining 
 * the architectural vision and system integrity. Acts as the strategic
 * decision-maker and long-term planner for the entire system.
 */

import { Agent } from './Agent';
import { 
  AgentContext, 
  AgentResponse, 
  ValidationResult,
  AgentMessage
} from './types';
import { EventSeverity, eventLogger } from './EventLogger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Architect Prime Agent implementation
 */
export class ArchitectPrimeAgent extends Agent {
  /** System architecture vision document */
  private systemVision: string = '';
  
  /** System architecture diagrams (in mermaid format) */
  private architectureDiagrams: Map<string, string> = new Map();
  
  /** Design decisions and their rationales */
  private designDecisions: Array<{
    id: string;
    description: string;
    rationale: string;
    alternatives: string[];
    timestamp: string;
  }> = [];
  
  /** Cross-component dependency map */
  private dependencyMap: Map<string, string[]> = new Map();
  
  /**
   * Initialize a new Architect Prime Agent
   */
  constructor() {
    super('architect-prime', 'Architect Prime');
    
    // Register capabilities
    this.capabilities = [
      'system_architecture',
      'vision_maintenance',
      'architectural_decision_making',
      'system_integrity_validation',
      'cross_component_dependency_management',
      'architecture_diagram_generation'
    ];
    
    // Initialize default system vision
    this.systemVision = `
Spatialest System Vision - Benton County Assessor's Office AI Platform

This system implements a sophisticated AI-powered platform for property assessment,
combining advanced geospatial analytics, multi-agent collaboration, and intelligent
workflow orchestration. Our architecture emphasizes modularity, reliability, and
extensibility, allowing for continuous improvement and adaptation to changing assessment
requirements.

Key architectural principles:
1. Component-based design with clear separation of concerns
2. Multi-agent system with specialized domain expertise
3. Centralized coordination through Master Control Program (MCP)
4. Real-time data validation and compliance checking
5. AI-assisted valuation and assessment workflows
6. Comprehensive audit trail and explainability
    `;
    
    // Initialize basic architecture diagram
    this.architectureDiagrams.set('system_overview', `
graph TD
    User[User Interface] --> API[API Layer]
    API --> Core[Core Services]
    API --> Auth[Authentication]
    Core --> MCP[Master Control Program]
    MCP --> DataValidation[Data Validation Agent]
    MCP --> LegalCompliance[Legal Compliance Agent]
    MCP --> Valuation[Valuation Agent]
    MCP --> Workflow[Workflow Agent]
    MCP --> ArchitectPrime[Architect Prime Agent]
    MCP --> IntegrationCoord[Integration Coordinator Agent]
    Core --> DataStore[Data Store]
    DataStore --> Property[Property Data]
    DataStore --> Geospatial[Geospatial Data]
    DataStore --> Assessment[Assessment Records]
    DataStore --> Valuation[Valuation Models]
    `);
  }
  
  /**
   * Process a request to the Architect Prime Agent
   * 
   * @param context Context for the agent request
   * @returns Agent response with architecture information
   */
  async process(context: AgentContext): Promise<AgentResponse> {
    try {
      const { action, data } = context.input;
      
      // Process based on action
      switch (action) {
        case 'get_system_vision':
          return {
            success: true,
            result: {
              vision: this.systemVision
            }
          };
          
        case 'update_system_vision':
          if (typeof data.vision !== 'string') {
            return {
              success: false,
              error: 'Vision must be a string'
            };
          }
          
          this.systemVision = data.vision;
          await this.broadcastVisionUpdate();
          
          return {
            success: true,
            result: {
              vision: this.systemVision,
              message: 'System vision updated successfully'
            }
          };
          
        case 'get_architecture_diagram':
          const diagramId = data.diagramId || 'system_overview';
          const diagram = this.architectureDiagrams.get(diagramId);
          
          if (!diagram) {
            return {
              success: false,
              error: `Diagram with ID '${diagramId}' not found`
            };
          }
          
          return {
            success: true,
            result: {
              diagramId,
              diagram
            }
          };
          
        case 'update_architecture_diagram':
          if (!data.diagramId || typeof data.diagram !== 'string') {
            return {
              success: false,
              error: 'Diagram ID and content are required'
            };
          }
          
          this.architectureDiagrams.set(data.diagramId, data.diagram);
          
          return {
            success: true,
            result: {
              message: `Architecture diagram '${data.diagramId}' updated successfully`
            }
          };
          
        case 'add_design_decision':
          if (!data.description || !data.rationale) {
            return {
              success: false,
              error: 'Description and rationale are required for design decisions'
            };
          }
          
          const decisionId = data.id || `decision_${uuidv4()}`;
          
          this.designDecisions.push({
            id: decisionId,
            description: data.description,
            rationale: data.rationale,
            alternatives: data.alternatives || [],
            timestamp: new Date().toISOString()
          });
          
          return {
            success: true,
            result: {
              decisionId,
              message: 'Design decision recorded successfully'
            }
          };
          
        case 'get_design_decisions':
          return {
            success: true,
            result: {
              decisions: this.designDecisions
            }
          };
          
        case 'update_dependency_map':
          if (!data.componentId || !Array.isArray(data.dependencies)) {
            return {
              success: false,
              error: 'Component ID and dependencies array are required'
            };
          }
          
          this.dependencyMap.set(data.componentId, data.dependencies);
          
          return {
            success: true,
            result: {
              message: `Dependencies for component '${data.componentId}' updated successfully`
            }
          };
          
        case 'get_dependency_map':
          const componentId = data.componentId;
          
          if (componentId) {
            const dependencies = this.dependencyMap.get(componentId);
            
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
          
          for (const [component, deps] of this.dependencyMap.entries()) {
            dependencyMap[component] = deps;
          }
          
          return {
            success: true,
            result: {
              dependencyMap
            }
          };
          
        case 'validate_architecture':
          // Perform architecture validation
          const validationResult = await this.validateSystemArchitecture(data.componentId);
          
          return {
            success: true,
            result: validationResult
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
   * Validate the system architecture
   * 
   * @param componentId Optional specific component to validate
   * @returns Validation results
   */
  private async validateSystemArchitecture(componentId?: string): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    
    // In a real implementation, this would perform extensive architecture checks
    // For now, this is a placeholder for future implementation
    
    if (componentId) {
      // Validate specific component
      const dependencies = this.dependencyMap.get(componentId);
      
      if (!dependencies || dependencies.length === 0) {
        issues.push({
          field: 'dependencies',
          issue: `Component '${componentId}' has no defined dependencies`,
          severity: 'medium',
          recommendation: 'Define dependencies for this component or confirm it has no dependencies'
        });
      }
    } else {
      // Validate overall architecture
      
      // Check for circular dependencies
      const circularDependencies = this.detectCircularDependencies();
      
      for (const circular of circularDependencies) {
        issues.push({
          field: 'dependencies',
          issue: `Circular dependency detected: ${circular.join(' -> ')}`,
          severity: 'high',
          recommendation: 'Refactor components to remove circular dependencies'
        });
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Detect circular dependencies in the system
   * 
   * @returns Array of circular dependency chains
   */
  private detectCircularDependencies(): string[][] {
    const circularChains: string[][] = [];
    
    // Implementation would detect cycles in the dependency graph
    // This is a placeholder for future implementation
    
    return circularChains;
  }
  
  /**
   * Broadcast system vision update to all agents
   */
  private async broadcastVisionUpdate(): Promise<void> {
    try {
      // Create vision update message
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
          event: 'vision_update',
          vision: this.systemVision
        },
        timestamp: new Date().toISOString(),
        metadata: {
          tags: ['architecture', 'vision']
        }
      };
      
      // Send the message
      await this.sendBroadcastMessage(message);
      
      // Log the broadcast
      eventLogger.logAction(
        this.id,
        'Vision update broadcast',
        'Broadcast system vision update to all agents',
        { visionUpdated: true }
      );
    } catch (error) {
      eventLogger.logError(
        this.id,
        'Vision broadcast error',
        `Error broadcasting vision update: ${error instanceof Error ? error.message : String(error)}`,
        error,
        EventSeverity.ERROR
      );
    }
  }
}