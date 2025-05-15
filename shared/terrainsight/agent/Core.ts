/**
 * Core - Master Hub
 * 
 * The Core serves as the central orchestrator for the entire agent system.
 * It manages configurations, system-wide directives, shared resources,
 * and integrates responses from various agents.
 */

import { v4 as uuidv4 } from 'uuid';
import { config, AgentSystemConfig } from './config';
import { masterControlProgram } from './MasterControlProgram';
import { agentManager } from './AgentManager';
import { replayBuffer } from './ReplayBuffer';
import { eventLogger, EventType, EventSeverity } from './EventLogger';
import { Agent } from './Agent';
import { AgentMessage } from './types';

// Define message event types for the standardized communication protocol
const MessageEventType = {
  COMMAND: 'COMMAND',             // Directs an agent to perform an action
  EVENT: 'EVENT',                 // Notifies about something that happened
  QUERY: 'QUERY',                 // Requests information
  RESPONSE: 'RESPONSE',           // Replies to a query or command
  ERROR: 'ERROR',                 // Reports an error condition
  STATUS_UPDATE: 'STATUS_UPDATE'  // Provides agent status information
} as const;

/**
 * Core status
 */
export interface CoreStatus {
  /** Status of the core */
  status: 'initializing' | 'running' | 'degraded' | 'error' | 'shutdown';
  
  /** Number of registered agents */
  agentCount: number;
  
  /** System version */
  systemVersion: string;
  
  /** Deployment environment */
  environment: string;
  
  /** Uptime in seconds */
  uptimeSeconds: number;
  
  /** Memory usage statistics */
  memoryUsage?: {
    /** RSS memory usage */
    rss: number;
    
    /** Heap total */
    heapTotal: number;
    
    /** Heap used */
    heapUsed: number;
  };
  
  /** Last error if any */
  lastError?: {
    /** Error message */
    message: string;
    
    /** Timestamp */
    timestamp: string;
  };
}

/**
 * Master prompt version
 */
export interface MasterPromptVersion {
  /** Version of the master prompt */
  version: string;
  
  /** Content of the master prompt */
  content: string;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
  
  /** Whether this is the active version */
  active: boolean;
}

/**
 * Core class - The Master Hub
 * 
 * Central orchestrator for the entire agent system.
 */
export class Core {
  /** Core ID */
  private id: string;
  
  /** Core name */
  private name: string;
  
  /** Start time */
  private startTime: Date;
  
  /** Current status */
  private status: CoreStatus['status'];
  
  /** Last error */
  private lastError?: CoreStatus['lastError'];
  
  /** System configuration */
  private systemConfig: AgentSystemConfig;
  
  /** Master prompt versions */
  private masterPromptVersions: Map<string, MasterPromptVersion>;
  
  /** Active master prompt */
  private activeMasterPrompt?: MasterPromptVersion;
  
  /** Registered modules */
  private modules: Map<string, any>;
  
  /** Health check interval handle */
  private healthCheckInterval?: NodeJS.Timeout;
  
  /**
   * Initialize the Core
   */
  constructor() {
    this.id = 'core';
    this.name = 'System Core';
    this.startTime = new Date();
    this.status = 'initializing';
    this.systemConfig = config;
    this.masterPromptVersions = new Map();
    this.modules = new Map();
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'Core',
      message: 'Core is initializing',
      data: { timestamp: new Date().toISOString() }
    });
  }
  
  /**
   * Start the Core
   */
  async start(): Promise<boolean> {
    try {
      // Initialize master prompt
      await this.initializeMasterPrompt();
      
      // Start health check
      this.startHealthCheck();
      
      // Set status to running
      this.status = 'running';
      
      eventLogger.log({
        type: EventType.INFO,
        source: 'Core',
        message: 'Core has successfully started',
        data: { timestamp: new Date().toISOString() }
      });
      
      return true;
    } catch (error) {
      this.status = 'error';
      this.lastError = {
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
      
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.CRITICAL,
        source: 'Core',
        message: `Error starting core: ${error instanceof Error ? error.message : String(error)}`,
        data: error
      });
      
      return false;
    }
  }
  
  /**
   * Initialize the master prompt
   */
  private async initializeMasterPrompt(): Promise<void> {
    // Default master prompt
    const defaultMasterPrompt: MasterPromptVersion = {
      version: '1.0.0',
      content: `
Master Prompt – System Integration and Collaboration Directive

Attention all agents: As part of our integrated system, each agent is responsible for executing its domain-specific 
tasks while maintaining communication using our standard JSON messaging format. The Core serves as the master hub, 
ensuring configuration consistency and orchestrating cross-module activities. The Replit AI Agent is your real-time 
coordinator, while the MCP monitors overall performance and directs task assignments when issues occur.

Every action you perform must be logged in the shared replay buffer. On completion of every major task, review 
your performance metrics and, if performance thresholds are not met, issue a 'task_request' for assistance. 
Furthermore, please ensure that you adhere to our established protocols for communication and security. 
Report any anomalies immediately to the MCP.

This directive remains effective in both standalone and integrated modes. Adapt and execute tasks based on 
real-time feedback while maintaining alignment with the overall system objectives. Your collaborative efforts 
drive continuous improvement and system optimization. End of directive.
      `,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true
    };
    
    // Add default master prompt
    this.masterPromptVersions.set(defaultMasterPrompt.version, defaultMasterPrompt);
    this.activeMasterPrompt = defaultMasterPrompt;
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'Core',
      message: 'Default master prompt has been initialized',
      data: { 
        version: defaultMasterPrompt.version,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Start health check
   */
  private startHealthCheck(): void {
    // Clear existing interval if any
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Start health check interval
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }
  
  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      
      // Update status
      if (this.status === 'running' || this.status === 'degraded') {
        // Check if any critical services are down
        const agentStatuses = agentManager.getAllAgentStatus();
        const unhealthyAgents = agentStatuses.filter(status => !status.healthy);
        
        if (unhealthyAgents.length > 0) {
          this.status = 'degraded';
          
          eventLogger.log({
            type: EventType.WARNING,
            severity: EventSeverity.MEDIUM,
            source: 'Core',
            message: `${unhealthyAgents.length} unhealthy agents detected during health check`,
            data: { unhealthyAgents: unhealthyAgents.map(a => a.id) }
          });
        } else {
          this.status = 'running';
        }
      }
      
      // Broadcast status update
      await this.broadcastStatusUpdate({
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed
      });
    } catch (error) {
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.HIGH,
        source: 'Core',
        message: `Error during health check: ${error instanceof Error ? error.message : String(error)}`,
        data: error
      });
    }
  }
  
  /**
   * Broadcast status update to all agents
   */
  private async broadcastStatusUpdate(memoryUsage: CoreStatus['memoryUsage']): Promise<void> {
    try {
      const statusMessage: AgentMessage = {
        id: `msg_${uuidv4()}`,
        correlationId: `corr_${uuidv4()}`,
        conversationId: undefined,
        type: 'notification',
        eventType: MessageEventType.STATUS_UPDATE,
        senderId: this.id,
        recipientId: 'all',
        priority: 'normal',
        content: {
          event: 'core_status_update',
          coreStatus: this.getStatus()
        },
        timestamp: new Date().toISOString(),
        metadata: {
          ttl: 60, // 1 minute
          tags: ['core', 'status_update']
        }
      };
      
      // Send through MCP
      await masterControlProgram.broadcastMessage(statusMessage);
    } catch (error) {
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.ERROR,
        source: 'Core',
        message: `Error broadcasting status update: ${error instanceof Error ? error.message : String(error)}`,
        data: error
      });
    }
  }
  
  /**
   * Get core status
   */
  getStatus(): CoreStatus {
    return {
      status: this.status,
      agentCount: agentManager.getAllAgents().length,
      systemVersion: this.systemConfig.version,
      environment: this.systemConfig.environment,
      uptimeSeconds: Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000),
      memoryUsage: process.memoryUsage() ? {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed
      } : undefined,
      lastError: this.lastError
    };
  }
  
  /**
   * Get the active master prompt
   */
  getActiveMasterPrompt(): MasterPromptVersion | undefined {
    return this.activeMasterPrompt;
  }
  
  /**
   * Get all master prompt versions
   */
  getAllMasterPromptVersions(): MasterPromptVersion[] {
    return Array.from(this.masterPromptVersions.values());
  }
  
  /**
   * Add a new master prompt version
   */
  addMasterPromptVersion(content: string, activate: boolean = false): MasterPromptVersion {
    // Generate new version
    const currentVersion = this.activeMasterPrompt?.version || '0.0.0';
    const versionParts = currentVersion.split('.');
    const newVersion = `${versionParts[0]}.${versionParts[1]}.${parseInt(versionParts[2]) + 1}`;
    
    // Create new prompt version
    const newPrompt: MasterPromptVersion = {
      version: newVersion,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: activate
    };
    
    // Add to map
    this.masterPromptVersions.set(newVersion, newPrompt);
    
    // If activate is true, set as active and deactivate others
    if (activate) {
      this.activateMasterPromptVersion(newVersion);
    }
    
    eventLogger.logSystemEvent(
      'Master prompt added',
      `New master prompt version ${newVersion} has been added`,
      { 
        version: newVersion,
        activated: activate,
        timestamp: new Date().toISOString()
      }
    );
    
    return newPrompt;
  }
  
  /**
   * Activate a master prompt version
   */
  activateMasterPromptVersion(version: string): boolean {
    // Check if version exists
    if (!this.masterPromptVersions.has(version)) {
      eventLogger.logError(
        'system',
        'Master prompt activation error',
        `Master prompt version ${version} not found`,
        { version },
        EventSeverity.ERROR
      );
      
      return false;
    }
    
    // Deactivate all prompts
    for (const [_, prompt] of this.masterPromptVersions.entries()) {
      prompt.active = false;
      prompt.updatedAt = new Date().toISOString();
    }
    
    // Activate selected prompt
    const promptToActivate = this.masterPromptVersions.get(version);
    if (promptToActivate) {
      promptToActivate.active = true;
      promptToActivate.updatedAt = new Date().toISOString();
      this.activeMasterPrompt = promptToActivate;
      
      // Broadcast new master prompt to all agents
      this.broadcastMasterPrompt();
      
      eventLogger.logSystemEvent(
        'Master prompt activated',
        `Master prompt version ${version} has been activated`,
        { 
          version,
          timestamp: new Date().toISOString()
        }
      );
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Broadcast the active master prompt to all agents
   */
  private async broadcastMasterPrompt(): Promise<void> {
    if (!this.activeMasterPrompt) {
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.ERROR,
        source: 'Core',
        message: 'No active master prompt to broadcast',
        data: {}
      });
      
      return;
    }
    
    try {
      const promptMessage: AgentMessage = {
        id: `msg_${uuidv4()}`,
        correlationId: `corr_${uuidv4()}`,
        conversationId: undefined,
        type: 'notification',
        eventType: MessageEventType.COMMAND,
        senderId: this.id,
        recipientId: 'all',
        priority: 'high',
        content: {
          action: 'update_master_prompt',
          masterPrompt: this.activeMasterPrompt
        },
        timestamp: new Date().toISOString(),
        metadata: {
          requiresAcknowledgment: true,
          tags: ['core', 'master_prompt']
        }
      };
      
      // Send through MCP
      await masterControlProgram.broadcastMessage(promptMessage);
      
      eventLogger.logSystemEvent(
        'Master prompt broadcast',
        'Active master prompt has been broadcast to all agents',
        { 
          version: this.activeMasterPrompt.version,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.ERROR,
        source: 'Core',
        message: `Error broadcasting master prompt: ${error instanceof Error ? error.message : String(error)}`,
        data: error
      });
    }
  }
  
  /**
   * Register a module with the Core
   */
  registerModule(moduleId: string, module: any): boolean {
    this.modules.set(moduleId, module);
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'Core',
      message: `Module ${moduleId} has been registered with the Core`,
      data: { 
        moduleId,
        timestamp: new Date().toISOString()
      }
    });
    
    return true;
  }
  
  /**
   * Get a registered module
   */
  getModule(moduleId: string): any {
    return this.modules.get(moduleId);
  }
  
  /**
   * Shutdown the Core
   */
  async shutdown(): Promise<void> {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Set status to shutdown
    this.status = 'shutdown';
    
    // Shutdown agent manager
    agentManager.shutdown();
    
    eventLogger.log({
      type: EventType.INFO,
      source: 'Core',
      message: 'Core has been shut down',
      data: { timestamp: new Date().toISOString() }
    });
  }
}

/**
 * Singleton instance of the Core
 */
export const core = new Core();