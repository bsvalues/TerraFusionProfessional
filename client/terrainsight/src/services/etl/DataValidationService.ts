/**
 * DataValidationService.ts
 * 
 * Service for validating data quality in ETL pipelines
 */

/**
 * Validation rule
 */
export interface ValidationRule {
  field: string;
  type: ValidationRuleType;
  config?: any;
  errorMessage?: string;
  warningOnly?: boolean;
}

/**
 * Validation rule type
 */
export enum ValidationRuleType {
  REQUIRED = 'required',
  TYPE = 'type',
  RANGE = 'range',
  REGEX = 'regex',
  ENUM = 'enum',
  UNIQUE = 'unique',
  CUSTOM = 'custom',
  RELATIONSHIP = 'relationship',
  FORMAT = 'format',
  CONSISTENCY = 'consistency'
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  stats: ValidationStats;
}

/**
 * Validation error
 */
export interface ValidationError {
  record: any;
  field: string;
  rule: ValidationRule;
  message: string;
  recordIndex: number;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  record: any;
  field: string;
  rule: ValidationRule;
  message: string;
  recordIndex: number;
}

/**
 * Validation statistics
 */
export interface ValidationStats {
  completeness: {
    score: number;
    missingFields: Record<string, number>;
  };
  accuracy: {
    score: number;
    invalidValues: Record<string, number>;
  };
  consistency: {
    score: number;
    inconsistentValues: Record<string, number>;
  };
}

/**
 * Data validation service
 */
export class DataValidationService {
  /**
   * Validate data against a set of rules
   */
  public validate(data: any[], rules: ValidationRule[]): ValidationResult {
    if (!data || data.length === 0) {
      return this.createEmptyResult();
    }
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const stats = this.initializeStats(rules);
    
    // Preprocess data for unique validation
    const uniqueFields = rules
      .filter(rule => rule.type === ValidationRuleType.UNIQUE)
      .map(rule => rule.field);
    
    const fieldValues: Record<string, Set<any>> = {};
    uniqueFields.forEach(field => {
      fieldValues[field] = new Set();
    });
    
    // Validate each record
    let validRecords = 0;
    let invalidRecords = 0;
    
    data.forEach((record, recordIndex) => {
      let recordValid = true;
      
      for (const rule of rules) {
        const { field, type, config, errorMessage, warningOnly } = rule;
        const value = record[field];
        
        let isValid = true;
        let message = errorMessage || `Validation failed for field "${field}"`;
        
        // Validate based on rule type
        switch (type) {
          case ValidationRuleType.REQUIRED:
            isValid = value !== undefined && value !== null && value !== '';
            if (!isValid) {
              message = errorMessage || `Field "${field}" is required`;
              stats.completeness.missingFields[field] = (stats.completeness.missingFields[field] || 0) + 1;
            }
            break;
          
          case ValidationRuleType.TYPE:
            if (value !== undefined && value !== null) {
              const expectedType = config?.type;
              if (expectedType) {
                isValid = this.validateType(value, expectedType);
                if (!isValid) {
                  message = errorMessage || `Field "${field}" must be of type ${expectedType}`;
                  stats.accuracy.invalidValues[field] = (stats.accuracy.invalidValues[field] || 0) + 1;
                }
              }
            }
            break;
          
          case ValidationRuleType.RANGE:
            if (value !== undefined && value !== null) {
              const min = config?.min;
              const max = config?.max;
              
              if (min !== undefined && max !== undefined) {
                isValid = value >= min && value <= max;
                message = errorMessage || `Field "${field}" must be between ${min} and ${max}`;
              } else if (min !== undefined) {
                isValid = value >= min;
                message = errorMessage || `Field "${field}" must be at least ${min}`;
              } else if (max !== undefined) {
                isValid = value <= max;
                message = errorMessage || `Field "${field}" must be at most ${max}`;
              }
              
              if (!isValid) {
                stats.accuracy.invalidValues[field] = (stats.accuracy.invalidValues[field] || 0) + 1;
              }
            }
            break;
          
          case ValidationRuleType.REGEX:
            if (value !== undefined && value !== null && typeof value === 'string') {
              const pattern = config?.pattern;
              if (pattern) {
                try {
                  const regex = new RegExp(pattern);
                  isValid = regex.test(value);
                  if (!isValid) {
                    message = errorMessage || `Field "${field}" does not match the required pattern`;
                    stats.accuracy.invalidValues[field] = (stats.accuracy.invalidValues[field] || 0) + 1;
                  }
                } catch (e) {
                  console.error(`Invalid regex pattern for field "${field}":`, e);
                  isValid = true; // Skip validation if pattern is invalid
                }
              }
            }
            break;
          
          case ValidationRuleType.ENUM:
            if (value !== undefined && value !== null) {
              const allowedValues = config?.values;
              if (allowedValues && Array.isArray(allowedValues)) {
                isValid = allowedValues.includes(value);
                if (!isValid) {
                  message = errorMessage || `Field "${field}" must be one of: ${allowedValues.join(', ')}`;
                  stats.accuracy.invalidValues[field] = (stats.accuracy.invalidValues[field] || 0) + 1;
                }
              }
            }
            break;
          
          case ValidationRuleType.UNIQUE:
            if (value !== undefined && value !== null) {
              // Check if value is already in the set
              if (fieldValues[field].has(JSON.stringify(value))) {
                isValid = false;
                message = errorMessage || `Field "${field}" must be unique`;
                stats.consistency.inconsistentValues[field] = (stats.consistency.inconsistentValues[field] || 0) + 1;
              } else {
                fieldValues[field].add(JSON.stringify(value));
              }
            }
            break;
          
          case ValidationRuleType.FORMAT:
            if (value !== undefined && value !== null && typeof value === 'string') {
              const format = config?.format;
              if (format) {
                isValid = this.validateFormat(value, format);
                if (!isValid) {
                  message = errorMessage || `Field "${field}" must be in ${format} format`;
                  stats.accuracy.invalidValues[field] = (stats.accuracy.invalidValues[field] || 0) + 1;
                }
              }
            }
            break;
          
          case ValidationRuleType.RELATIONSHIP:
            if (value !== undefined && value !== null) {
              const relationData = config?.data;
              const relationField = config?.field || 'id';
              
              if (relationData && Array.isArray(relationData)) {
                isValid = relationData.some(item => item[relationField] === value);
                if (!isValid) {
                  message = errorMessage || `Field "${field}" must reference a valid ${config?.entityName || 'entity'}`;
                  stats.consistency.inconsistentValues[field] = (stats.consistency.inconsistentValues[field] || 0) + 1;
                }
              }
            }
            break;
          
          case ValidationRuleType.CONSISTENCY:
            if (config?.dependsOn && config?.condition) {
              const dependentField = config.dependsOn;
              const dependentValue = record[dependentField];
              
              isValid = this.evaluateConsistencyCondition(value, dependentValue, config.condition);
              if (!isValid) {
                message = errorMessage || `Field "${field}" is inconsistent with "${dependentField}"`;
                stats.consistency.inconsistentValues[field] = (stats.consistency.inconsistentValues[field] || 0) + 1;
              }
            }
            break;
          
          case ValidationRuleType.CUSTOM:
            if (config?.validate && typeof config.validate === 'function') {
              try {
                isValid = config.validate(value, record);
                if (!isValid) {
                  message = errorMessage || `Field "${field}" failed custom validation`;
                  stats.accuracy.invalidValues[field] = (stats.accuracy.invalidValues[field] || 0) + 1;
                }
              } catch (e) {
                console.error(`Error in custom validation for field "${field}":`, e);
                isValid = false;
                message = `Error in custom validation: ${e instanceof Error ? e.message : String(e)}`;
              }
            }
            break;
        }
        
        // Record validation result
        if (!isValid) {
          const validationIssue = {
            record,
            field,
            rule,
            message,
            recordIndex
          };
          
          if (warningOnly) {
            warnings.push(validationIssue);
          } else {
            errors.push(validationIssue);
            recordValid = false;
          }
        }
      }
      
      // Count valid/invalid records
      if (recordValid) {
        validRecords++;
      } else {
        invalidRecords++;
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
      stats
    };
  }
  
  /**
   * Create an empty validation result
   */
  private createEmptyResult(): ValidationResult {
    return {
      valid: true,
      errors: [],
      warnings: [],
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      stats: {
        completeness: {
          score: 1, // 100% complete if no data
          missingFields: {}
        },
        accuracy: {
          score: 1, // 100% accurate if no data
          invalidValues: {}
        },
        consistency: {
          score: 1, // 100% consistent if no data
          inconsistentValues: {}
        }
      }
    };
  }
  
  /**
   * Initialize validation statistics
   */
  private initializeStats(rules: ValidationRule[]): ValidationStats {
    const fields = new Set<string>();
    rules.forEach(rule => fields.add(rule.field));
    
    const stats: ValidationStats = {
      completeness: {
        score: 0,
        missingFields: {}
      },
      accuracy: {
        score: 0,
        invalidValues: {}
      },
      consistency: {
        score: 0,
        inconsistentValues: {}
      }
    };
    
    // Initialize counters for each field
    fields.forEach(field => {
      stats.completeness.missingFields[field] = 0;
      stats.accuracy.invalidValues[field] = 0;
      stats.consistency.inconsistentValues[field] = 0;
    });
    
    return stats;
  }
  
  /**
   * Calculate validation statistics
   */
  private calculateStats(stats: ValidationStats, totalRecords: number): void {
    if (totalRecords === 0) {
      stats.completeness.score = 1;
      stats.accuracy.score = 1;
      stats.consistency.score = 1;
      return;
    }
    
    // Calculate completeness score
    const totalCompleteness = Object.values(stats.completeness.missingFields).reduce((sum, count) => sum + count, 0);
    const fields = Object.keys(stats.completeness.missingFields).length;
    
    stats.completeness.score = 1 - (totalCompleteness / (totalRecords * fields));
    
    // Calculate accuracy score
    const totalInaccurate = Object.values(stats.accuracy.invalidValues).reduce((sum, count) => sum + count, 0);
    
    stats.accuracy.score = 1 - (totalInaccurate / totalRecords);
    
    // Calculate consistency score
    const totalInconsistent = Object.values(stats.consistency.inconsistentValues).reduce((sum, count) => sum + count, 0);
    
    stats.consistency.score = 1 - (totalInconsistent / totalRecords);
    
    // Ensure scores are between 0 and 1
    stats.completeness.score = Math.max(0, Math.min(1, stats.completeness.score));
    stats.accuracy.score = Math.max(0, Math.min(1, stats.accuracy.score));
    stats.consistency.score = Math.max(0, Math.min(1, stats.consistency.score));
  }
  
  /**
   * Validate a value's type
   */
  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      
      case 'boolean':
        return typeof value === 'boolean';
      
      case 'array':
        return Array.isArray(value);
      
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      
      case 'date':
        if (value instanceof Date) {
          return !isNaN(value.getTime());
        } else if (typeof value === 'string') {
          const date = new Date(value);
          return !isNaN(date.getTime());
        }
        return false;
      
      case 'integer':
        return typeof value === 'number' && Number.isInteger(value);
      
      case 'float':
      case 'decimal':
        return typeof value === 'number' && !Number.isInteger(value);
      
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      
      case 'url':
        if (typeof value !== 'string') return false;
        try {
          new URL(value);
          return true;
        } catch (e) {
          return false;
        }
      
      default:
        return true; // Unknown type, assume valid
    }
  }
  
  /**
   * Validate a string format
   */
  private validateFormat(value: string, format: string): boolean {
    switch (format.toLowerCase()) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      
      case 'phone':
        // Basic phone validation - adjust as needed
        return /^\+?[\d\s\-()]{7,}$/.test(value);
      
      case 'zip':
      case 'zipcode':
      case 'postal':
      case 'postalcode':
        // Basic postal code validation
        return /^[\d\-\s]{5,10}$/.test(value);
      
      case 'date':
        try {
          const date = new Date(value);
          return !isNaN(date.getTime());
        } catch (e) {
          return false;
        }
      
      case 'time':
        // Basic time format HH:MM or HH:MM:SS
        return /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.test(value);
      
      case 'datetime':
        try {
          const date = new Date(value);
          return !isNaN(date.getTime());
        } catch (e) {
          return false;
        }
      
      case 'url':
        try {
          new URL(value);
          return true;
        } catch (e) {
          return false;
        }
      
      case 'ip':
      case 'ipv4':
        // IPv4 validation
        return /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(value);
      
      case 'ipv6':
        // Basic IPv6 validation
        return /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/.test(value);
      
      case 'creditcard':
        // Basic credit card validation - remove spaces and verify length+checksum
        const stripped = value.replace(/\s+/g, '');
        if (!/^\d{13,19}$/.test(stripped)) return false;
        
        // Luhn algorithm
        let sum = 0;
        let double = false;
        for (let i = stripped.length - 1; i >= 0; i--) {
          let digit = parseInt(stripped.charAt(i), 10);
          if (double) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          sum += digit;
          double = !double;
        }
        return sum % 10 === 0;
      
      default:
        return true; // Unknown format, assume valid
    }
  }
  
  /**
   * Evaluate a consistency condition between two fields
   */
  private evaluateConsistencyCondition(value: any, dependentValue: any, condition: string): boolean {
    switch (condition) {
      case 'equals':
        return value === dependentValue;
      
      case 'notEquals':
        return value !== dependentValue;
      
      case 'greaterThan':
        return value > dependentValue;
      
      case 'lessThan':
        return value < dependentValue;
      
      case 'greaterThanOrEqual':
        return value >= dependentValue;
      
      case 'lessThanOrEqual':
        return value <= dependentValue;
      
      case 'bothExist':
        return value !== undefined && value !== null && 
               dependentValue !== undefined && dependentValue !== null;
      
      case 'neitherExist':
        return (value === undefined || value === null) && 
               (dependentValue === undefined || dependentValue === null);
      
      case 'oneExists':
        return (value !== undefined && value !== null) !== 
               (dependentValue !== undefined && dependentValue !== null);
      
      case 'contains':
        if (typeof value === 'string' && typeof dependentValue === 'string') {
          return value.includes(dependentValue);
        }
        return false;
      
      case 'startsWith':
        if (typeof value === 'string' && typeof dependentValue === 'string') {
          return value.startsWith(dependentValue);
        }
        return false;
      
      case 'endsWith':
        if (typeof value === 'string' && typeof dependentValue === 'string') {
          return value.endsWith(dependentValue);
        }
        return false;
      
      default:
        return true; // Unknown condition, assume valid
    }
  }
  
  /**
   * Generate a data quality analysis report
   */
  public generateQualityReport(data: any[], rules: ValidationRule[]): any {
    const validationResult = this.validate(data, rules);
    
    // Calculate overall scores
    const overallScore = (
      validationResult.stats.completeness.score +
      validationResult.stats.accuracy.score +
      validationResult.stats.consistency.score
    ) / 3;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(validationResult);
    
    return {
      ...validationResult,
      overallScore,
      recommendations,
      timestamp: new Date()
    };
  }
  
  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(result: ValidationResult): string[] {
    const recommendations: string[] = [];
    
    // Check completeness
    if (result.stats.completeness.score < 0.9) {
      const mostMissingFields = Object.entries(result.stats.completeness.missingFields)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      if (mostMissingFields.length > 0) {
        const fieldList = mostMissingFields
          .map(([field, count]) => `"${field}" (${count} records)`)
          .join(', ');
        
        recommendations.push(
          `Improve data completeness by addressing missing values in the following fields: ${fieldList}`
        );
      }
    }
    
    // Check accuracy
    if (result.stats.accuracy.score < 0.9) {
      const mostInvalidFields = Object.entries(result.stats.accuracy.invalidValues)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      if (mostInvalidFields.length > 0) {
        const fieldList = mostInvalidFields
          .map(([field, count]) => `"${field}" (${count} records)`)
          .join(', ');
        
        recommendations.push(
          `Improve data accuracy by fixing invalid values in the following fields: ${fieldList}`
        );
      }
    }
    
    // Check consistency
    if (result.stats.consistency.score < 0.9) {
      const mostInconsistentFields = Object.entries(result.stats.consistency.inconsistentValues)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      if (mostInconsistentFields.length > 0) {
        const fieldList = mostInconsistentFields
          .map(([field, count]) => `"${field}" (${count} records)`)
          .join(', ');
        
        recommendations.push(
          `Improve data consistency by addressing inconsistencies in the following fields: ${fieldList}`
        );
      }
    }
    
    // Add general recommendations
    if (result.errors.length > 0) {
      recommendations.push(
        `Address ${result.errors.length} validation errors to improve overall data quality.`
      );
    }
    
    if (result.warnings.length > 0) {
      recommendations.push(
        `Review ${result.warnings.length} data quality warnings that may affect analysis results.`
      );
    }
    
    // Default recommendation if no specific issues identified
    if (recommendations.length === 0) {
      recommendations.push(
        'Data quality is good. Consider adding more validation rules for deeper quality analysis.'
      );
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const dataValidationService = new DataValidationService();