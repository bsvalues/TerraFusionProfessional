/**
 * Base Agent class for the multi-agent system
 * 
 * This class provides the foundation for all specialized agents
 * in the Benton County Assessor's Office platform.
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentCapability, MessageType, AgentMessage, MessageHandler, MessageFilter, AgentStatus } from './types';

export class Agent {
  id: string;
  name: string;
  capabilities: AgentCapability[];
  private messageBus: any;
  private replayBuffer: any;
  private responseHandlers: Map<string, { handler: Function, timeout: NodeJS.Timeout }>;
  logger: { 
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
  };
  
  constructor(id: string, name: string, capabilities: AgentCapability[] = []) {
    this.id = id;
    this.name = name;
    this.capabilities = capabilities;
    this.responseHandlers = new Map();
    
    // Simple logger
    this.logger = {
      debug: (message: string, ...args: any[]) => console.debug(`[${this.name}][DEBUG] ${message}`, ...args),
      info: (message: string, ...args: any[]) => console.info(`[${this.name}][INFO] ${message}`, ...args),
      warn: (message: string, ...args: any[]) => console.warn(`[${this.name}][WARN] ${message}`, ...args),
      error: (message: string, ...args: any[]) => console.error(`[${this.name}][ERROR] ${message}`, ...args)
    };
  }
  
  /**
   * Initialize the agent with the message bus and other resources
   */
  async initialize(messageBus: any, replayBuffer: any): Promise<void> {
    this.messageBus = messageBus;
    this.replayBuffer = replayBuffer;
    this.logger.info(`Agent ${this.name} initialized`);
    
    // Subscribe to messages
    if (this.messageBus) {
      this.subscribeToMessages();
    }
  }
  
  /**
   * Subscribe to relevant messages
   */
  protected subscribeToMessages(): void {
    // Subscribe to messages directed to this agent
    this.messageBus.subscribe(
      this.id,
      { recipientId: this.id },
      this.processMessage.bind(this)
    );
    
    // Subscribe to broadcast messages
    this.messageBus.subscribe(
      `${this.id}-broadcasts`,
      { recipientId: 'all' },
      this.processMessage.bind(this)
    );
  }
  
  /**
   * Process incoming messages
   */
  async processMessage(message: AgentMessage): Promise<void> {
    this.logger.debug(`Processing message: ${message.id}`);
    
    // Check if this is a response to a message we're waiting for
    if (message.metadata && message.metadata.inReplyTo && this.responseHandlers.has(message.metadata.inReplyTo)) {
      const { handler } = this.responseHandlers.get(message.metadata.inReplyTo)!;
      clearTimeout(this.responseHandlers.get(message.metadata.inReplyTo)!.timeout);
      this.responseHandlers.delete(message.metadata.inReplyTo);
      await handler(message);
      return;
    }
    
    // Process by event type
    if (message.eventType === 'COMMAND') {
      await this.handleCommand(message);
    } else if (message.eventType === 'QUERY') {
      await this.handleQuery(message);
    } else if (message.eventType === 'EVENT') {
      await this.handleEvent(message);
    } else if (message.eventType === 'STATUS_UPDATE') {
      await this.handleStatusUpdate(message);
    } else if (message.eventType === 'RESPONSE') {
      await this.handleResponse(message);
    }
  }
  
  /**
   * Handle command messages
   */
  async handleCommand(message: AgentMessage): Promise<void> {
    // Default implementation - can be overridden by subclasses
    this.logger.debug(`Received command: ${JSON.stringify(message.content)}`);
    
    // Reply with not implemented
    await this.sendMessage({
      id: `resp_${message.id}`,
      correlationId: message.correlationId,
      type: 'response',
      eventType: 'RESPONSE',
      senderId: this.id,
      recipientId: message.senderId,
      content: {
        status: 'error',
        message: `Command not implemented by ${this.name}`
      },
      priority: 'normal',
      timestamp: new Date().toISOString(),
      metadata: {
        inReplyTo: message.id
      }
    });
  }
  
  /**
   * Handle query messages
   */
  async handleQuery(message: AgentMessage): Promise<void> {
    // Default implementation - can be overridden by subclasses
    this.logger.debug(`Received query: ${JSON.stringify(message.content)}`);
    
    // For status queries, return agent status
    if (message.content && message.content.query === 'status') {
      const status = await this.getStatus();
      await this.sendMessage({
        id: `resp_${message.id}`,
        correlationId: message.correlationId,
        type: 'response',
        eventType: 'RESPONSE',
        senderId: this.id,
        recipientId: message.senderId,
        content: status,
        priority: 'normal',
        timestamp: new Date().toISOString(),
        metadata: {
          inReplyTo: message.id
        }
      });
      return;
    }
    
    // Reply with not implemented
    await this.sendMessage({
      id: `resp_${message.id}`,
      correlationId: message.correlationId,
      type: 'response',
      eventType: 'RESPONSE',
      senderId: this.id,
      recipientId: message.senderId,
      content: {
        status: 'error',
        message: `Query not implemented by ${this.name}`
      },
      priority: 'normal',
      timestamp: new Date().toISOString(),
      metadata: {
        inReplyTo: message.id
      }
    });
  }
  
  /**
   * Handle event messages
   */
  async handleEvent(message: AgentMessage): Promise<void> {
    // Default implementation - can be overridden by subclasses
    this.logger.debug(`Received event: ${JSON.stringify(message.content)}`);
    
    // Most events don't require a response, but we'll acknowledge it
    await this.acknowledgeMessage(message);
  }
  
  /**
   * Handle status update messages
   */
  async handleStatusUpdate(message: AgentMessage): Promise<void> {
    // Default implementation - can be overridden by subclasses
    this.logger.debug(`Received status update: ${JSON.stringify(message.content)}`);
    
    // Status updates don't require a response
  }
  
  /**
   * Handle response messages
   */
  async handleResponse(message: AgentMessage): Promise<void> {
    // Default implementation - can be overridden by subclasses
    this.logger.debug(`Received response: ${JSON.stringify(message.content)}`);
    
    // Responses don't require a response
  }
  
  /**
   * Create a new message
   */
  createMessage(eventType: string, recipientId: string, content: any, options: any = {}): AgentMessage {
    const messageId = options.id || `msg_${uuidv4()}`;
    const conversationId = options.conversationId || `conv_${uuidv4()}`;
    const correlationId = options.correlationId || `corr_${uuidv4()}`;
    const priority = options.priority || 'normal';
    
    return {
      id: messageId,
      correlationId,
      conversationId,
      type: this.mapEventTypeToLegacyType(eventType),
      eventType,
      senderId: this.id,
      recipientId,
      content,
      priority,
      timestamp: new Date().toISOString(),
      metadata: options.metadata || {}
    };
  }
  
  /**
   * Map event type to legacy message type
   */
  mapEventTypeToLegacyType(eventType: string): MessageType {
    if (eventType === 'COMMAND') return 'request';
    if (eventType === 'QUERY') return 'query';
    if (eventType === 'EVENT') return 'notification';
    if (eventType === 'RESPONSE') return 'response';
    if (eventType === 'ERROR') return 'error';
    if (eventType === 'STATUS_UPDATE') return 'notification';
    
    // Default
    return 'notification';
  }
  
  /**
   * Send a message
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    if (!this.messageBus) {
      this.logger.error('Cannot send message: message bus not initialized');
      return;
    }
    
    await this.messageBus.publish(message);
  }
  
  /**
   * Acknowledge a message
   */
  async acknowledgeMessage(originalMessage: AgentMessage): Promise<void> {
    // Create acknowledgment message
    const ackMessage = this.createMessage(
      'RESPONSE',
      originalMessage.senderId,
      { acknowledged: true },
      {
        correlationId: originalMessage.correlationId,
        metadata: {
          inReplyTo: originalMessage.id
        }
      }
    );
    
    // Send acknowledgment
    await this.sendMessage(ackMessage);
  }
  
  /**
   * Register a response handler
   */
  registerResponseHandler(messageId: string, handler: Function, timeout: number = 30000): void {
    // Set a timeout to clean up the handler if no response is received
    const timeoutId = setTimeout(() => {
      if (this.responseHandlers.has(messageId)) {
        const { handler } = this.responseHandlers.get(messageId)!;
        this.responseHandlers.delete(messageId);
        handler({ 
          error: 'Response timeout',
          messageId
        });
      }
    }, timeout);
    
    // Register the handler
    this.responseHandlers.set(messageId, { handler, timeout: timeoutId });
  }
  
  /**
   * Get agent status
   */
  async getStatus(): Promise<AgentStatus> {
    return {
      id: this.id,
      name: this.name,
      status: 'operational',
      capabilities: this.capabilities,
      lastUpdated: new Date().toISOString(),
      details: {}
    };
  }
}