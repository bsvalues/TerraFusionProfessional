/**
 * Supabase Initializer Agent
 * 
 * This agent is responsible for:
 * 1. Verifying the existence of required Supabase tables
 * 2. Providing SQL instructions for table creation if they don't exist
 * 3. Reporting the status of the Supabase connection
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export interface SupabaseStatus {
  connected: boolean;
  auditTableExists: boolean;
  propertyHistoryTableExists: boolean;
  error?: string;
  sqlInstructions?: string;
}

export class SupabaseInitializer {
  private supabase: SupabaseClient | null = null;
  private adminSupabase: SupabaseClient | null = null;
  private initialized = false;
  private useFallbackPostgres = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        if (SUPABASE_SERVICE_KEY) {
          this.adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        }
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        this.initialized = false;
      }
    } else {
      console.warn('Missing Supabase credentials, using fallback PostgreSQL');
      this.useFallbackPostgres = true;
    }
  }

  /**
   * Check if all required tables exist
   */
  public async checkTablesExist(): Promise<SupabaseStatus> {
    if (!this.initialized) {
      return {
        connected: false,
        auditTableExists: false,
        propertyHistoryTableExists: false,
        error: 'Supabase client not initialized',
        sqlInstructions: this.getFullSqlInstructions()
      };
    }

    try {
      // First, check if we can connect to Supabase
      const { data: connectionTest, error: connectionError } = await this.supabase!
        .from('audit_records')
        .select('id')
        .limit(1);

      console.log('Audit table check:', connectionError ? 
        `Error: ${connectionError.message} (${connectionError.code})` : 
        `Found ${connectionTest?.length || 0} records`);
        
      // If the audit_records table doesn't exist yet, we'll get a specific error
      // Table exists if either:
      // 1. No error occurred, or
      // 2. An error occurred but it wasn't because the table doesn't exist
      const auditTableExists = !connectionError || connectionError.code !== '42P01';
      
      // Check for property_history_records table
      const { data: historyTest, error: historyError } = await this.supabase!
        .from('property_history_records')
        .select('id')
        .limit(1);
      
      console.log('History table check:', historyError ? 
        `Error: ${historyError.message} (${historyError.code})` : 
        `Found ${historyTest?.length || 0} records`);

      // Table exists if either:
      // 1. No error occurred, or
      // 2. An error occurred but it wasn't because the table doesn't exist
      const propertyHistoryTableExists = !historyError || historyError.code !== '42P01';

      // If tables don't exist, provide SQL instructions
      let sqlInstructions = '';
      if (!auditTableExists || !propertyHistoryTableExists) {
        sqlInstructions = this.getFullSqlInstructions();
      }

      // Connection is successful if:
      // 1. No table-not-found errors occurred
      // 2. Or we had other errors that indicate the tables exist but something else failed
      const connectionFailed = connectionError && historyError && 
        connectionError.code === '42P01' && historyError.code === '42P01';

      return {
        connected: !connectionFailed,
        auditTableExists,
        propertyHistoryTableExists,
        error: connectionFailed ? 
          `Connection error: ${connectionError?.message || 'Unknown error'}` : undefined,
        sqlInstructions: sqlInstructions || undefined
      };
    } catch (error: any) {
      console.error('Error checking tables:', error);
      return {
        connected: false,
        auditTableExists: false,
        propertyHistoryTableExists: false,
        error: `Exception: ${error?.message || 'Unknown error'}`,
        sqlInstructions: this.getFullSqlInstructions()
      };
    }
  }

  /**
   * Create required tables if they don't exist
   * This requires the service key which has more privileges
   */
  public async createTablesIfNeeded(): Promise<SupabaseStatus> {
    const status = await this.checkTablesExist();
    
    // If all tables exist, return the status
    if (status.auditTableExists && status.propertyHistoryTableExists) {
      return status;
    }
    
    // If we don't have admin access, return instructions
    if (!this.adminSupabase) {
      return {
        ...status,
        error: 'No service key provided for table creation'
      };
    }
    
    try {
      // Create audit_records table if needed
      if (!status.auditTableExists) {
        await this.createAuditTable();
      }
      
      // Create property_history_records table if needed
      if (!status.propertyHistoryTableExists) {
        await this.createPropertyHistoryTable();
      }
      
      // Check again if tables exist
      return await this.checkTablesExist();
    } catch (error: any) {
      console.error('Error creating tables:', error);
      return {
        ...status,
        error: `Failed to create tables: ${error?.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Attempt to create the audit_records table
   * This is a workaround since we can't execute custom SQL directly
   */
  private async createAuditTable(): Promise<void> {
    try {
      // Insert a record to potentially create the table
      // This won't work with Supabase directly, but we'll try it anyway
      const { data, error } = await this.adminSupabase!
        .from('audit_records')
        .insert({
          id: uuidv4(),
          actor: 'SYSTEM',
          action: 'CREATE',
          entity_type: 'SYSTEM',
          entity_id: 'INITIALIZATION',
          new_state: { action: 'tables_created', successful: true },
          success: true
        });
      
      if (error && error.code === '42P01') {
        console.error('Could not create audit_records table automatically');
        throw new Error('Manual SQL execution required');
      } else if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error creating audit table:', error);
      throw error;
    }
  }

  /**
   * Attempt to create the property_history_records table
   * This is a workaround since we can't execute custom SQL directly
   */
  private async createPropertyHistoryTable(): Promise<void> {
    try {
      // Insert a record to potentially create the table
      // This won't work with Supabase directly, but we'll try it anyway
      const { data, error } = await this.adminSupabase!
        .from('property_history_records')
        .insert({
          property_id: 'init',
          year: '2000',
          value: 0,
          source: 'initialization',
          notes: 'Table creation placeholder record',
          confidence: 100,
          updated_by: 'system'
        });
      
      if (error && error.code === '42P01') {
        console.error('Could not create property_history_records table automatically');
        throw new Error('Manual SQL execution required');
      } else if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error creating property history table:', error);
      throw error;
    }
  }

  /**
   * Get SQL instructions for creating audit_records table
   */
  private getAuditTableSql(): string {
    return `
-- Create audit records table
CREATE TABLE IF NOT EXISTS audit_records (
  id UUID PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  new_state JSONB,
  context JSONB,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for audit records
CREATE INDEX IF NOT EXISTS idx_audit_records_timestamp ON audit_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_records_entity ON audit_records(entity_type, entity_id);

-- Insert an initialization audit record
INSERT INTO audit_records (id, actor, action, entity_type, entity_id, new_state, success)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SYSTEM',
  'CREATE',
  'SYSTEM',
  'INITIALIZATION',
  '{"action": "tables_created", "successful": true}',
  TRUE
) ON CONFLICT (id) DO NOTHING;
    `;
  }

  /**
   * Get SQL instructions for creating property_history_records table
   */
  private getPropertyHistoryTableSql(): string {
    return `
-- Create property history records table
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

-- Add an index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_history_property_id ON property_history_records(property_id);

-- Insert initialization record
INSERT INTO property_history_records (property_id, year, value, source, notes, confidence, updated_by)
VALUES ('init', '2000', 0, 'initialization', 'Table creation placeholder record', 100, 'system')
ON CONFLICT (property_id, year) DO NOTHING;
    `;
  }

  /**
   * Get full SQL instructions for creating all required tables
   */
  private getFullSqlInstructions(): string {
    return `${this.getAuditTableSql()}\n${this.getPropertyHistoryTableSql()}`;
  }
}

export default SupabaseInitializer;