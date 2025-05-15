/**
 * Audit Logger
 * 
 * This file implements an audit logging system for regulatory compliance,
 * tracking all changes to property data and assessments.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventLogger, EventType, EventSeverity } from './EventLogger';

/**
 * Audit record action type
 */
export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VALIDATE = 'VALIDATE',
  ASSESS = 'ASSESS',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  API_ACCESS = 'API_ACCESS'
}

/**
 * Audit record entity type
 */
export enum AuditEntityType {
  PROPERTY = 'PROPERTY',
  ASSESSMENT = 'ASSESSMENT',
  USER = 'USER',
  WORKFLOW = 'WORKFLOW',
  REPORT = 'REPORT',
  SYSTEM = 'SYSTEM',
  AGENT = 'AGENT',
  CONFIGURATION = 'CONFIGURATION',
  GEOSPATIAL = 'GEOSPATIAL'
}

/**
 * Audit record details
 */
export interface AuditRecord {
  /** Unique audit record ID */
  id: string;
  
  /** Timestamp of the audit event */
  timestamp: Date;
  
  /** User or system component that performed the action */
  actor: string;
  
  /** Type of action performed */
  action: AuditAction;
  
  /** Type of entity affected */
  entityType: AuditEntityType;
  
  /** ID of the entity affected */
  entityId: string;
  
  /** Previous state (for updates, optional) */
  previousState?: any;
  
  /** New state (for creates/updates, optional) */
  newState?: any;
  
  /** Changes made (for updates, optional) */
  changes?: Record<string, { previous: any; new: any }>;
  
  /** IP address (for user actions, optional) */
  ipAddress?: string;
  
  /** Request ID (for API calls, optional) */
  requestId?: string;
  
  /** Additional context data */
  context?: Record<string, any>;
  
  /** Success status of the action */
  success: boolean;
  
  /** Error message if action failed */
  error?: string;
}

/**
 * Audit search criteria
 */
export interface AuditSearchCriteria {
  /** Start time for audit records */
  startTime?: Date;
  
  /** End time for audit records */
  endTime?: Date;
  
  /** Filter by actor */
  actor?: string;
  
  /** Filter by action type */
  action?: AuditAction | AuditAction[];
  
  /** Filter by entity type */
  entityType?: AuditEntityType | AuditEntityType[];
  
  /** Filter by entity ID */
  entityId?: string;
  
  /** Filter by success status */
  success?: boolean;
  
  /** Full text search on all fields */
  query?: string;
  
  /** Maximum records to return */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
}

/**
 * Audit Logger Service
 * 
 * Manages creation, storage, and retrieval of audit records
 * for regulatory compliance and system tracking.
 */
export class AuditLogger {
  /** In-memory storage for audit records */
  private auditRecords: AuditRecord[] = [];
  
  /** Maximum records to keep in memory */
  private maxRecords: number;
  
  /** Event logger for system integration */
  private eventLogger: EventLogger;
  
  /** Persistence handler for long-term storage */
  private persistenceHandler?: (records: AuditRecord[]) => Promise<void>;
  
  /** Regulatory compliance handler */
  private complianceHandler?: (record: AuditRecord) => Promise<void>;
  
  /** Database persistence enabled flag */
  private dbPersistenceEnabled: boolean = false;
  
  /**
   * Create a new AuditLogger
   * 
   * @param options Configuration options
   */
  constructor(options: {
    maxRecords?: number;
    eventLogger?: EventLogger;
    persistenceHandler?: (records: AuditRecord[]) => Promise<void>;
    complianceHandler?: (record: AuditRecord) => Promise<void>;
    dbPersistenceEnabled?: boolean;
  } = {}) {
    this.maxRecords = options.maxRecords || 10000;
    this.eventLogger = options.eventLogger || new EventLogger();
    this.persistenceHandler = options.persistenceHandler;
    this.complianceHandler = options.complianceHandler;
    this.dbPersistenceEnabled = options.dbPersistenceEnabled ?? true;
    
    // Set up periodic persistence if handler provided or database persistence is enabled
    if (this.persistenceHandler || this.dbPersistenceEnabled) {
      setInterval(async () => {
        if (this.auditRecords.length > 0) {
          await this.persistRecords();
        }
      }, 60000); // Persist every minute
    }
  }
  
  /**
   * Log an audit event
   * 
   * @param record The audit record to log
   * @returns The created audit record with ID
   */
  async log(record: Omit<AuditRecord, 'id' | 'timestamp'>): Promise<AuditRecord> {
    const completeRecord: AuditRecord = {
      ...record,
      id: uuidv4(),
      timestamp: new Date()
    };
    
    // Add to in-memory storage
    this.auditRecords.push(completeRecord);
    
    // Immediately persist to database if enabled
    if (this.dbPersistenceEnabled) {
      try {
        // This is a dynamic import to avoid circular dependencies
        const { auditService } = await import('../../server/services/audit-service');
        
        // Convert to database format
        const dbRecord = {
          id: completeRecord.id,
          timestamp: completeRecord.timestamp,
          actor: completeRecord.actor,
          action: completeRecord.action,
          entityType: completeRecord.entityType,
          entityId: completeRecord.entityId,
          previousState: completeRecord.previousState,
          newState: completeRecord.newState,
          changes: completeRecord.changes,
          ipAddress: completeRecord.ipAddress,
          requestId: completeRecord.requestId,
          context: completeRecord.context,
          success: completeRecord.success,
          error: completeRecord.error,
          retentionPeriod: 2555, // Default 7 years retention
          isArchived: false
        };
        
        await auditService.createAuditRecord(dbRecord);
        
        this.eventLogger.log({
          type: EventType.INFO,
          severity: EventSeverity.LOW,
          source: 'AuditLogger',
          message: 'Persisted audit record to database',
          data: { id: completeRecord.id }
        });
      } catch (error) {
        this.eventLogger.log({
          type: EventType.ERROR,
          severity: EventSeverity.HIGH,
          source: 'AuditLogger',
          message: 'Failed to persist audit record to database',
          data: { error, record: completeRecord }
        });
      }
    }
    
    // Trim if exceeding max size
    if (this.auditRecords.length > this.maxRecords) {
      const overflow = this.auditRecords.length - this.maxRecords;
      const recordsToStore = this.auditRecords.splice(0, overflow);
      
      // Persist the trimmed records if handler is available
      if (this.persistenceHandler) {
        try {
          await this.persistenceHandler(recordsToStore);
        } catch (error) {
          this.eventLogger.log({
            type: EventType.ERROR,
            severity: EventSeverity.HIGH,
            source: 'AuditLogger',
            message: 'Failed to persist audit records',
            data: { error, recordCount: recordsToStore.length }
          });
        }
      }
    }
    
    // Forward to compliance handler if available
    if (this.complianceHandler) {
      try {
        await this.complianceHandler(completeRecord);
      } catch (error) {
        this.eventLogger.log({
          type: EventType.ERROR,
          severity: EventSeverity.HIGH,
          source: 'AuditLogger',
          message: 'Failed to process audit record for compliance',
          data: { error, record: completeRecord }
        });
      }
    }
    
    // Log to event logger
    this.eventLogger.log({
      type: EventType.AUDIT,
      severity: EventSeverity.INFO,
      source: 'AuditLogger',
      message: `Audit: ${record.action} ${record.entityType} ${record.entityId}`,
      data: completeRecord
    });
    
    return completeRecord;
  }
  
  /**
   * Calculate the changes between two states for update operations
   * 
   * @param previousState Previous state of the entity
   * @param newState New state of the entity
   * @returns Record of changes with previous and new values
   */
  calculateChanges(previousState: any, newState: any): Record<string, { previous: any; new: any }> {
    const changes: Record<string, { previous: any; new: any }> = {};
    
    // Get all keys from both objects
    const allKeys = [...new Set([
      ...Object.keys(previousState || {}),
      ...Object.keys(newState || {})
    ])];
    
    // Check for changes in each key
    for (const key of allKeys) {
      const prevValue = previousState?.[key];
      const newValue = newState?.[key];
      
      // Skip if the values are equal
      if (JSON.stringify(prevValue) === JSON.stringify(newValue)) {
        continue;
      }
      
      // Record the change
      changes[key] = {
        previous: prevValue,
        new: newValue
      };
    }
    
    return changes;
  }
  
  /**
   * Search for audit records matching criteria
   * 
   * @param criteria Search criteria
   * @returns Matching audit records
   */
  search(criteria: AuditSearchCriteria = {}): AuditRecord[] {
    let results = [...this.auditRecords];
    
    // Apply filters
    if (criteria.startTime) {
      results = results.filter(r => r.timestamp >= criteria.startTime!);
    }
    
    if (criteria.endTime) {
      results = results.filter(r => r.timestamp <= criteria.endTime!);
    }
    
    if (criteria.actor) {
      results = results.filter(r => r.actor === criteria.actor);
    }
    
    if (criteria.action) {
      const actions = Array.isArray(criteria.action) ? criteria.action : [criteria.action];
      results = results.filter(r => actions.includes(r.action));
    }
    
    if (criteria.entityType) {
      const types = Array.isArray(criteria.entityType) ? criteria.entityType : [criteria.entityType];
      results = results.filter(r => types.includes(r.entityType));
    }
    
    if (criteria.entityId) {
      results = results.filter(r => r.entityId === criteria.entityId);
    }
    
    if (criteria.success !== undefined) {
      results = results.filter(r => r.success === criteria.success);
    }
    
    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    if (criteria.offset !== undefined || criteria.limit !== undefined) {
      const offset = criteria.offset || 0;
      const limit = criteria.limit || results.length;
      results = results.slice(offset, offset + limit);
    }
    
    return results;
  }
  
  /**
   * Get the history of an entity
   * 
   * @param entityType Entity type
   * @param entityId Entity ID
   * @returns History of the entity
   */
  getEntityHistory(entityType: AuditEntityType, entityId: string): AuditRecord[] {
    return this.search({
      entityType,
      entityId
    });
  }
  
  /**
   * Persist records to long-term storage
   * 
   * @param records Records to persist (defaults to all in-memory records)
   */
  async persistRecords(records?: AuditRecord[]): Promise<void> {
    // No records to persist
    const recordsToPersist = records || [...this.auditRecords];
    
    if (recordsToPersist.length === 0) {
      return;
    }
    
    try {
      // Use custom persistence handler if provided
      if (this.persistenceHandler) {
        await this.persistenceHandler(recordsToPersist);
      }
      
      // Additionally use database persistence if enabled
      if (this.dbPersistenceEnabled) {
        try {
          // This is a dynamic import to avoid circular dependencies
          // The service will be loaded only when needed
          const { auditService } = await import('../../server/services/audit-service');
          
          // Convert internal AuditRecord to database InsertAuditRecord
          const dbRecords = recordsToPersist.map(record => ({
            id: record.id,
            timestamp: record.timestamp,
            actor: record.actor,
            action: record.action,
            entityType: record.entityType,
            entityId: record.entityId,
            previousState: record.previousState,
            newState: record.newState,
            changes: record.changes,
            ipAddress: record.ipAddress,
            requestId: record.requestId,
            context: record.context,
            success: record.success,
            error: record.error,
            retentionPeriod: 2555, // Default 7 years retention
            isArchived: false
          }));
          
          await auditService.createAuditRecords(dbRecords);
          
          this.eventLogger.log({
            type: EventType.INFO, 
            severity: EventSeverity.LOW,
            source: 'AuditLogger',
            message: 'Persisted audit records to database',
            data: { count: recordsToPersist.length }
          });
        } catch (dbError) {
          this.eventLogger.log({
            type: EventType.ERROR,
            severity: EventSeverity.HIGH,
            source: 'AuditLogger',
            message: 'Failed to persist audit records to database',
            data: { error: dbError, count: recordsToPersist.length }
          });
          
          // Don't throw here to allow the in-memory cleanup to continue
          // Even if DB persistence fails, we should remove processed records
        }
      }
      
      // If persisting all records, clear the in-memory storage
      if (!records) {
        this.auditRecords = [];
      }
      // If persisting specific records, remove them from in-memory storage
      else {
        const recordIds = new Set(recordsToPersist.map(r => r.id));
        this.auditRecords = this.auditRecords.filter(r => !recordIds.has(r.id));
      }
      
      this.eventLogger.log({
        type: EventType.INFO,
        severity: EventSeverity.LOW,
        source: 'AuditLogger',
        message: 'Persisted audit records',
        data: { count: recordsToPersist.length }
      });
    } catch (error) {
      this.eventLogger.log({
        type: EventType.ERROR,
        severity: EventSeverity.HIGH,
        source: 'AuditLogger',
        message: 'Failed to persist audit records',
        data: { error, count: recordsToPersist.length }
      });
      
      throw error;
    }
  }
  
  /**
   * Clear all audit records (use with caution)
   */
  clear(): void {
    this.auditRecords = [];
  }
}

/**
 * Singleton instance of the AuditLogger
 */
export const auditLogger = new AuditLogger();

/**
 * Create a property change audit record
 * 
 * @param actor User or system making the change
 * @param action Type of action
 * @param propertyId Property ID
 * @param previousState Previous property state
 * @param newState New property state
 * @param context Additional context data
 * @param success Whether the operation succeeded
 * @param error Error message if failed
 * @returns Promise that resolves with the created audit record
 */
export async function auditPropertyChange(
  actor: string,
  action: AuditAction,
  propertyId: string,
  previousState?: any,
  newState?: any,
  context?: Record<string, any>,
  success: boolean = true,
  error?: string
): Promise<AuditRecord> {
  const changes = previousState && newState
    ? auditLogger.calculateChanges(previousState, newState)
    : undefined;
    
  return auditLogger.log({
    actor,
    action,
    entityType: AuditEntityType.PROPERTY,
    entityId: propertyId,
    previousState,
    newState,
    changes,
    context,
    success,
    error
  });
}

/**
 * Create an assessment action audit record
 * 
 * @param actor User or system performing the action
 * @param action Type of action
 * @param assessmentId Assessment ID
 * @param propertyId Related property ID
 * @param details Assessment details
 * @param context Additional context data
 * @param success Whether the operation succeeded
 * @param error Error message if failed
 * @returns Promise that resolves with the created audit record
 */
export async function auditAssessmentAction(
  actor: string,
  action: AuditAction,
  assessmentId: string,
  propertyId: string,
  details?: any,
  context?: Record<string, any>,
  success: boolean = true,
  error?: string
): Promise<AuditRecord> {
  return auditLogger.log({
    actor,
    action,
    entityType: AuditEntityType.ASSESSMENT,
    entityId: assessmentId,
    newState: details,
    context: {
      ...context,
      propertyId
    },
    success,
    error
  });
}

/**
 * Create a user action audit record
 * 
 * @param userId User ID
 * @param action Type of action
 * @param details Action details
 * @param ipAddress User's IP address
 * @param requestId API request ID if applicable
 * @param success Whether the operation succeeded
 * @param error Error message if failed
 * @returns Promise that resolves with the created audit record
 */
export async function auditUserAction(
  userId: string,
  action: AuditAction,
  details?: any,
  ipAddress?: string,
  requestId?: string,
  success: boolean = true,
  error?: string
): Promise<AuditRecord> {
  return auditLogger.log({
    actor: userId,
    action,
    entityType: AuditEntityType.USER,
    entityId: userId,
    newState: details,
    ipAddress,
    requestId,
    success,
    error
  });
}

/**
 * Create a system action audit record
 * 
 * @param componentName System component name
 * @param action Type of action
 * @param details Action details
 * @param context Additional context data
 * @param success Whether the operation succeeded
 * @param error Error message if failed
 * @returns Promise that resolves with the created audit record
 */
export async function auditSystemAction(
  componentName: string,
  action: AuditAction,
  details?: any,
  context?: Record<string, any>,
  success: boolean = true,
  error?: string
): Promise<AuditRecord> {
  return auditLogger.log({
    actor: componentName,
    action,
    entityType: AuditEntityType.SYSTEM,
    entityId: componentName,
    newState: details,
    context,
    success,
    error
  });
}

/**
 * Create an agent action audit record
 * 
 * @param agentId Agent ID
 * @param action Type of action
 * @param details Action details
 * @param context Additional context data
 * @param success Whether the operation succeeded
 * @param error Error message if failed
 * @returns Promise that resolves with the created audit record
 */
export async function auditAgentAction(
  agentId: string,
  action: AuditAction,
  details?: any,
  context?: Record<string, any>,
  success: boolean = true,
  error?: string
): Promise<AuditRecord> {
  return auditLogger.log({
    actor: agentId,
    action,
    entityType: AuditEntityType.AGENT,
    entityId: agentId,
    newState: details,
    context,
    success,
    error
  });
}