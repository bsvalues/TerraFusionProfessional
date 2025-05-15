/**
 * Supabase Client Service
 * 
 * Configures and exports the Supabase client for use throughout the application.
 * Acts as a centralized point for all Supabase interactions.
 */

import { createClient } from '@supabase/supabase-js';
import { auditSystemAction, AuditAction } from '../../shared/agent/AuditLogger';

// Retrieve Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Verify credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials. Make sure SUPABASE_URL and SUPABASE_KEY are set in the environment.');
  // Continue execution but log the error - this allows the app to run even if Supabase is not configured
}

// Initialize Supabase client with explicit typings
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    })
  : null;

/**
 * Verifies if Supabase client is properly initialized
 */
export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

/**
 * Checks if the Supabase connection is working by
 * performing a simple query
 * @returns A detailed connection test result with success flag and optional error details
 */
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  error?: { 
    message: string;
    code?: string;
  } | null;
  data?: any;
}> => {
  if (!supabase) {
    return {
      success: false,
      error: {
        message: 'Supabase client not configured'
      }
    };
  }
  
  try {
    // Try a more basic query first to check if connection is working at all
    // This avoids failing if our specific tables don't exist yet
    let data, error;
    
    try {
      // Try to check if Supabase connection works using a simple query
      // that doesn't depend on our application tables existing
      const result = await supabase
        .from('pg_tables')  // This view should exist in any PostgreSQL database
        .select('*')
        .limit(1);
        
      // If we can't query pg_tables due to permissions, try another approach
      if (result.error) {
        console.log('Basic test failed, trying a different approach...');
        // Try a different method - for example getting Supabase service status
        const serviceResult = await supabase.functions.invoke('hello-world', {
          body: { name: 'SystemTest' },
        }).catch(() => null);
        
        // If this works, we know Supabase is connected
        if (serviceResult) {
          data = { connected: true };
          error = null;
        } else {
          // Last resort - try a simple RPC call if one exists
          // or just check if we can access the auth API
          const authSettings = await supabase.auth.getSession();
          if (!authSettings.error) {
            data = { connected: true };
            error = null;
          } else {
            error = authSettings.error;
          }
        }
      } else {
        data = result.data;
        error = null;
      }
    } catch (err) {
      console.error('Error in connection test query:', err);
      error = {
        message: err instanceof Error ? err.message : String(err),
        code: (err as any)?.code
      };
    }
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      
      await auditSystemAction(
        'SYSTEM',
        AuditAction.READ,
        {
          action: 'test_supabase_connection',
          successful: false,
          error: error.message
        }
      );
      
      return {
        success: false,
        error
      };
    }
    
    // Connection successful even if our specific tables don't exist
    console.log('Supabase connection successful (tables may not exist yet)');
    
    await auditSystemAction(
      'SYSTEM',
      AuditAction.READ,
      {
        action: 'test_supabase_connection',
        successful: true
      }
    );
    
    return {
      success: true,
      data
    };
  } catch (err) {
    console.error('Supabase connection test failed with exception:', err);
    
    const errorDetails = {
      message: err instanceof Error ? err.message : String(err),
      code: (err as any)?.code
    };
    
    // Log the connection failure
    await auditSystemAction(
      'SYSTEM',
      AuditAction.READ,
      {
        action: 'test_supabase_connection',
        successful: false,
        error: errorDetails.message
      }
    );
    
    return {
      success: false,
      error: errorDetails
    };
  }
};

/**
 * Initializes Supabase tables and triggers if they don't exist
 * This ensures the database schema is ready for the application
 */
export const initializeSupabaseSchema = async (): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) {
    console.error('Cannot initialize Supabase schema - Supabase client not configured');
    return { success: false, error: 'Supabase client not configured' };
  }
  
  try {
    // Check if property_history_records table exists by trying to query it
    const { data: tableData, error: checkError } = await supabase
      .from('property_history_records')
      .select('property_id')
      .limit(1);
    
    // If there's no error, the table exists
    if (!checkError) {
      console.log('Property history table exists', tableData ? `with ${tableData.length} records` : 'but is empty');
      
      // Log successful schema check
      await auditSystemAction(
        'SYSTEM',
        AuditAction.READ,
        {
          action: 'initialize_supabase_schema',
          successful: true,
          tableExists: true
        }
      );
      
      return { success: true };
    }
    
    // If error is not related to missing table, report it
    if (checkError.code !== '42P01') {
      console.error('Error checking property_history_records table:', checkError);
      return { 
        success: false, 
        error: `Table check error: ${checkError.message} (${checkError.code})`
      };
    }
    
    // Table doesn't exist, we need to create it
    console.log('Property history table not found, creating it...');
    
    try {
      // For Supabase instances that don't have the execute_sql RPC function,
      // we need to provide instructions for manual table creation
      
      // Prepare SQL script for manual execution
      const createTableSQL = `
CREATE TABLE IF NOT EXISTS property_history_records (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL,
  year TEXT NOT NULL,
  value NUMERIC NOT NULL,
  source TEXT,
  notes TEXT,
  confidence INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(property_id, year)
);

-- Insert initialization record
INSERT INTO property_history_records (property_id, year, value, source, notes, confidence, updated_by)
VALUES ('init', '2000', 0, 'initialization', 'Table creation placeholder record', 100, 'system')
ON CONFLICT (property_id, year) DO NOTHING;

-- Add an index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_history_property_id ON property_history_records(property_id);
      `;
      
      console.log('Table creation requires SQL access. Please execute the following SQL in the Supabase dashboard:');
      console.log(createTableSQL);
      
      // Log the SQL script generation
      await auditSystemAction(
        'SYSTEM',
        AuditAction.CREATE,
        {
          action: 'generate_table_creation_sql',
          successful: true,
          table: 'property_history_records'
        }
      );
      
      // Try to create the table by directly inserting a record
      // This will fail, but we want to capture the exact error message
      const { error: createErr } = await supabase
        .from('property_history_records')
        .insert({
          property_id: 'init',
          year: '2000',
          value: 0,
          source: 'initialization',
          notes: 'Table creation placeholder record',
          confidence: 100,
          timestamp: new Date().toISOString(),
          updated_by: 'system',
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (createErr) {
        // Log the table creation failure
        await auditSystemAction(
          'SYSTEM',
          AuditAction.CREATE,
          {
            action: 'create_property_history_table',
            successful: false,
            error: `${createErr.message} (${createErr.code})`,
            manual_creation_required: true
          }
        );
        
        // Return detailed error information
        return { 
          success: false, 
          error: `Table creation error: ${createErr.message} (${createErr.code}). Manual schema creation is required.` 
        };
      } else {
        // This shouldn't happen, but handle it anyway
        console.log('Successfully created property_history_records table via direct insert');
        
        // Log successful table creation
        await auditSystemAction(
          'SYSTEM',
          AuditAction.CREATE,
          {
            action: 'create_property_history_table',
            successful: true,
            method: 'direct_insert'
          }
        );
        
        return { success: true };
      }
    } catch (sqlErr) {
      console.error('Schema initialization error:', sqlErr);
      return { 
        success: false, 
        error: `Schema initialization error: ${sqlErr instanceof Error ? sqlErr.message : String(sqlErr)}` 
      };
    }
  } catch (error) {
    console.error('Error initializing Supabase schema:', error);
    const result = { 
      success: false, 
      error: `Schema initialization error: ${error instanceof Error ? error.message : String(error)}` 
    };
    
    // Log schema initialization failure
    await auditSystemAction(
      'SYSTEM',
      AuditAction.CREATE,
      {
        action: 'initialize_supabase_schema',
        successful: false,
        error: result.error
      }
    );
    
    return result;
  }
};