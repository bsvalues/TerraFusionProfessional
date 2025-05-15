/**
 * Replay Buffer System
 * 
 * This module implements a centralized experience replay buffer for the agent system.
 * It stores experiences from all agents, facilitates learning from past interactions,
 * and enables continuous improvement of the agent ecosystem.
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentMessage } from './types';

/**
 * Experience entry stored in the replay buffer
 */
export interface Experience {
  /** Unique identifier for this experience */
  id: string;
  
  /** Timestamp when the experience was recorded */
  timestamp: string;
  
  /** ID of the agent that generated this experience */
  agentId: string;
  
  /** Initial state before the action */
  state: any;
  
  /** Action taken by the agent */
  action: any;
  
  /** Result or reward received after taking the action */
  result: any;
  
  /** New state after the action was taken */
  nextState: any;
  
  /** Priority score for this experience (higher means more important) */
  priority: number;
  
  /** Additional metadata about this experience */
  metadata?: Record<string, any>;
  
  /** Original message that generated this experience, if applicable */
  sourceMessage?: AgentMessage;
}

/**
 * Options for replay buffer configuration
 */
export interface ReplayBufferOptions {
  /** Maximum capacity of the buffer (oldest entries will be removed when full) */
  maxSize: number;
  
  /** Minimum priority threshold for experiences to be considered important */
  priorityThreshold: number;
  
  /** Whether to use prioritized experience sampling */
  usePrioritizedSampling: boolean;
  
  /** Whether to persist experiences to storage */
  persistExperiences: boolean;
  
  /** Logger function for internal events */
  logger?: (level: string, message: string, data?: any) => void;
}

/**
 * Default replay buffer options
 */
const DEFAULT_OPTIONS: ReplayBufferOptions = {
  maxSize: 10000,
  priorityThreshold: 0.7,
  usePrioritizedSampling: true,
  persistExperiences: false
};

/**
 * Centralized replay buffer for storing agent experiences
 */
export class ReplayBuffer {
  /** All experiences in the buffer */
  private experiences: Experience[] = [];
  
  /** Configuration options */
  private options: ReplayBufferOptions;
  
  /** Internal logging function */
  private log: (level: string, message: string, data?: any) => void;
  
  /**
   * Create a new replay buffer
   * 
   * @param options Configuration options
   */
  constructor(options: Partial<ReplayBufferOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Set up logging
    this.log = this.options.logger || 
      ((level, message, data) => console.log(`[ReplayBuffer] ${level.toUpperCase()}: ${message}`, data ? data : ''));
    
    this.log('info', 'Replay buffer initialized', { 
      maxSize: this.options.maxSize,
      priorityThreshold: this.options.priorityThreshold
    });
  }
  
  /**
   * Add a new experience to the buffer
   * 
   * @param experience Experience to add
   * @returns ID of the added experience
   */
  add(experience: Omit<Experience, 'id' | 'timestamp'>): string {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    const newExperience: Experience = {
      ...experience,
      id,
      timestamp
    };
    
    // Add to buffer
    this.experiences.push(newExperience);
    
    // Check if buffer is full and remove oldest entries if needed
    if (this.experiences.length > this.options.maxSize) {
      // Sort by priority before removing
      this.experiences.sort((a, b) => b.priority - a.priority);
      this.experiences = this.experiences.slice(0, this.options.maxSize);
      this.log('debug', 'Buffer full, removed oldest low-priority experiences');
    }
    
    // Check if this is a high-priority experience
    if (newExperience.priority >= this.options.priorityThreshold) {
      this.log('info', 'High priority experience recorded', { 
        id, 
        agentId: newExperience.agentId,
        priority: newExperience.priority
      });
    }
    
    return id;
  }
  
  /**
   * Sample experiences from the buffer for training
   * 
   * @param count Number of experiences to sample
   * @param agentId Optional filter for specific agent
   * @returns Array of sampled experiences
   */
  sample(count: number, agentId?: string): Experience[] {
    if (this.experiences.length === 0) {
      return [];
    }
    
    // Filter by agent if specified
    let candidateExperiences = this.experiences;
    if (agentId) {
      candidateExperiences = this.experiences.filter(exp => exp.agentId === agentId);
    }
    
    if (candidateExperiences.length === 0) {
      return [];
    }
    
    // Use prioritized sampling if enabled
    if (this.options.usePrioritizedSampling) {
      // Sort by priority
      candidateExperiences.sort((a, b) => b.priority - a.priority);
      
      // Take top N experiences
      return candidateExperiences.slice(0, Math.min(count, candidateExperiences.length));
    } else {
      // Random sampling
      const sampled: Experience[] = [];
      const availableCount = Math.min(count, candidateExperiences.length);
      
      for (let i = 0; i < availableCount; i++) {
        const randomIndex = Math.floor(Math.random() * candidateExperiences.length);
        sampled.push(candidateExperiences[randomIndex]);
        candidateExperiences.splice(randomIndex, 1);
      }
      
      return sampled;
    }
  }
  
  /**
   * Get all experiences for a specific agent
   * 
   * @param agentId Agent ID to filter by
   * @returns Array of experiences from the specified agent
   */
  getByAgentId(agentId: string): Experience[] {
    return this.experiences.filter(exp => exp.agentId === agentId);
  }
  
  /**
   * Get experiences by priority threshold
   * 
   * @param threshold Minimum priority value
   * @returns Array of experiences above the priority threshold
   */
  getByPriority(threshold: number): Experience[] {
    return this.experiences.filter(exp => exp.priority >= threshold);
  }
  
  /**
   * Get all experiences in the buffer
   * 
   * @returns All experiences
   */
  getAll(): Experience[] {
    return [...this.experiences];
  }
  
  /**
   * Get the current size of the buffer
   * 
   * @returns Number of experiences in the buffer
   */
  size(): number {
    return this.experiences.length;
  }
  
  /**
   * Clear all experiences from the buffer
   */
  clear(): void {
    this.experiences = [];
    this.log('info', 'Replay buffer cleared');
  }
  
  /**
   * Update the priority of an experience
   * 
   * @param id Experience ID
   * @param priority New priority value
   * @returns True if the experience was found and updated
   */
  updatePriority(id: string, priority: number): boolean {
    const experience = this.experiences.find(exp => exp.id === id);
    
    if (!experience) {
      return false;
    }
    
    experience.priority = priority;
    return true;
  }
  
  /**
   * Create a standard experience from a message interaction
   * 
   * @param message The agent message that was processed
   * @param result The result of processing the message
   * @param agentId ID of the agent that processed the message
   * @param priority Priority score for this experience
   * @returns The created experience
   */
  static createFromMessage(
    message: AgentMessage, 
    result: any,
    agentId: string,
    priority: number = 0.5
  ): Omit<Experience, 'id' | 'timestamp'> {
    return {
      agentId,
      state: { messageReceived: message },
      action: { processMessage: true },
      result,
      nextState: { messageProcessed: true, result },
      priority,
      sourceMessage: message,
      metadata: {
        messageType: message.type,
        senderId: message.senderId,
        recipientId: message.recipientId
      }
    };
  }
}

/**
 * Singleton instance of the replay buffer
 */
export const replayBuffer = new ReplayBuffer();