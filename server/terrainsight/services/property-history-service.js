/**
 * Property History Service
 * 
 * Service for managing property history records,
 * with support for both local PostgreSQL and Supabase.
 */

const { v4: uuidv4 } = require('uuid');
const databaseProvider = require('./database-provider');
const { getAuditService } = require('./audit-service');

// Service instance cache
let serviceInstance = null;

/**
 * Create property history service
 * @returns {Object} Property history service instance
 */
function createPropertyHistoryService() {
  return {
    /**
     * Get all property history records, optionally filtered
     * 
     * @param {Object} options - Query options
     * @param {string} options.property_id - Filter by property ID
     * @param {string} options.year - Filter by year
     * @param {number} options.limit - Maximum number of records to return
     * @param {number} options.offset - Number of records to skip
     * @returns {Array} Property history records
     */
    async getPropertyHistoryRecords(options = {}) {
      const { property_id, year, limit = 100, offset = 0 } = options;
      const db = await databaseProvider.getDatabaseClient();
      
      let query = 'SELECT * FROM property_history_records';
      const conditions = [];
      const params = [];
      
      // Add filters
      if (property_id) {
        conditions.push(`property_id = $${params.length + 1}`);
        params.push(property_id);
      }
      
      if (year) {
        conditions.push(`year = $${params.length + 1}`);
        params.push(year);
      }
      
      // Add WHERE clause if we have conditions
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      // Add ORDER BY, LIMIT, and OFFSET
      query += ` ORDER BY year DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      // Execute query
      const result = await db.query(query, params);
      return result.rows;
    },
    
    /**
     * Get a property history record by ID
     * 
     * @param {string} id - Record ID
     * @returns {Object|null} Property history record or null if not found
     */
    async getPropertyHistoryRecordById(id) {
      const db = await databaseProvider.getDatabaseClient();
      
      const result = await db.query(
        'SELECT * FROM property_history_records WHERE id = $1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    },
    
    /**
     * Get all property history records for a specific property
     * 
     * @param {string} propertyId - Property ID
     * @returns {Array} Property history records
     */
    async getPropertyHistoryByPropertyId(propertyId) {
      const db = await databaseProvider.getDatabaseClient();
      
      const result = await db.query(
        'SELECT * FROM property_history_records WHERE property_id = $1 ORDER BY year DESC',
        [propertyId]
      );
      
      return result.rows;
    },
    
    /**
     * Create a new property history record
     * 
     * @param {Object} record - Property history record data
     * @returns {Object} Created property history record
     */
    async createPropertyHistoryRecord(record) {
      const db = await databaseProvider.getDatabaseClient();
      const auditService = getAuditService();
      
      // Set default values
      const now = new Date();
      const completeRecord = {
        property_id: record.property_id,
        year: record.year,
        value: record.value,
        source: record.source || null,
        notes: record.notes || null,
        confidence: record.confidence || 100,
        timestamp: now,
        updated_by: record.updated_by || 'system',
        updated_at: now
      };
      
      // Execute query
      const result = await db.query(
        `INSERT INTO property_history_records 
        (property_id, year, value, source, notes, confidence, timestamp, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          completeRecord.property_id,
          completeRecord.year,
          completeRecord.value,
          completeRecord.source,
          completeRecord.notes,
          completeRecord.confidence,
          completeRecord.timestamp,
          completeRecord.updated_by,
          completeRecord.updated_at
        ]
      );
      
      const createdRecord = result.rows[0];
      
      // Create audit record
      await auditService.createAuditRecord({
        actor: completeRecord.updated_by,
        action: 'CREATE',
        entity_type: 'PROPERTY_HISTORY',
        entity_id: `${completeRecord.property_id}/${completeRecord.year}`,
        new_state: createdRecord,
        success: true
      });
      
      return createdRecord;
    },
    
    /**
     * Update a property history record
     * 
     * @param {string} id - Record ID
     * @param {Object} updates - Property history record updates
     * @returns {Object} Updated property history record
     */
    async updatePropertyHistoryRecord(id, updates) {
      const db = await databaseProvider.getDatabaseClient();
      const auditService = getAuditService();
      
      // Get the current record for auditing
      const currentRecord = await this.getPropertyHistoryRecordById(id);
      
      // Build SET clause and parameters
      const setClauses = [];
      const params = [];
      
      // Add each update field
      if (updates.value !== undefined) {
        setClauses.push(`value = $${params.length + 1}`);
        params.push(updates.value);
      }
      
      if (updates.source !== undefined) {
        setClauses.push(`source = $${params.length + 1}`);
        params.push(updates.source);
      }
      
      if (updates.notes !== undefined) {
        setClauses.push(`notes = $${params.length + 1}`);
        params.push(updates.notes);
      }
      
      if (updates.confidence !== undefined) {
        setClauses.push(`confidence = $${params.length + 1}`);
        params.push(updates.confidence);
      }
      
      if (updates.updated_by) {
        setClauses.push(`updated_by = $${params.length + 1}`);
        params.push(updates.updated_by);
      }
      
      setClauses.push(`updated_at = $${params.length + 1}`);
      params.push(updates.updated_at || new Date());
      
      // Add ID parameter
      params.push(id);
      
      // Execute query
      const result = await db.query(
        `UPDATE property_history_records
        SET ${setClauses.join(', ')}
        WHERE id = $${params.length}
        RETURNING *`,
        params
      );
      
      const updatedRecord = result.rows[0];
      
      // Create audit record
      await auditService.createAuditRecord({
        actor: updates.updated_by || 'system',
        action: 'UPDATE',
        entity_type: 'PROPERTY_HISTORY',
        entity_id: `${updatedRecord.property_id}/${updatedRecord.year}`,
        new_state: updatedRecord,
        context: { previous: currentRecord },
        success: true
      });
      
      return updatedRecord;
    },
    
    /**
     * Delete a property history record
     * 
     * @param {string} id - Record ID
     * @returns {boolean} Success flag
     */
    async deletePropertyHistoryRecord(id) {
      const db = await databaseProvider.getDatabaseClient();
      const auditService = getAuditService();
      
      // Get the current record for auditing
      const currentRecord = await this.getPropertyHistoryRecordById(id);
      
      // Execute query
      await db.query(
        'DELETE FROM property_history_records WHERE id = $1',
        [id]
      );
      
      // Create audit record
      await auditService.createAuditRecord({
        actor: 'system', // Could be replaced with actual user ID if available
        action: 'DELETE',
        entity_type: 'PROPERTY_HISTORY',
        entity_id: `${currentRecord.property_id}/${currentRecord.year}`,
        context: { deleted: currentRecord },
        success: true
      });
      
      return true;
    }
  };
}

/**
 * Get the property history service instance
 * @returns {Object} Property history service instance
 */
function getPropertyHistoryService() {
  if (!serviceInstance) {
    serviceInstance = createPropertyHistoryService();
  }
  return serviceInstance;
}

module.exports = {
  getPropertyHistoryService
};