/**
 * Database Status Routes
 * 
 * API endpoints for retrieving database status information
 * for both local PostgreSQL and Supabase connections.
 */

const express = require('express');
const databaseProvider = require('../services/database-provider');
const { generateTableCreationSQL } = require('../utils/sql-generator');

const router = express.Router();

/**
 * GET /api/database/status
 * 
 * Returns the status of both local PostgreSQL and Supabase database connections
 * including table existence information and SQL scripts for missing tables.
 */
router.get('/status', async (req, res) => {
  try {
    // Check local PostgreSQL status
    const localStatus = {
      isConnected: false,
      tables: {
        property_history_records: false,
        audit_records: false
      },
      error: null
    };
    
    try {
      // Check local connection
      const localDb = await databaseProvider.getLocalDatabase();
      localStatus.isConnected = true;
      
      // Check table existence
      const localTablesResult = await localDb.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
      );
      const localTables = localTablesResult.rows.map(row => row.tablename);
      
      localStatus.tables.property_history_records = localTables.includes('property_history_records');
      localStatus.tables.audit_records = localTables.includes('audit_records');
    } catch (error) {
      localStatus.error = error.message;
      console.error('Error checking local database status:', error);
    }
    
    // Check Supabase status
    const supabaseStatus = {
      isConnected: false,
      tables: {
        property_history_records: false,
        audit_records: false
      },
      error: null,
      sqlScript: null
    };
    
    try {
      // Check Supabase connection
      const supabaseDb = await databaseProvider.getSupabaseDatabase();
      
      if (supabaseDb) {
        // Check if we can query the Supabase database
        try {
          // Test the connection by querying the property_history_records table
          await supabaseDb.query(`SELECT COUNT(*) FROM property_history_records LIMIT 1`);
          supabaseStatus.isConnected = true;
          supabaseStatus.tables.property_history_records = true;
          
          // Check audit_records table
          try {
            await supabaseDb.query(`SELECT COUNT(*) FROM audit_records LIMIT 1`);
            supabaseStatus.tables.audit_records = true;
          } catch (error) {
            // Table doesn't exist
            supabaseStatus.tables.audit_records = false;
            // Add SQL script for creating audit_records table
            supabaseStatus.sqlScript = generateTableCreationSQL('audit_records');
          }
        } catch (error) {
          // Table doesn't exist
          supabaseStatus.tables.property_history_records = false;
          // Add SQL script for creating property_history_records table
          supabaseStatus.sqlScript = generateTableCreationSQL('property_history_records');
          
          if (error.code === '42P01') {
            supabaseStatus.error = `Table 'property_history_records' does not exist in Supabase. Please create it using the SQL script.`;
          } else {
            supabaseStatus.error = error.message;
          }
        }
      } else {
        supabaseStatus.error = 'Supabase configuration missing or invalid';
      }
    } catch (error) {
      supabaseStatus.error = error.message;
      console.error('Error checking Supabase status:', error);
    }
    
    res.json({
      local: localStatus,
      supabase: supabaseStatus
    });
  } catch (error) {
    console.error('Error in database status endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve database status' });
  }
});

module.exports = router;