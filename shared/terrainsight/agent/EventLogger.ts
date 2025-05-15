/**
 * Event Logger
 * 
 * This file implements a logging system for internal events within the agent system.
 */

/**
 * Event types
 */
export enum EventType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  AUDIT = 'AUDIT',
  METRIC = 'METRIC',
  TRACE = 'TRACE'
}

/**
 * Event severity levels
 */
export enum EventSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Event log entry
 */
export interface EventLogEntry {
  /** Event ID */
  id?: string;
  
  /** Timestamp of the event */
  timestamp?: Date;
  
  /** Type of event */
  type: EventType;
  
  /** Severity of the event (optional, defaults to LOW) */
  severity?: EventSeverity;
  
  /** Source of the event */
  source: string;
  
  /** Event message */
  message: string;
  
  /** Additional event data */
  data?: any;
}

/**
 * Event Logger
 * 
 * Logs internal system events for monitoring and debugging.
 */
export class EventLogger {
  /** In-memory storage for events */
  private events: EventLogEntry[] = [];
  
  /** Maximum events to store in memory */
  private maxEvents: number;
  
  /** Event listeners */
  private listeners: Map<string, (event: EventLogEntry) => void> = new Map();
  
  /** Filter function for console output */
  private consoleFilter: (event: EventLogEntry) => boolean;
  
  /**
   * Create a new EventLogger
   * 
   * @param options Configuration options
   */
  constructor(options: {
    maxEvents?: number;
    consoleOutput?: boolean;
    consoleFilter?: (event: EventLogEntry) => boolean;
  } = {}) {
    this.maxEvents = options.maxEvents || 1000;
    
    // Set up console output if enabled
    this.consoleFilter = options.consoleFilter || (() => true);
    
    if (options.consoleOutput !== false) {
      this.addListener('console', (event) => {
        if (this.consoleFilter(event)) {
          this.logToConsole(event);
        }
      });
    }
  }
  
  /**
   * Log an event
   * 
   * @param event The event to log
   * @returns The logged event with ID and timestamp
   */
  log(event: EventLogEntry): EventLogEntry {
    // Add ID and timestamp if not provided
    const completeEvent: EventLogEntry = {
      ...event,
      id: event.id || this.generateEventId(),
      timestamp: event.timestamp || new Date(),
      severity: event.severity || EventSeverity.LOW
    };
    
    // Add to in-memory storage
    this.events.push(completeEvent);
    
    // Trim if exceeding max size
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
    
    // Notify listeners
    for (const listener of this.listeners.values()) {
      try {
        listener(completeEvent);
      } catch (error) {
        // Avoid recursive error logging
        console.error('Error in event listener:', error);
      }
    }
    
    return completeEvent;
  }
  
  /**
   * Add a listener for events
   * 
   * @param id Listener ID
   * @param listener Function to call for each new event
   * @returns true if the listener was added, false if the ID was already in use
   */
  addListener(id: string, listener: (event: EventLogEntry) => void): boolean {
    if (this.listeners.has(id)) {
      return false;
    }
    
    this.listeners.set(id, listener);
    return true;
  }
  
  /**
   * Remove a listener
   * 
   * @param id Listener ID
   * @returns true if the listener was removed, false if it wasn't found
   */
  removeListener(id: string): boolean {
    return this.listeners.delete(id);
  }
  
  /**
   * Get recent events
   * 
   * @param count Maximum number of events to retrieve
   * @param filter Optional filter function
   * @returns Array of matching events, most recent first
   */
  getRecentEvents(count: number = 100, filter?: (event: EventLogEntry) => boolean): EventLogEntry[] {
    let events = [...this.events];
    
    // Apply filter if provided
    if (filter) {
      events = events.filter(filter);
    }
    
    // Sort by timestamp (newest first)
    events.sort((a, b) => {
      return (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0);
    });
    
    // Apply count limit
    return events.slice(0, count);
  }
  
  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
  
  /**
   * Generate a simple event ID
   * 
   * @returns Event ID string
   */
  private generateEventId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * Log an event to the console
   * 
   * @param event The event to log
   */
  private logToConsole(event: EventLogEntry): void {
    const timestamp = event.timestamp ? event.timestamp.toISOString() : new Date().toISOString();
    const message = `[${timestamp}] [${event.type}] [${event.source}] ${event.message}`;
    
    switch (event.type) {
      case EventType.ERROR:
        console.error(message, event.data);
        break;
      case EventType.WARNING:
        console.warn(message, event.data);
        break;
      case EventType.DEBUG:
        console.debug(message, event.data);
        break;
      default:
        console.log(message, event.data);
        break;
    }
  }
}

/**
 * Singleton instance of the event logger
 */
export const eventLogger = new EventLogger({
  consoleOutput: true,
  consoleFilter: (event) => event.type !== EventType.TRACE && event.type !== EventType.DEBUG
});