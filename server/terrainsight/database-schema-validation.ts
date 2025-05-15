/**
 * Database Schema Validation Utility
 * 
 * This module provides functions to validate the compatibility between
 * the Drizzle schema defined in code and the actual PostgreSQL database schema.
 * It helps identify type mismatches and potential data conversion issues.
 */

import { db } from './db';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

// Schema validation result interface
export interface SchemaValidationResult {
  missingTables: string[];
  extraTables: string[];
  typeMismatches: TypeMismatch[];
}

// Type mismatch interface
export interface TypeMismatch {
  table: string;
  column: string;
  codeType: string;
  dbType: string;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Validates the database schema against the code schema
 * Returns a validation result with mismatches and their severity
 */
export async function validateDatabaseSchema(): Promise<SchemaValidationResult> {
  const result: SchemaValidationResult = {
    missingTables: [],
    extraTables: [],
    typeMismatches: []
  };

  try {
    console.log('[Schema Validation] Starting database schema validation...');
    
    // Extract table definitions from the schema
    const tableDefinitions = extractTableDefinitions();
    console.log(`[Schema Validation] Found ${Object.keys(tableDefinitions).length} table definitions in code`);
    
    // Get database tables and columns
    const dbColumnsResult = await db.execute(sql`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = 'public'
    `);
    
    // Depending on the Drizzle version, the result might be in .rows or directly in the result
    const dbColumns = (dbColumnsResult.rows || dbColumnsResult) as any[];
    
    // Group columns by table
    const dbTables: Record<string, any[]> = {};
    dbColumns.forEach(col => {
      if (!dbTables[col.table_name]) {
        dbTables[col.table_name] = [];
      }
      dbTables[col.table_name].push(col);
    });
    
    console.log(`[Schema Validation] Found ${Object.keys(dbTables).length} tables in database`);
    
    // Check for tables in code but not in DB
    for (const tableName in tableDefinitions) {
      if (!dbTables[tableName]) {
        result.missingTables.push(tableName);
      }
    }
    
    // Check for tables in DB but not in code
    for (const tableName in dbTables) {
      if (!tableDefinitions[tableName]) {
        result.extraTables.push(tableName);
      }
    }
    
    // Check column types for tables that exist in both
    for (const tableName in tableDefinitions) {
      if (!dbTables[tableName]) continue;
      
      const codeColumns = tableDefinitions[tableName].columns;
      const dbColumnsForTable = dbTables[tableName];
      
      // Map DB columns by name for easier lookup
      const dbColumnMap: Record<string, any> = {};
      dbColumnsForTable.forEach(col => {
        dbColumnMap[col.column_name] = col;
      });
      
      // Check each code column against DB
      for (const columnName in codeColumns) {
        const codeColumn = codeColumns[columnName];
        const dbColumn = dbColumnMap[columnName];
        
        if (!dbColumn) {
          // Column exists in code but not in DB - this should be handled by migration tools
          continue;
        }
        
        // Check type compatibility
        const codeType = mapCodeTypeToDbType(codeColumn.type);
        const dbType = dbColumn.data_type;
        
        if (!areTypesCompatible(codeType, dbType)) {
          const severity = determineTypeMismatchSeverity(codeType, dbType);
          
          result.typeMismatches.push({
            table: tableName,
            column: columnName,
            codeType,
            dbType,
            severity,
          });
        }
      }
    }
    
    console.log(`[Schema Validation] Schema validation complete. Found ${result.typeMismatches.length} type mismatches.`);
    return result;
  } catch (error) {
    console.error('[Schema Validation] Error during schema validation:', error);
    throw error;
  }
}

/**
 * Extracts table definitions from the schema
 */
function extractTableDefinitions(): Record<string, { variableName: string; columns: Record<string, { type: string; args: string }> }> {
  const tables: Record<string, { variableName: string; columns: Record<string, { type: string; args: string }> }> = {};
  
  // Extract table definitions from schema
  for (const key in schema) {
    const value = (schema as any)[key];
    
    // Check if it's a table definition (has config & columns)
    if (value && typeof value === 'object' && value.config && value.config.name && value.config.columns) {
      const tableName = value.config.name;
      const columns: Record<string, { type: string; args: string }> = {};
      
      // Extract column information
      for (const colName in value.config.columns) {
        const column = value.config.columns[colName];
        
        // Get the column type from the constructor name or the columnType property
        let type = '';
        if (column.$type) {
          type = column.$type.name || column.$type.constructor.name;
        } else if (column.dataType) {
          type = column.dataType;
        } else if (column.columnType) {
          type = column.columnType.replace('Pg', '').toLowerCase();
        } else {
          type = column.constructor.name.replace('Pg', '').toLowerCase();
        }
        
        columns[colName] = {
          type,
          args: '',
        };
      }
      
      tables[tableName] = {
        variableName: key,
        columns
      };
    }
  }
  
  return tables;
}

/**
 * Maps code schema types to PostgreSQL types
 */
function mapCodeTypeToDbType(codeType: string): string {
  // Extract the base type from column types like "PgNumeric", "PgText", etc.
  const baseType = codeType.replace('Pg', '').toLowerCase();
  
  const typeMap: Record<string, string> = {
    'serial': 'integer',
    'text': 'text',
    'varchar': 'character varying',
    'integer': 'integer',
    'bigint': 'bigint',
    'smallint': 'smallint',
    'boolean': 'boolean',
    'numeric': 'numeric',
    'timestamp': 'timestamp with time zone',
    'jsonb': 'jsonb',
    'json': 'json',
    'date': 'date',
    'time': 'time',
    'uuid': 'uuid',
    'real': 'real',
    'float': 'double precision',
    'doubleprecision': 'double precision',
  };
  
  return typeMap[baseType] || baseType;
}

/**
 * Checks if code type and database type are compatible
 */
function areTypesCompatible(codeType: string, dbType: string): boolean {
  // Normalize types for comparison
  const normalizedCodeType = normalizeType(codeType);
  const normalizedDbType = normalizeType(dbType);
  
  // Check for exact match after normalization
  if (normalizedCodeType === normalizedDbType) return true;
  
  // Group compatible types
  const numericTypes = ['numeric', 'integer', 'decimal', 'real', 'double precision', 'float', 'bigint', 'smallint'];
  const textTypes = ['text', 'varchar', 'character varying', 'char', 'character'];
  const booleanTypes = ['boolean', 'bool'];
  const jsonTypes = ['json', 'jsonb'];
  const dateTimeTypes = ['timestamp', 'date', 'time', 'timestamp with time zone', 'timestamp without time zone'];
  const serialTypes = ['serial', 'bigserial', 'smallserial', 'integer'];
  
  // Check for compatible numeric types - any numeric type can be converted to another with potential precision concerns
  if (numericTypes.includes(normalizedCodeType) && numericTypes.includes(normalizedDbType)) {
    return true;
  }
  
  // Check for compatible text types
  if (textTypes.includes(normalizedCodeType) && textTypes.includes(normalizedDbType)) {
    return true;
  }
  
  // Check for compatible boolean types
  if (booleanTypes.includes(normalizedCodeType) && booleanTypes.includes(normalizedDbType)) {
    return true;
  }
  
  // Check for compatible JSON types
  if (jsonTypes.includes(normalizedCodeType) && jsonTypes.includes(normalizedDbType)) {
    return true;
  }
  
  // Check for compatible date/time types
  if (dateTimeTypes.includes(normalizedCodeType) && dateTimeTypes.includes(normalizedDbType)) {
    return true;
  }
  
  // Serial and integer are compatible
  if (serialTypes.includes(normalizedCodeType) && serialTypes.includes(normalizedDbType)) {
    return true;
  }
  
  // Special case: We handle numeric/text conversion in our app
  if (
    (numericTypes.includes(normalizedCodeType) && textTypes.includes(normalizedDbType)) ||
    (textTypes.includes(normalizedCodeType) && numericTypes.includes(normalizedDbType))
  ) {
    // Type mismatch but we handle conversion
    return true;
  }
  
  return false;
}

/**
 * Normalizes type names for comparison
 */
function normalizeType(type: string): string {
  const typeMap: Record<string, string> = {
    'character varying': 'varchar',
    'varchar': 'varchar',
    'text': 'text',
    'integer': 'integer',
    'int': 'integer',
    'bigint': 'integer',
    'smallint': 'integer',
    'serial': 'serial',
    'bigserial': 'serial',
    'numeric': 'numeric',
    'decimal': 'numeric',
    'real': 'numeric',
    'double precision': 'numeric',
    'boolean': 'boolean',
    'timestamp with time zone': 'timestamp',
    'timestamp without time zone': 'timestamp',
    'json': 'json',
    'jsonb': 'jsonb',
  };
  
  return typeMap[type.toLowerCase()] || type.toLowerCase();
}

/**
 * Determines the severity of a type mismatch
 */
function determineTypeMismatchSeverity(codeType: string, dbType: string): 'high' | 'medium' | 'low' {
  const normalizedCodeType = normalizeType(codeType);
  const normalizedDbType = normalizeType(dbType);
  
  // Group types for easier checking
  const numericTypes = ['numeric', 'integer', 'decimal', 'real', 'double precision', 'float', 'bigint', 'smallint'];
  const textTypes = ['text', 'varchar', 'character varying', 'char', 'character'];
  const booleanTypes = ['boolean', 'bool'];
  const dateTimeTypes = ['timestamp', 'date', 'time', 'timestamp with time zone', 'timestamp without time zone'];
  
  // High severity: Type conversions that can cause data loss or interpretation issues
  if (
    // Text to non-text conversions are risky unless we have conversion logic
    (textTypes.includes(normalizedCodeType) && 
      (booleanTypes.includes(normalizedDbType) || dateTimeTypes.includes(normalizedDbType))) ||
    (textTypes.includes(normalizedDbType) && 
      (booleanTypes.includes(normalizedCodeType) || dateTimeTypes.includes(normalizedCodeType))) ||
    // Boolean conversions to non-boolean types are risky
    (booleanTypes.includes(normalizedCodeType) && !booleanTypes.includes(normalizedDbType)) ||
    (booleanTypes.includes(normalizedDbType) && !booleanTypes.includes(normalizedCodeType))
  ) {
    return 'high';
  }
  
  // Medium severity: Potential precision or format issues but generally convertible
  if (
    // Integer to float types can lose precision
    (normalizedCodeType === 'integer' && ['numeric', 'real', 'double precision', 'float'].includes(normalizedDbType)) ||
    (normalizedDbType === 'integer' && ['numeric', 'real', 'double precision', 'float'].includes(normalizedCodeType)) ||
    // Date/time to text conversions may have format inconsistencies
    (dateTimeTypes.includes(normalizedCodeType) && textTypes.includes(normalizedDbType)) ||
    (textTypes.includes(normalizedCodeType) && dateTimeTypes.includes(normalizedDbType)) ||
    // Numeric to text conversions need careful handling
    (numericTypes.includes(normalizedCodeType) && textTypes.includes(normalizedDbType)) ||
    (textTypes.includes(normalizedCodeType) && numericTypes.includes(normalizedDbType))
  ) {
    return 'medium';
  }
  
  // Low severity: Compatible types with minimal risk
  return 'low';
}