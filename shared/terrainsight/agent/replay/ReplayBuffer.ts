/**
 * Replay Buffer for Agent Learning
 * 
 * This file implements a replay buffer for storing agent experiences
 * and facilitating collaborative learning between agents.
 */

import { AgentExperience, ExperiencePriority, ExperienceType, LearningUpdate } from './types';

/**
 * Replay Buffer for storing and retrieving agent experiences
 */
export class ReplayBuffer {
  /** Experiences stored in the buffer */
  private experiences: AgentExperience[] = [];
  
  /** Maximum size of the buffer */
  private maxSize: number;
  
  /** Configuration settings */
  private config: {
    /** Threshold for initiating training */
    trainingThreshold: number;
    
    /** Whether to prioritize experiences */
    usePrioritization: boolean;
    
    /** Whether to deduplicate similar experiences */
    deduplicateSimilar: boolean;
    
    /** Expiration time for experiences in milliseconds */
    experienceExpirationMs: number | null;
  };
  
  /**
   * Create a new replay buffer
   * 
   * @param maxSize Maximum number of experiences to store
   * @param config Configuration options
   */
  constructor(
    maxSize: number = 1000,
    config: {
      trainingThreshold?: number;
      usePrioritization?: boolean;
      deduplicateSimilar?: boolean;
      experienceExpirationMs?: number | null;
    } = {}
  ) {
    this.maxSize = maxSize;
    this.config = {
      trainingThreshold: config.trainingThreshold || Math.floor(maxSize * 0.1),
      usePrioritization: config.usePrioritization !== undefined ? config.usePrioritization : true,
      deduplicateSimilar: config.deduplicateSimilar !== undefined ? config.deduplicateSimilar : true,
      experienceExpirationMs: config.experienceExpirationMs !== undefined ? config.experienceExpirationMs : null
    };
  }
  
  /**
   * Add an experience to the buffer
   * 
   * @param experience The experience to add
   * @returns True if the experience was added, false if it was deduplicated
   */
  add(experience: AgentExperience): boolean {
    // Add timestamp if not provided
    if (!experience.timestamp) {
      experience.timestamp = new Date().toISOString();
    }
    
    // Add ID if not provided
    if (!experience.id) {
      experience.id = `exp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }
    
    // Deduplicate if configured
    if (this.config.deduplicateSimilar && this.isDuplicate(experience)) {
      this.updateSimilarExperience(experience);
      return false;
    }
    
    // Add experience to buffer
    this.experiences.push(experience);
    
    // Remove oldest experiences if buffer is full
    if (this.experiences.length > this.maxSize) {
      this.experiences.shift();
    }
    
    // Remove expired experiences
    this.removeExpiredExperiences();
    
    return true;
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
   * Check if the buffer has reached the training threshold
   * 
   * @returns True if the buffer has enough experiences to trigger training
   */
  hasReachedTrainingThreshold(): boolean {
    return this.experiences.length >= this.config.trainingThreshold;
  }
  
  /**
   * Sample experiences from the buffer
   * 
   * @param count Number of experiences to sample (default: all)
   * @param filterFn Optional filter function to select specific experiences
   * @returns Array of sampled experiences
   */
  sample(
    count?: number, 
    filterFn?: (exp: AgentExperience) => boolean
  ): AgentExperience[] {
    // Apply filter if provided
    let filteredExperiences = filterFn 
      ? this.experiences.filter(filterFn) 
      : [...this.experiences];
    
    // Apply prioritization if configured
    if (this.config.usePrioritization) {
      filteredExperiences.sort((a, b) => {
        const priorityA = this.getPriorityValue(a.priority || 'normal');
        const priorityB = this.getPriorityValue(b.priority || 'normal');
        return priorityB - priorityA;
      });
    }
    
    // Return requested count or all experiences
    const sampleCount = count || filteredExperiences.length;
    return filteredExperiences.slice(0, sampleCount);
  }
  
  /**
   * Sample experiences by agent ID
   * 
   * @param agentId The agent ID to filter by
   * @param count Number of experiences to sample (default: all)
   * @returns Array of sampled experiences
   */
  sampleByAgent(agentId: string, count?: number): AgentExperience[] {
    return this.sample(count, exp => exp.agentId === agentId);
  }
  
  /**
   * Sample experiences by experience type
   * 
   * @param type The experience type to filter by
   * @param count Number of experiences to sample (default: all)
   * @returns Array of sampled experiences
   */
  sampleByType(type: ExperienceType, count?: number): AgentExperience[] {
    return this.sample(count, exp => exp.type === type);
  }
  
  /**
   * Clear the buffer
   */
  clear(): void {
    this.experiences = [];
  }
  
  /**
   * Get all experiences in the buffer
   * 
   * @returns Array of all experiences
   */
  getAll(): AgentExperience[] {
    return [...this.experiences];
  }
  
  /**
   * Get high priority experiences in the buffer
   * 
   * @returns Array of high priority experiences
   */
  getHighPriorityExperiences(): AgentExperience[] {
    return this.experiences.filter(exp => 
      exp.priority === 'high' || exp.priority === 'critical'
    );
  }
  
  /**
   * Remove expired experiences from the buffer
   * 
   * @returns Number of experiences removed
   */
  private removeExpiredExperiences(): number {
    if (!this.config.experienceExpirationMs) {
      return 0;
    }
    
    const now = new Date().getTime();
    const expiration = this.config.experienceExpirationMs;
    const originalLength = this.experiences.length;
    
    this.experiences = this.experiences.filter(exp => {
      const expTimestamp = new Date(exp.timestamp).getTime();
      return (now - expTimestamp) < expiration;
    });
    
    return originalLength - this.experiences.length;
  }
  
  /**
   * Check if an experience is similar to one already in the buffer
   * 
   * @param experience The experience to check
   * @returns True if a similar experience exists
   */
  private isDuplicate(experience: AgentExperience): boolean {
    return this.experiences.some(exp => 
      exp.agentId === experience.agentId &&
      exp.type === experience.type &&
      JSON.stringify(exp.state) === JSON.stringify(experience.state) &&
      JSON.stringify(exp.action) === JSON.stringify(experience.action)
    );
  }
  
  /**
   * Update an existing experience with information from a new similar one
   * 
   * @param experience The new experience with updated information
   */
  private updateSimilarExperience(experience: AgentExperience): void {
    const index = this.experiences.findIndex(exp => 
      exp.agentId === experience.agentId &&
      exp.type === experience.type &&
      JSON.stringify(exp.state) === JSON.stringify(experience.state) &&
      JSON.stringify(exp.action) === JSON.stringify(experience.action)
    );
    
    if (index !== -1) {
      // Update existing experience with new information
      const existing = this.experiences[index];
      
      // Increment occurrence count
      existing.occurrences = (existing.occurrences || 1) + 1;
      
      // Update result if provided
      if (experience.result) {
        existing.result = experience.result;
      }
      
      // Update nextState if provided
      if (experience.nextState) {
        existing.nextState = experience.nextState;
      }
      
      // Update priority if new priority is higher
      if (experience.priority && this.getPriorityValue(experience.priority) > 
          this.getPriorityValue(existing.priority || 'normal')) {
        existing.priority = experience.priority;
      }
      
      // Update timestamp to keep experience fresh
      existing.timestamp = new Date().toISOString();
    }
  }
  
  /**
   * Convert priority string to numeric value for comparison
   * 
   * @param priority The priority level
   * @returns Numeric value representing priority
   */
  private getPriorityValue(priority: ExperiencePriority): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }
  
  /**
   * Extract learning statistics from the buffer
   * 
   * @returns Object with learning statistics
   */
  getLearningStatistics(): {
    totalExperiences: number;
    byAgent: Record<string, number>;
    byType: Record<ExperienceType, number>;
    byPriority: Record<ExperiencePriority, number>;
    recentAdditions: number;
  } {
    const byAgent: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    // Count last 10 minutes of experiences
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    let recentAdditions = 0;
    
    for (const exp of this.experiences) {
      // Count by agent
      byAgent[exp.agentId] = (byAgent[exp.agentId] || 0) + 1;
      
      // Count by type
      byType[exp.type] = (byType[exp.type] || 0) + 1;
      
      // Count by priority
      const priority = exp.priority || 'normal';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
      
      // Count recent additions
      if (exp.timestamp > tenMinutesAgo) {
        recentAdditions++;
      }
    }
    
    return {
      totalExperiences: this.experiences.length,
      byAgent,
      byType: byType as Record<ExperienceType, number>,
      byPriority: byPriority as Record<ExperiencePriority, number>,
      recentAdditions
    };
  }
}

/**
 * Global singleton instance of the replay buffer
 */
export const replayBuffer = new ReplayBuffer();