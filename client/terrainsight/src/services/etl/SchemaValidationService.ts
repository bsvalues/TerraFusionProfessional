/**
 * SchemaValidationService.ts
 * 
 * Service for validating data against schemas in ETL pipelines
 * Uses Zod for schema definition and validation
 */

import { z } from 'zod';
import { ValidationResult, ValidationError, ValidationWarning, ValidationStats } from './DataValidationService';
import { createInsertSchema } from 'drizzle-zod';
import * as schema from '@shared/schema';

/**
 * Schema validation configuration
 */
export interface SchemaValidationConfig {
  /** The name of the schema to validate against */
  schemaName: SchemaName;
  
  /** Whether to stop validation on first error */
  stopOnFirstError?: boolean;
  
  /** Custom error messages for specific fields */
  customErrorMessages?: Record<string, string>;
  
  /** Custom validation options */
  options?: {
    /** Whether to strip unknown fields */
    stripUnknown?: boolean;
    
    /** Whether to perform coercion of values */
    coerce?: boolean;
  };
}

/**
 * Schema validation result
 */
export interface SchemaValidationResult extends ValidationResult {
  /** Raw Zod validation errors */
  zodErrors?: z.ZodError[];
  
  /** Field-level validation summary */
  fieldValidation: Record<string, {
    valid: boolean;
    errors: string[];
  }>;
  
  /** Potentially coerced data (if coercion was enabled) */
  coercedData?: any[];
}

/**
 * Supported schema names
 */
export enum SchemaName {
  PROPERTY = 'property',
  USER = 'user',
  PROJECT = 'project',
  SCRIPT = 'script',
  SCRIPT_GROUP = 'scriptGroup',
  REGRESSION_MODEL = 'regressionModel',
  INCOME_HOTEL_MOTEL = 'incomeHotelMotel',
  INCOME_HOTEL_MOTEL_DETAIL = 'incomeHotelMotelDetail',
  INCOME_LEASE_UP = 'incomeLeaseUp',
  ETL_DATA_SOURCE = 'etlDataSource',
  ETL_TRANSFORMATION_RULE = 'etlTransformationRule',
  ETL_JOB = 'etlJob',
}

/**
 * Schema validation service
 */
export class SchemaValidationService {
  // Cache for compiled schemas
  private schemaCache: Record<string, z.ZodType> = {};
  
  /**
   * Validate data against a schema
   * 
   * @param data The data to validate
   * @param config Schema validation configuration
   * @returns Validation result
   */
  public validate(data: any[], config: SchemaValidationConfig): SchemaValidationResult {
    if (!data || data.length === 0) {
      return this.createEmptyResult();
    }
    
    const schema = this.getSchema(config.schemaName, config.options);
    
    // Initialize validation results
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const zodErrors: z.ZodError[] = [];
    const fieldValidation: Record<string, { valid: boolean; errors: string[] }> = {};
    const coercedData: any[] = config.options?.coerce ? [] : undefined;
    
    // Initialize statistics
    const stats: ValidationStats = {
      completeness: {
        score: 1,
        missingFields: {},
      },
      accuracy: {
        score: 1,
        invalidValues: {},
      },
      consistency: {
        score: 1,
        inconsistentValues: {},
      },
    };
    
    // Validate each record
    let validRecords = 0;
    let invalidRecords = 0;
    
    data.forEach((record, recordIndex) => {
      let recordValid = true;
      
      try {
        // Validate with Zod
        const result = schema.safeParse(record);
        
        if (!result.success) {
          recordValid = false;
          invalidRecords++;
          
          // Add to zodErrors
          zodErrors.push(result.error);
          
          // Process each validation error
          result.error.errors.forEach(err => {
            const field = err.path.join('.');
            const message = this.formatErrorMessage(err, config.customErrorMessages);
            
            // Update field validation state
            if (!fieldValidation[field]) {
              fieldValidation[field] = { valid: false, errors: [] };
            }
            fieldValidation[field].errors.push(message);
            
            // Add to errors
            errors.push({
              record,
              field,
              rule: {
                field,
                type: this.mapErrorCodeToValidationType(err.code),
                errorMessage: message,
              },
              message,
              recordIndex,
            });
            
            // Update stats
            if (err.code === 'invalid_type' && err.received === 'undefined') {
              // Missing field - affects completeness
              stats.completeness.missingFields[field] = (stats.completeness.missingFields[field] || 0) + 1;
            } else {
              // Invalid value - affects accuracy
              stats.accuracy.invalidValues[field] = (stats.accuracy.invalidValues[field] || 0) + 1;
            }
          });
          
          // If coercion was requested, still include the original data
          if (coercedData) {
            coercedData.push(record);
          }
          
          // Stop validation if configured
          if (config.stopOnFirstError) {
            return;
          }
        } else {
          validRecords++;
          
          // If coercion was requested, include the parsed data
          if (coercedData) {
            coercedData.push(result.data);
          }
          
          // Add fields to fieldValidation with no errors
          const fields = Object.keys(record);
          fields.forEach(field => {
            if (!fieldValidation[field]) {
              fieldValidation[field] = { valid: true, errors: [] };
            }
          });
        }
      } catch (error) {
        // This shouldn't normally happen with safeParse, but just in case
        console.error('Unexpected validation error:', error);
        recordValid = false;
        invalidRecords++;
        
        errors.push({
          record,
          field: '*',
          rule: {
            field: '*',
            type: 'custom',
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          message: error instanceof Error ? error.message : String(error),
          recordIndex,
        });
        
        if (coercedData) {
          coercedData.push(record);
        }
      }
    });
    
    // Calculate statistics
    this.calculateStats(stats, data.length);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalRecords: data.length,
      validRecords,
      invalidRecords,
      stats,
      zodErrors,
      fieldValidation,
      coercedData,
    };
  }
  
  /**
   * Get a Zod schema for a given schema name
   * 
   * @param schemaName The name of the schema
   * @param options Schema options
   * @returns Zod schema
   */
  public getSchema(schemaName: SchemaName, options?: { stripUnknown?: boolean; coerce?: boolean }): z.ZodType {
    // Check cache first
    const cacheKey = `${schemaName}_${options?.stripUnknown}_${options?.coerce}`;
    if (this.schemaCache[cacheKey]) {
      return this.schemaCache[cacheKey];
    }
    
    // Generate schema based on the Drizzle tables
    let baseSchema: z.ZodType;
    
    switch (schemaName) {
      case SchemaName.PROPERTY:
        baseSchema = createInsertSchema(schema.properties);
        break;
      case SchemaName.USER:
        baseSchema = createInsertSchema(schema.users);
        break;
      case SchemaName.PROJECT:
        baseSchema = createInsertSchema(schema.projects);
        break;
      case SchemaName.SCRIPT:
        baseSchema = createInsertSchema(schema.scripts);
        break;
      case SchemaName.SCRIPT_GROUP:
        baseSchema = createInsertSchema(schema.scriptGroups);
        break;
      case SchemaName.REGRESSION_MODEL:
        baseSchema = createInsertSchema(schema.regressionModels);
        break;
      case SchemaName.INCOME_HOTEL_MOTEL:
        baseSchema = createInsertSchema(schema.incomeHotelMotel);
        break;
      case SchemaName.INCOME_HOTEL_MOTEL_DETAIL:
        baseSchema = createInsertSchema(schema.incomeHotelMotelDetail);
        break;
      case SchemaName.INCOME_LEASE_UP:
        baseSchema = createInsertSchema(schema.incomeLeaseUp);
        break;
      case SchemaName.ETL_DATA_SOURCE:
        baseSchema = createInsertSchema(schema.etlDataSources);
        break;
      case SchemaName.ETL_TRANSFORMATION_RULE:
        baseSchema = createInsertSchema(schema.etlTransformationRules);
        break;
      case SchemaName.ETL_JOB:
        baseSchema = createInsertSchema(schema.etlJobs);
        break;
      default:
        throw new Error(`Unknown schema name: ${schemaName}`);
    }
    
    // Apply options
    let finalSchema = baseSchema;
    
    if (options?.stripUnknown) {
      finalSchema = finalSchema.strict();
    }
    
    if (options?.coerce) {
      // This is a simplistic approach - in a real app, you would need to implement
      // specific coercion rules for each field type
      finalSchema = this.makeSchemaCoercible(finalSchema);
    }
    
    // Cache the schema
    this.schemaCache[cacheKey] = finalSchema;
    
    return finalSchema;
  }
  
  /**
   * Make a schema coercible for common data types
   * 
   * @param schema The schema to make coercible
   * @returns Coercible schema
   */
  private makeSchemaCoercible(schema: z.ZodType): z.ZodType {
    // This is a very simplified implementation
    // In a real app, you would need to traverse the schema and apply coercion
    // rules to each field based on its type
    
    // For now, just return the original schema as we'd need more advanced
    // transformation logic to properly implement this
    return schema;
  }
  
  /**
   * Format a Zod error message
   * 
   * @param error Zod error
   * @param customErrorMessages Custom error messages
   * @returns Formatted error message
   */
  private formatErrorMessage(error: z.ZodIssue, customErrorMessages?: Record<string, string>): string {
    const field = error.path.join('.');
    
    // Check for custom message
    if (customErrorMessages && customErrorMessages[field]) {
      return customErrorMessages[field];
    }
    
    // Format based on error code
    switch (error.code) {
      case 'invalid_type':
        const expected = error.expected === 'null' 
          ? 'empty' 
          : error.expected === 'undefined' 
          ? 'undefined' 
          : `a ${error.expected}`;
        
        const received = error.received === 'null' 
          ? 'empty' 
          : error.received === 'undefined' 
          ? 'missing' 
          : `a ${error.received}`;
        
        return `Field "${field}" should be ${expected}, but got ${received}`;
      
      case 'invalid_string':
        return `Field "${field}" has an invalid string format`;
      
      case 'too_small':
        const what = error.type === 'string' 
          ? 'characters' 
          : error.type === 'array' 
          ? 'items' 
          : 'value';
        
        return `Field "${field}" must contain at least ${error.minimum} ${what}`;
      
      case 'too_big':
        const whatBig = error.type === 'string' 
          ? 'characters' 
          : error.type === 'array' 
          ? 'items' 
          : 'value';
        
        return `Field "${field}" must contain at most ${error.maximum} ${whatBig}`;
      
      case 'invalid_enum_value':
        return `Field "${field}" must be one of ${error.options.join(', ')}`;
      
      default:
        return error.message || `Field "${field}" is invalid`;
    }
  }
  
  /**
   * Map Zod error code to validation type
   * 
   * @param code Zod error code
   * @returns Validation type
   */
  private mapErrorCodeToValidationType(code: z.ZodIssueCode): string {
    switch (code) {
      case 'invalid_type':
        return 'type';
      case 'invalid_literal':
      case 'invalid_enum_value':
        return 'enum';
      case 'invalid_string':
        return 'format';
      case 'too_small':
      case 'too_big':
        return 'range';
      case 'invalid_date':
        return 'date';
      case 'custom':
        return 'custom';
      default:
        return 'custom';
    }
  }
  
  /**
   * Create an empty validation result
   */
  private createEmptyResult(): SchemaValidationResult {
    return {
      valid: true,
      errors: [],
      warnings: [],
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      stats: {
        completeness: {
          score: 1,
          missingFields: {},
        },
        accuracy: {
          score: 1,
          invalidValues: {},
        },
        consistency: {
          score: 1,
          inconsistentValues: {},
        },
      },
      fieldValidation: {},
    };
  }
  
  /**
   * Calculate validation statistics
   * 
   * @param stats Statistics object to update
   * @param totalRecords Total number of records
   */
  private calculateStats(stats: ValidationStats, totalRecords: number): void {
    if (totalRecords === 0) {
      stats.completeness.score = 1;
      stats.accuracy.score = 1;
      stats.consistency.score = 1;
      return;
    }
    
    // Calculate completeness score
    const totalMissingFields = Object.values(stats.completeness.missingFields).reduce((sum, count) => sum + count, 0);
    stats.completeness.score = Math.max(0, 1 - (totalMissingFields / (totalRecords * Object.keys(stats.completeness.missingFields).length || 1)));
    
    // Calculate accuracy score
    const totalInvalidValues = Object.values(stats.accuracy.invalidValues).reduce((sum, count) => sum + count, 0);
    stats.accuracy.score = Math.max(0, 1 - (totalInvalidValues / (totalRecords * Object.keys(stats.accuracy.invalidValues).length || 1)));
    
    // Calculate consistency score
    const totalInconsistentValues = Object.values(stats.consistency.inconsistentValues).reduce((sum, count) => sum + count, 0);
    stats.consistency.score = Math.max(0, 1 - (totalInconsistentValues / (totalRecords * Object.keys(stats.consistency.inconsistentValues).length || 1)));
  }
  
  /**
   * Get field metadata for a schema
   * 
   * @param schemaName Schema name
   * @returns Field metadata
   */
  public getFieldMetadata(schemaName: SchemaName): Record<string, { 
    type: string; 
    required: boolean;
    description?: string;
  }> {
    const metadata: Record<string, { type: string; required: boolean; description?: string }> = {};
    
    // Get the schema
    const zodSchema = this.getSchema(schemaName);
    
    // Extract shape information where possible
    // This is a simplified version as fully parsing Zod schema structure
    // requires more advanced traversal
    
    let shape: Record<string, any> = {};
    
    // Try to extract shape from the schema
    if ((zodSchema as any)._def?.shape) {
      shape = (zodSchema as any)._def.shape;
    }
    
    // Process shape information
    Object.entries(shape).forEach(([key, value]) => {
      let type = 'unknown';
      let required = true;
      
      // Try to determine type and if required
      if (value && (value as any)._def) {
        const def = (value as any)._def;
        
        if (def.typeName === 'ZodString') {
          type = 'string';
        } else if (def.typeName === 'ZodNumber') {
          type = 'number';
        } else if (def.typeName === 'ZodBoolean') {
          type = 'boolean';
        } else if (def.typeName === 'ZodArray') {
          type = 'array';
        } else if (def.typeName === 'ZodObject') {
          type = 'object';
        } else if (def.typeName === 'ZodDate') {
          type = 'date';
        } else if (def.typeName === 'ZodEnum') {
          type = 'enum';
        } else if (def.typeName === 'ZodNullable' || def.typeName === 'ZodOptional') {
          required = false;
          
          // Try to determine inner type
          const innerType = def.innerType?._def?.typeName;
          if (innerType) {
            type = innerType.replace('Zod', '').toLowerCase();
          }
        }
      }
      
      metadata[key] = {
        type,
        required,
        description: type === 'enum' ? `One of: ${(value as any)._def?.values?.join(', ')}` : undefined,
      };
    });
    
    return metadata;
  }
}

// Export singleton instance
export const schemaValidationService = new SchemaValidationService();