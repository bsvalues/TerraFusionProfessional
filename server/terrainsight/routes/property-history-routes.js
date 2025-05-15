/**
 * Property History Routes
 * 
 * API endpoints for managing property history records
 */

const express = require('express');
const { getPropertyHistoryService } = require('../services/property-history-service');

const router = express.Router();

/**
 * GET /api/property-history
 * Get all property history records, optionally filtered
 */
router.get('/', async (req, res) => {
  try {
    const { property_id, year, limit = 100, offset = 0 } = req.query;
    const propertyHistoryService = getPropertyHistoryService();
    
    const records = await propertyHistoryService.getPropertyHistoryRecords({
      property_id,
      year,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching property history records:', error);
    res.status(500).json({ error: 'Failed to fetch property history records' });
  }
});

/**
 * GET /api/property-history/:id
 * Get a specific property history record by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const propertyHistoryService = getPropertyHistoryService();
    
    const record = await propertyHistoryService.getPropertyHistoryRecordById(id);
    
    if (!record) {
      return res.status(404).json({ error: 'Property history record not found' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Error fetching property history record:', error);
    res.status(500).json({ error: 'Failed to fetch property history record' });
  }
});

/**
 * GET /api/property-history/property/:propertyId
 * Get all history records for a specific property
 */
router.get('/property/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const propertyHistoryService = getPropertyHistoryService();
    
    const records = await propertyHistoryService.getPropertyHistoryByPropertyId(propertyId);
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching property history:', error);
    res.status(500).json({ error: 'Failed to fetch property history' });
  }
});

/**
 * POST /api/property-history
 * Create a new property history record
 */
router.post('/', async (req, res) => {
  try {
    const { property_id, year, value, source, notes, confidence } = req.body;
    
    // Validate required fields
    if (!property_id || !year || value === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: property_id, year, and value are required' 
      });
    }
    
    const propertyHistoryService = getPropertyHistoryService();
    
    const newRecord = await propertyHistoryService.createPropertyHistoryRecord({
      property_id,
      year,
      value,
      source,
      notes,
      confidence,
      updated_by: req.body.updated_by || 'system'
    });
    
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error creating property history record:', error);
    
    // Handle duplicate key violation
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'A record for this property and year already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create property history record' });
  }
});

/**
 * PUT /api/property-history/:id
 * Update a property history record
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { value, source, notes, confidence, updated_by } = req.body;
    
    const propertyHistoryService = getPropertyHistoryService();
    
    // Check if record exists
    const existingRecord = await propertyHistoryService.getPropertyHistoryRecordById(id);
    if (!existingRecord) {
      return res.status(404).json({ error: 'Property history record not found' });
    }
    
    // Update the record
    const updatedRecord = await propertyHistoryService.updatePropertyHistoryRecord(id, {
      value,
      source,
      notes,
      confidence,
      updated_by: updated_by || 'system',
      updated_at: new Date()
    });
    
    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating property history record:', error);
    res.status(500).json({ error: 'Failed to update property history record' });
  }
});

/**
 * DELETE /api/property-history/:id
 * Delete a property history record
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const propertyHistoryService = getPropertyHistoryService();
    
    // Check if record exists
    const existingRecord = await propertyHistoryService.getPropertyHistoryRecordById(id);
    if (!existingRecord) {
      return res.status(404).json({ error: 'Property history record not found' });
    }
    
    // Delete the record
    await propertyHistoryService.deletePropertyHistoryRecord(id);
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting property history record:', error);
    res.status(500).json({ error: 'Failed to delete property history record' });
  }
});

module.exports = router;