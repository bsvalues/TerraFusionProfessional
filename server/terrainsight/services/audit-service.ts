/**
 * Audit Service
 * 
 * Provides database persistence for audit records and querying capabilities
 * for regulatory compliance reporting.
 */

import { InferInsertModel, eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { db } from '../db';
import { auditRecords, AuditRecord, InsertAuditRecord } from '../../shared/schema';
import { AuditAction, AuditEntityType } from '../../shared/agent/AuditLogger';

/**
 * Audit record search parameters with pagination support
 */
export interface AuditSearchParams {
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
  
  /** Search term for full-text search */
  searchTerm?: string;
  
  /** Page number for pagination (1-based) */
  page?: number;
  
  /** Number of records per page */
  pageSize?: number;
  
  /** Sort field */
  sortField?: keyof AuditRecord;
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Paginated result set
 */
export interface PaginatedResult<T> {
  /** Result items */
  items: T[];
  
  /** Total count of items matching the query */
  totalCount: number;
  
  /** Current page number */
  page: number;
  
  /** Number of items per page */
  pageSize: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Whether there is a next page */
  hasNextPage: boolean;
  
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Audit service for persisting and querying audit records
 */
export class AuditService {
  /**
   * Create a new audit record
   * 
   * @param record The audit record to create
   * @returns The created audit record
   */
  async createAuditRecord(record: InsertAuditRecord): Promise<AuditRecord> {
    try {
      const [createdRecord] = await db.insert(auditRecords).values(record).returning();
      return createdRecord;
    } catch (error) {
      console.error('Failed to create audit record:', error);
      throw new Error(`Failed to create audit record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create multiple audit records in a batch
   * 
   * @param records Array of audit records to create
   * @returns The created audit records
   */
  async createAuditRecords(records: InsertAuditRecord[]): Promise<AuditRecord[]> {
    if (records.length === 0) {
      return [];
    }
    
    try {
      // Use raw SQL to handle conflict resolution on the primary key
      const ids = records.map(r => `'${r.id}'`).join(', ');
      const existingRecords = await db
        .select({ id: auditRecords.id })
        .from(auditRecords)
        .where(sql`${auditRecords.id} IN (${sql.raw(ids)})`);
      
      const existingIds = new Set(existingRecords.map(r => r.id));
      const newRecords = records.filter(r => !existingIds.has(r.id));
      
      if (newRecords.length === 0) {
        console.log('All audit records already exist, skipping insertion');
        return [];
      }
      
      const createdRecords = await db.insert(auditRecords).values(newRecords).returning();
      return createdRecords;
    } catch (error) {
      console.error('Failed to create audit records:', error);
      throw new Error(`Failed to create audit records: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get an audit record by ID
   * 
   * @param id The audit record ID
   * @returns The audit record or null if not found
   */
  async getAuditRecord(id: string): Promise<AuditRecord | null> {
    try {
      const record = await db.select().from(auditRecords).where(eq(auditRecords.id, id)).limit(1);
      return record.length > 0 ? record[0] : null;
    } catch (error) {
      console.error(`Failed to get audit record ${id}:`, error);
      throw new Error(`Failed to get audit record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for audit records with pagination
   * 
   * @param params Search parameters
   * @returns Paginated result of audit records
   */
  async searchAuditRecords(params: AuditSearchParams = {}): Promise<PaginatedResult<AuditRecord>> {
    try {
      // Default pagination values
      const page = params.page || 1;
      const pageSize = params.pageSize || 50;
      const offset = (page - 1) * pageSize;
      
      // Build the where conditions
      const whereConditions = [];
      
      if (params.startTime) {
        whereConditions.push(gte(auditRecords.timestamp, params.startTime));
      }
      
      if (params.endTime) {
        whereConditions.push(lte(auditRecords.timestamp, params.endTime));
      }
      
      if (params.actor) {
        whereConditions.push(eq(auditRecords.actor, params.actor));
      }
      
      if (params.action) {
        if (Array.isArray(params.action)) {
          whereConditions.push(sql`${auditRecords.action} IN (${params.action.join(',')})`);
        } else {
          whereConditions.push(eq(auditRecords.action, params.action));
        }
      }
      
      if (params.entityType) {
        if (Array.isArray(params.entityType)) {
          whereConditions.push(sql`${auditRecords.entityType} IN (${params.entityType.join(',')})`);
        } else {
          whereConditions.push(eq(auditRecords.entityType, params.entityType));
        }
      }
      
      if (params.entityId) {
        whereConditions.push(eq(auditRecords.entityId, params.entityId));
      }
      
      if (params.success !== undefined) {
        whereConditions.push(eq(auditRecords.success, params.success));
      }
      
      // Full-text search (basic implementation)
      if (params.searchTerm) {
        const term = `%${params.searchTerm}%`;
        whereConditions.push(
          sql`(${auditRecords.actor} ILIKE ${term} OR 
               ${auditRecords.entityId} ILIKE ${term} OR 
               ${auditRecords.error} ILIKE ${term} OR
               CAST(${auditRecords.context} AS TEXT) ILIKE ${term})`
        );
      }
      
      // Combine all conditions with AND
      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;
      
      // Determine sort field and direction
      const sortField = params.sortField || 'timestamp';
      const sortDirection = params.sortDirection || 'desc';
      
      // Execute count query
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditRecords)
        .where(whereClause || sql`1=1`);
      
      const totalCount = countResult[0]?.count || 0;
      
      // Execute data query with pagination and sorting
      const items = await db
        .select()
        .from(auditRecords)
        .where(whereClause || sql`1=1`)
        .orderBy(
          sortDirection === 'desc' 
            ? desc(auditRecords[sortField as keyof typeof auditRecords]) 
            : asc(auditRecords[sortField as keyof typeof auditRecords])
        )
        .limit(pageSize)
        .offset(offset);
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / pageSize);
      
      return {
        items,
        totalCount,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };
    } catch (error) {
      console.error('Failed to search audit records:', error);
      throw new Error(`Failed to search audit records: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get entity change history
   * 
   * @param entityType Type of entity
   * @param entityId Entity ID
   * @param limit Maximum records to return
   * @returns Array of audit records for the entity
   */
  async getEntityHistory(
    entityType: AuditEntityType,
    entityId: string,
    limit: number = 100
  ): Promise<AuditRecord[]> {
    try {
      const records = await db
        .select()
        .from(auditRecords)
        .where(
          and(
            eq(auditRecords.entityType, entityType),
            eq(auditRecords.entityId, entityId)
          )
        )
        .orderBy(desc(auditRecords.timestamp))
        .limit(limit);
      
      return records;
    } catch (error) {
      console.error(`Failed to get history for ${entityType} ${entityId}:`, error);
      throw new Error(`Failed to get entity history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Archive old audit records
   * 
   * @param olderThanDays Archive records older than this many days
   * @param batchSize Maximum records to archive in one operation
   * @returns Number of records archived
   */
  async archiveOldRecords(olderThanDays: number = 90, batchSize: number = 1000): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      // Get IDs of records to archive
      const recordsToArchive = await db
        .select({ id: auditRecords.id })
        .from(auditRecords)
        .where(
          and(
            lte(auditRecords.timestamp, cutoffDate),
            eq(auditRecords.isArchived, false)
          )
        )
        .limit(batchSize);
      
      if (recordsToArchive.length === 0) {
        return 0;
      }
      
      // Update records to archived status
      const recordIds = recordsToArchive.map(r => r.id);
      
      await db
        .update(auditRecords)
        .set({ isArchived: true })
        .where(sql`${auditRecords.id} IN (${recordIds.join(',')})`);
      
      return recordIds.length;
    } catch (error) {
      console.error('Failed to archive old audit records:', error);
      throw new Error(`Failed to archive old records: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Purge archived audit records that have exceeded their retention period
   * 
   * @param batchSize Maximum records to purge in one operation
   * @returns Number of records purged
   */
  async purgeExpiredRecords(batchSize: number = 1000): Promise<number> {
    try {
      const currentDate = new Date();
      
      // Get IDs of records to purge
      const recordsToPurge = await db
        .select({ id: auditRecords.id })
        .from(auditRecords)
        .where(
          and(
            eq(auditRecords.isArchived, true),
            sql`${auditRecords.timestamp} + (${auditRecords.retentionPeriod} * interval '1 day') < ${currentDate}`
          )
        )
        .limit(batchSize);
      
      if (recordsToPurge.length === 0) {
        return 0;
      }
      
      // Delete the expired records
      const recordIds = recordsToPurge.map(r => r.id);
      
      await db
        .delete(auditRecords)
        .where(sql`${auditRecords.id} IN (${recordIds.join(',')})`);
      
      return recordIds.length;
    } catch (error) {
      console.error('Failed to purge expired audit records:', error);
      throw new Error(`Failed to purge expired records: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export singleton instance
export const auditService = new AuditService();