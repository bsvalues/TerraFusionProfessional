/**
 * Supabase Status Routes
 * 
 * This file provides endpoints to check Supabase connection status
 * and verify that the required tables exist.
 */

import express from 'express';
import SupabaseInitializer from '../../shared/agent/SupabaseInitializer';

const router = express.Router();
const supabaseInitializer = new SupabaseInitializer();

/**
 * GET /api/supabase/status
 * 
 * Check Supabase connection status and table existence
 */
router.get('/status', async (req, res) => {
  try {
    // Check if tables exist
    const status = await supabaseInitializer.checkTablesExist();
    
    // Provide SQL instructions if tables don't exist
    if (!status.auditTableExists || !status.propertyHistoryTableExists) {
      return res.status(200).json({
        connected: status.connected,
        tables: {
          audit_records: status.auditTableExists,
          property_history_records: status.propertyHistoryTableExists
        },
        error: status.error,
        missingTables: true,
        sqlInstructions: status.sqlInstructions
      });
    }
    
    // All tables exist
    return res.status(200).json({
      connected: status.connected,
      tables: {
        audit_records: status.auditTableExists,
        property_history_records: status.propertyHistoryTableExists
      },
      ready: true
    });
  } catch (error: any) {
    return res.status(500).json({
      connected: false,
      error: `Internal server error: ${error.message}`,
      tables: {
        audit_records: false,
        property_history_records: false
      }
    });
  }
});

/**
 * POST /api/supabase/create-tables
 * 
 * Attempt to create tables if they don't exist
 * This requires the SUPABASE_SERVICE_KEY environment variable
 */
router.post('/create-tables', async (req, res) => {
  try {
    // Attempt to create tables
    const result = await supabaseInitializer.createTablesIfNeeded();
    
    if (result.error && result.error.includes('No service key provided')) {
      return res.status(403).json({
        success: false,
        error: 'Service key required for table creation',
        message: 'Please set the SUPABASE_SERVICE_KEY environment variable',
        sqlInstructions: result.sqlInstructions
      });
    }
    
    if (!result.auditTableExists || !result.propertyHistoryTableExists) {
      return res.status(400).json({
        success: false,
        tables: {
          audit_records: result.auditTableExists,
          property_history_records: result.propertyHistoryTableExists
        },
        error: result.error || 'Failed to create some tables',
        sqlInstructions: result.sqlInstructions
      });
    }
    
    // All tables were created successfully
    return res.status(200).json({
      success: true,
      tables: {
        audit_records: true,
        property_history_records: true
      },
      message: 'All required tables have been created successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`
    });
  }
});

export default router;