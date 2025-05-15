/**
 * SQL Generator
 * 
 * Utility functions for generating SQL scripts for table creation
 * and other database operations.
 */

/**
 * Generate SQL script for creating tables
 * @param {string} tableName - Name of the table to create
 * @returns {string} SQL script for creating the specified table
 */
function generateTableCreationSQL(tableName) {
  switch (tableName) {
    case 'property_history_records':
      return `CREATE TABLE IF NOT EXISTS property_history_records (
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
CREATE INDEX IF NOT EXISTS idx_property_history_property_id ON property_history_records(property_id);`;
    
    case 'audit_records':
      return `CREATE TABLE IF NOT EXISTS audit_records (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT TRUE,
  new_state JSONB,
  context JSONB,
  error TEXT
);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_records_timestamp ON audit_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_records_entity ON audit_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_actor ON audit_records(actor);`;
    
    default:
      return `-- No SQL script available for table: ${tableName}`;
  }
}

module.exports = {
  generateTableCreationSQL
};