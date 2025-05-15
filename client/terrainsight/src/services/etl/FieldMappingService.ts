/**
 * FieldMappingService.ts
 * 
 * Service for managing field mappings between source and target schemas
 * Provides functionality for automating column mappings and applying transformations
 */

import { AlertCategory, AlertSeverity, alertService } from './AlertService';

export interface SourceColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface TargetColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string | ((value: any) => any);
  required: boolean;
  defaultValue?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

class FieldMappingService {
  /**
   * Extract column information from database metadata
   * @param columns Database column metadata
   * @returns Normalized column information
   */
  extractColumnsFromMetadata(columns: any[]): SourceColumn[] {
    if (!columns || columns.length === 0) {
      return [];
    }

    return columns.map(column => {
      // Handle different metadata formats from various database providers
      
      // SQL Server format
      if (column.column_name && column.data_type) {
        return {
          name: column.column_name,
          type: this.normalizeType(column.data_type),
          nullable: column.is_nullable === 'YES'
        };
      }
      
      // ODBC format
      if (column.COLUMN_NAME && column.DATA_TYPE) {
        return {
          name: column.COLUMN_NAME,
          type: this.normalizeType(this.getTypeNameFromODBC(column.DATA_TYPE)),
          nullable: column.NULLABLE === 1
        };
      }
      
      // Generic format (assume each column has a name property)
      return {
        name: column.name || column.COLUMN_NAME || column.column_name || 'unknown',
        type: this.normalizeType(column.type || column.DATA_TYPE || column.data_type || 'varchar'),
        nullable: column.nullable === true || column.NULLABLE === 1 || column.is_nullable === 'YES'
      };
    });
  }

  /**
   * Suggest field mappings based on column metadata
   * @param sourceColumns Source columns
   * @param targetColumns Target columns
   * @returns Suggested field mappings
   */
  suggestMappings(sourceColumns: SourceColumn[], targetColumns: TargetColumn[]): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    // Loop through target columns to find matching source columns
    for (const targetColumn of targetColumns) {
      // Try exact match first
      let sourceColumn = sourceColumns.find(sc => 
        sc.name.toLowerCase() === targetColumn.name.toLowerCase()
      );

      // If no exact match, try partial match
      if (!sourceColumn) {
        sourceColumn = sourceColumns.find(sc => {
          const sourceName = sc.name.toLowerCase();
          const targetName = targetColumn.name.toLowerCase();
          
          // Check if source contains target or vice versa
          return sourceName.includes(targetName) || targetName.includes(sourceName);
        });
      }

      // If still no match, check levenshtein distance for similar names
      if (!sourceColumn) {
        const matches = sourceColumns
          .map(sc => ({
            column: sc,
            distance: this.levenshteinDistance(
              sc.name.toLowerCase(),
              targetColumn.name.toLowerCase()
            )
          }))
          .filter(match => match.distance <= 3) // Only consider close matches
          .sort((a, b) => a.distance - b.distance);

        if (matches.length > 0) {
          sourceColumn = matches[0].column;
        }
      }

      // If we found a matching source column, create a mapping
      if (sourceColumn) {
        const transformation = this.suggestTransformation(sourceColumn, targetColumn);
        
        mappings.push({
          sourceField: sourceColumn.name,
          targetField: targetColumn.name,
          transformation: transformation,
          required: !targetColumn.nullable,
          defaultValue: targetColumn.nullable ? undefined : this.getDefaultValueForType(targetColumn.type)
        });
      }
    }

    return mappings;
  }

  /**
   * Suggest a transformation based on source and target column types
   * @param sourceColumn Source column
   * @param targetColumn Target column
   * @returns Suggested transformation function name
   */
  suggestTransformation(sourceColumn: SourceColumn, targetColumn: TargetColumn): string | undefined {
    const sourceType = sourceColumn.type.toLowerCase();
    const targetType = targetColumn.type.toLowerCase();

    // No transformation needed if types match
    if (sourceType === targetType) {
      return undefined;
    }

    // Source: string, Target: number
    if ((sourceType === 'varchar' || sourceType === 'text' || sourceType === 'char') && 
        (targetType === 'numeric' || targetType === 'integer' || targetType === 'decimal' || targetType === 'float')) {
      return 'parseFloat';
    }

    // Source: number, Target: string
    if ((sourceType === 'numeric' || sourceType === 'integer' || sourceType === 'decimal' || sourceType === 'float') && 
        (targetType === 'varchar' || targetType === 'text' || targetType === 'char')) {
      return 'toString';
    }

    // Source: date, Target: string
    if ((sourceType === 'date' || sourceType === 'datetime' || sourceType === 'timestamp') && 
        (targetType === 'varchar' || targetType === 'text' || targetType === 'char')) {
      return 'formatDate';
    }

    // Source: string, Target: date
    if ((sourceType === 'varchar' || sourceType === 'text' || sourceType === 'char') && 
        (targetType === 'date' || targetType === 'datetime' || targetType === 'timestamp')) {
      return 'parseDate';
    }

    // Source: boolean, Target: string
    if (sourceType === 'boolean' && (targetType === 'varchar' || targetType === 'text' || targetType === 'char')) {
      return 'booleanToString';
    }

    // Source: string or numeric, Target: boolean
    if ((sourceType === 'varchar' || sourceType === 'text' || sourceType === 'char' || sourceType === 'numeric' || sourceType === 'integer') && 
        targetType === 'boolean') {
      return 'stringToBoolean';
    }

    // Default: no transformation
    return undefined;
  }

  /**
   * Apply field mappings to transform data
   * @param data Source data
   * @param mappings Field mappings
   * @returns Transformed data
   */
  applyMappings(data: any[], mappings: FieldMapping[]): any[] {
    return data.map(item => {
      const result: any = {};
      
      for (const mapping of mappings) {
        let value = item[mapping.sourceField];
        
        // Apply transformation if specified
        if (mapping.transformation) {
          if (typeof mapping.transformation === 'function') {
            try {
              value = mapping.transformation(value);
            } catch (error) {
              console.error(`Transformation error for field ${mapping.sourceField} -> ${mapping.targetField}:`, error);
              alertService.addAlert({
                title: 'Transformation Error',
                message: `Error transforming field ${mapping.sourceField} -> ${mapping.targetField}`,
                details: (error as Error).message,
                category: AlertCategory.TRANSFORM,
                severity: AlertSeverity.ERROR,
                source: 'FieldMappingService'
              });
              
              // Use default value or null if transformation fails
              value = mapping.defaultValue !== undefined ? mapping.defaultValue : null;
            }
          } else if (typeof mapping.transformation === 'string') {
            // Apply named transformation
            try {
              value = this.applyNamedTransformation(value, mapping.transformation);
            } catch (error) {
              console.error(`Transformation error for field ${mapping.sourceField} -> ${mapping.targetField}:`, error);
              alertService.addAlert({
                title: 'Transformation Error',
                message: `Error transforming field ${mapping.sourceField} -> ${mapping.targetField}`,
                details: (error as Error).message,
                category: AlertCategory.TRANSFORM,
                severity: AlertSeverity.ERROR,
                source: 'FieldMappingService'
              });
              
              // Use default value or null if transformation fails
              value = mapping.defaultValue !== undefined ? mapping.defaultValue : null;
            }
          }
        }
        
        // Use default value if value is undefined/null and default value is specified
        if ((value === undefined || value === null) && mapping.defaultValue !== undefined) {
          value = mapping.defaultValue;
        }
        
        result[mapping.targetField] = value;
      }
      
      return result;
    });
  }

  /**
   * Validate a record against field mappings
   * @param record Record to validate
   * @param mappings Field mappings
   * @returns Validation errors
   */
  validateRecord(record: any, mappings: FieldMapping[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const mapping of mappings) {
      const value = record[mapping.targetField];
      
      // Check required fields
      if (mapping.required && (value === undefined || value === null)) {
        errors.push({
          field: mapping.targetField,
          message: `Required field '${mapping.targetField}' is missing`,
          value
        });
      }
    }
    
    return errors;
  }

  /**
   * Apply a named transformation to a value
   * @param value Value to transform
   * @param transformationName Transformation name
   * @returns Transformed value
   */
  private applyNamedTransformation(value: any, transformationName: string): any {
    switch (transformationName) {
      case 'parseFloat':
        if (value === null || value === undefined || value === '') {
          return null;
        }
        return parseFloat(value);
        
      case 'toString':
        if (value === null || value === undefined) {
          return '';
        }
        return String(value);
        
      case 'formatDate':
        if (value === null || value === undefined) {
          return null;
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        return String(value);
        
      case 'parseDate':
        if (value === null || value === undefined || value === '') {
          return null;
        }
        return new Date(value);
        
      case 'booleanToString':
        if (value === null || value === undefined) {
          return '';
        }
        return value ? 'true' : 'false';
        
      case 'stringToBoolean':
        if (value === null || value === undefined || value === '') {
          return false;
        }
        if (typeof value === 'string') {
          return ['true', 'yes', 'y', '1'].includes(value.toLowerCase());
        }
        return Boolean(value);
        
      default:
        return value;
    }
  }

  /**
   * Normalize a database type to a standard type
   * @param type Database type
   * @returns Normalized type
   */
  private normalizeType(type: string): string {
    type = type.toLowerCase();
    
    if (type.includes('int')) {
      return 'integer';
    }
    
    if (type.includes('char') || type.includes('text') || type.includes('string')) {
      return 'varchar';
    }
    
    if (type.includes('float') || type.includes('real') || type.includes('double') || type.includes('decimal') || type.includes('numeric') || type.includes('money')) {
      return 'numeric';
    }
    
    if (type.includes('date') || type.includes('time') || type.includes('stamp')) {
      return 'date';
    }
    
    if (type.includes('bool')) {
      return 'boolean';
    }
    
    return type;
  }

  /**
   * Get ODBC type name from type code
   * @param typeCode ODBC type code
   * @returns Type name
   */
  private getTypeNameFromODBC(typeCode: number): string {
    // Common ODBC SQL type codes
    const typeMap: {[key: number]: string} = {
      1: 'char',
      2: 'numeric',
      3: 'decimal',
      4: 'integer',
      5: 'smallint',
      6: 'float',
      7: 'real',
      8: 'double',
      9: 'datetime',
      12: 'varchar',
      91: 'date',
      92: 'time',
      93: 'timestamp'
    };
    
    if (typeCode === -1) return 'longvarchar';
    if (typeCode === -6) return 'tinyint';
    if (typeCode === -7) return 'bit';
    if (typeCode === -9) return 'nvarchar';
    
    return typeMap[typeCode] || 'varchar';
  }

  /**
   * Get default value for a type
   * @param type Data type
   * @returns Default value for the type
   */
  private getDefaultValueForType(type: string): any {
    switch (type.toLowerCase()) {
      case 'integer':
      case 'numeric':
      case 'decimal':
      case 'float':
        return 0;
        
      case 'varchar':
      case 'text':
      case 'char':
        return '';
        
      case 'date':
      case 'datetime':
      case 'timestamp':
        return null;
        
      case 'boolean':
        return false;
        
      default:
        return null;
    }
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param a First string
   * @param b Second string
   * @returns Levenshtein distance
   */
  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix: number[][] = [];
    
    // Initialize the matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
}

// Export a singleton instance
export const fieldMappingService = new FieldMappingService();
export default fieldMappingService;