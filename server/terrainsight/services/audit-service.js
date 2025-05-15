/**
 * Audit Service
 * 
 * Service for managing audit records,
 * with support for both local PostgreSQL and Supabase.
 */

const { v4: uuidv4 } = require('uuid');
const databaseProvider = require('./database-provider');

// Service instance cache
let serviceInstance = null;

/**
 * Create audit service
 * @returns {Object} Audit service instance
 */
function createAuditService() {
  return {
    /**
     * Get all audit records, optionally filtered
     * 
     * @param {Object} options - Query options
     * @param {Object} options.filter - Filter criteria (actor, action, entity_type, entity_id, success)
     * @param {Object} options.dateRange - Date range filter (start, end)
     * @param {number} options.limit - Maximum number of records to return
     * @param {number} options.offset - Number of records to skip
     * @returns {Array} Audit records
     */
    async getAuditRecords(options = {}) {
      const { filter = {}, dateRange, limit = 100, offset = 0 } = options;
      const db = await databaseProvider.getDatabaseClient();
      
      let query = 'SELECT * FROM audit_records';
      const conditions = [];
      const params = [];
      
      // Add filters
      if (filter.actor) {
        conditions.push(`actor = $${params.length + 1}`);
        params.push(filter.actor);
      }
      
      if (filter.action) {
        conditions.push(`action = $${params.length + 1}`);
        params.push(filter.action);
      }
      
      if (filter.entity_type) {
        conditions.push(`entity_type = $${params.length + 1}`);
        params.push(filter.entity_type);
      }
      
      if (filter.entity_id) {
        conditions.push(`entity_id = $${params.length + 1}`);
        params.push(filter.entity_id);
      }
      
      if (filter.success !== undefined) {
        conditions.push(`success = $${params.length + 1}`);
        params.push(filter.success);
      }
      
      // Add date range filter
      if (dateRange) {
        if (dateRange.start) {
          conditions.push(`timestamp >= $${params.length + 1}`);
          params.push(dateRange.start);
        }
        
        if (dateRange.end) {
          conditions.push(`timestamp <= $${params.length + 1}`);
          params.push(dateRange.end);
        }
      }
      
      // Add WHERE clause if we have conditions
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      // Add ORDER BY, LIMIT, and OFFSET
      query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      // Execute query
      const result = await db.query(query, params);
      return result.rows;
    },
    
    /**
     * Get an audit record by ID
     * 
     * @param {string} id - Record ID
     * @returns {Object|null} Audit record or null if not found
     */
    async getAuditRecordById(id) {
      const db = await databaseProvider.getDatabaseClient();
      
      const result = await db.query(
        'SELECT * FROM audit_records WHERE id = $1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    },
    
    /**
     * Get all audit records for a specific entity
     * 
     * @param {string} entityType - Entity type
     * @param {string} entityId - Entity ID
     * @param {number} limit - Maximum number of records to return
     * @param {number} offset - Number of records to skip
     * @returns {Array} Audit records
     */
    async getAuditRecordsByEntity(entityType, entityId, limit = 100, offset = 0) {
      const db = await databaseProvider.getDatabaseClient();
      
      const result = await db.query(
        `SELECT * FROM audit_records 
        WHERE entity_type = $1 AND entity_id = $2 
        ORDER BY timestamp DESC 
        LIMIT $3 OFFSET $4`,
        [entityType, entityId, limit, offset]
      );
      
      return result.rows;
    },
    
    /**
     * Get all audit records for a specific actor
     * 
     * @param {string} actor - Actor identifier
     * @param {number} limit - Maximum number of records to return
     * @param {number} offset - Number of records to skip
     * @returns {Array} Audit records
     */
    async getAuditRecordsByActor(actor, limit = 100, offset = 0) {
      const db = await databaseProvider.getDatabaseClient();
      
      const result = await db.query(
        `SELECT * FROM audit_records 
        WHERE actor = $1 
        ORDER BY timestamp DESC 
        LIMIT $2 OFFSET $3`,
        [actor, limit, offset]
      );
      
      return result.rows;
    },
    
    /**
     * Create a new audit record
     * 
     * @param {Object} record - Audit record data
     * @returns {Object} Created audit record
     */
    async createAuditRecord(record) {
      const db = await databaseProvider.getDatabaseClient();
      
      // Generate UUID for the record
      const id = record.id || uuidv4();
      
      // Set default values
      const completeRecord = {
        id,
        actor: record.actor,
        action: record.action,
        entity_type: record.entity_type,
        entity_id: record.entity_id,
        timestamp: record.timestamp || new Date(),
        success: record.success !== undefined ? record.success : true,
        new_state: record.new_state ? JSON.stringify(record.new_state) : null,
        context: record.context ? JSON.stringify(record.context) : null,
        error: record.error || null
      };
      
      // Execute query
      const result = await db.query(
        `INSERT INTO audit_records 
        (id, actor, action, entity_type, entity_id, timestamp, success, new_state, context, error)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          completeRecord.id,
          completeRecord.actor,
          completeRecord.action,
          completeRecord.entity_type,
          completeRecord.entity_id,
          completeRecord.timestamp,
          completeRecord.success,
          completeRecord.new_state,
          completeRecord.context,
          completeRecord.error
        ]
      );
      
      return result.rows[0];
    },
    
    /**
     * Create multiple audit records in a batch
     * 
     * @param {Array} records - Array of audit record data
     * @returns {Object} Result with count of created records
     */
    async createAuditRecords(records) {
      if (!records || !records.length) {
        return { count: 0 };
      }
      
      try {
        const db = await databaseProvider.getDatabaseClient();
        
        // Generate placeholders and values for the batch insert
        const valuesPlaceholders = [];
        const params = [];
        let paramIndex = 1;
        
        for (const record of records) {
          // Generate UUID for the record
          const id = record.id || uuidv4();
          
          // Set default values
          const completeRecord = {
            id,
            actor: record.actor,
            action: record.action,
            entity_type: record.entity_type,
            entity_id: record.entity_id,
            timestamp: record.timestamp || new Date(),
            success: record.success !== undefined ? record.success : true,
            new_state: record.new_state ? JSON.stringify(record.new_state) : null,
            context: record.context ? JSON.stringify(record.context) : null,
            error: record.error || null
          };
          
          // Create placeholders and add parameters
          const placeholder = `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`;
          valuesPlaceholders.push(placeholder);
          
          params.push(
            completeRecord.id,
            completeRecord.actor,
            completeRecord.action,
            completeRecord.entity_type,
            completeRecord.entity_id,
            completeRecord.timestamp,
            completeRecord.success,
            completeRecord.new_state,
            completeRecord.context,
            completeRecord.error
          );
        }
        
        // Execute batch insert
        const query = `
          INSERT INTO audit_records 
          (id, actor, action, entity_type, entity_id, timestamp, success, new_state, context, error)
          VALUES ${valuesPlaceholders.join(', ')}
          ON CONFLICT (id) DO NOTHING
        `;
        
        await db.query(query, params);
        
        return { count: records.length };
      } catch (error) {
        console.error('Failed to create audit records:', error);
        throw new Error(`Failed to create audit records: ${error.message}`);
      }
    }
  };
}

/**
 * Get the audit service instance
 * @returns {Object} Audit service instance
 */
function getAuditService() {
  if (!serviceInstance) {
    serviceInstance = createAuditService();
  }
  return serviceInstance;
}

module.exports = {
  getAuditService
};