/**
 * Audit Routes
 * 
 * API endpoints for accessing audit records
 */

const express = require('express');
const { getAuditService } = require('../services/audit-service');

const router = express.Router();

/**
 * GET /api/audit
 * Get all audit records, optionally filtered
 */
router.get('/', async (req, res) => {
  try {
    const { 
      actor, 
      action, 
      entity_type, 
      entity_id, 
      success,
      start_date,
      end_date,
      limit = 100, 
      offset = 0 
    } = req.query;
    
    const auditService = getAuditService();
    
    // Build filter object
    const filter = {};
    if (actor) filter.actor = actor;
    if (action) filter.action = action;
    if (entity_type) filter.entity_type = entity_type;
    if (entity_id) filter.entity_id = entity_id;
    if (success !== undefined) filter.success = success === 'true';
    
    // Date range filtering
    const dateFilter = {};
    if (start_date) dateFilter.start = new Date(start_date);
    if (end_date) dateFilter.end = new Date(end_date);
    
    const records = await auditService.getAuditRecords({
      filter,
      dateRange: Object.keys(dateFilter).length ? dateFilter : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching audit records:', error);
    res.status(500).json({ error: 'Failed to fetch audit records' });
  }
});

/**
 * GET /api/audit/:id
 * Get a specific audit record by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const auditService = getAuditService();
    
    const record = await auditService.getAuditRecordById(id);
    
    if (!record) {
      return res.status(404).json({ error: 'Audit record not found' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Error fetching audit record:', error);
    res.status(500).json({ error: 'Failed to fetch audit record' });
  }
});

/**
 * GET /api/audit/entity/:entityType/:entityId
 * Get all audit records for a specific entity
 */
router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const auditService = getAuditService();
    
    const records = await auditService.getAuditRecordsByEntity(
      entityType, 
      entityId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching entity audit records:', error);
    res.status(500).json({ error: 'Failed to fetch entity audit records' });
  }
});

/**
 * GET /api/audit/actor/:actor
 * Get all audit records for a specific actor
 */
router.get('/actor/:actor', async (req, res) => {
  try {
    const { actor } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const auditService = getAuditService();
    
    const records = await auditService.getAuditRecordsByActor(
      actor, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching actor audit records:', error);
    res.status(500).json({ error: 'Failed to fetch actor audit records' });
  }
});

/**
 * POST /api/audit
 * Create a new audit record
 */
router.post('/', async (req, res) => {
  try {
    const { 
      actor, 
      action, 
      entity_type, 
      entity_id, 
      new_state, 
      context, 
      success, 
      error 
    } = req.body;
    
    // Validate required fields
    if (!actor || !action || !entity_type || !entity_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: actor, action, entity_type, and entity_id are required' 
      });
    }
    
    const auditService = getAuditService();
    
    const newRecord = await auditService.createAuditRecord({
      actor,
      action,
      entity_type,
      entity_id,
      new_state,
      context,
      success: success !== undefined ? success : true,
      error
    });
    
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error creating audit record:', error);
    res.status(500).json({ error: 'Failed to create audit record' });
  }
});

module.exports = router;