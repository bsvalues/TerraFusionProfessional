import { 
  TransformationRule, 
  FilterConfig, 
  MapConfig, 
  JoinConfig, 
  AggregateConfig, 
  ValidationConfig, 
  EnrichmentConfig, 
  CustomConfig,
  FilterOperator,
  FilterLogic,
  TransformationType,
  ExtendedFilterOperator
} from './ETLTypes';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * Transformation result interface
 */
export interface TransformationResult {
  /** Whether the transformation was successful */
  success: boolean;
  
  /** Error message */
  error?: string;
  
  /** Transformed data */
  data: any[];
  
  /** Number of records rejected */
  rejected: number;
  
  /** Rejected records */
  rejectedRecords?: any[];
  
  /** Error messages for rejected records */
  errorMessages?: ErrorMessage[];
}

/**
 * Error message interface
 */
export interface ErrorMessage {
  /** Record ID or index */
  recordId: string | number;
  
  /** Error message */
  message: string;
  
  /** Error details */
  details?: Record<string, any>;
}

/**
 * Transformation Service
 * 
 * This service is responsible for applying transformations to data.
 */
class TransformationService {
  /**
   * Apply a transformation to data
   */
  applyTransformation(rule: TransformationRule, data: any[]): TransformationResult {
    try {
      if (!rule.enabled) {
        return {
          success: true,
          data,
          rejected: 0,
          errorMessages: []
        };
      }
      
      switch (rule.type) {
        case TransformationType.FILTER:
          return this.applyFilter(rule.config as FilterConfig, data);
          
        case TransformationType.MAP:
          return this.applyMap(rule.config as MapConfig, data);
          
        case TransformationType.JOIN:
          return this.applyJoin(rule.config as JoinConfig, data);
          
        case TransformationType.AGGREGATE:
          return this.applyAggregate(rule.config as AggregateConfig, data);
          
        case TransformationType.VALIDATE:
          return this.applyValidation(rule.config as ValidationConfig, data);
          
        case TransformationType.ENRICH:
          return this.applyEnrichment(rule.config as EnrichmentConfig, data);
          
        case TransformationType.CUSTOM:
          return this.applyCustom(rule.config as CustomConfig, data);
          
        default:
          return {
            success: false,
            error: `Unknown transformation type: ${rule.type}`,
            data: [],
            rejected: data.length,
            errorMessages: [
              {
                recordId: 'all',
                message: `Unknown transformation type: ${rule.type}`
              }
            ]
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.TRANSFORMATION,
        title: `Transformation Error: ${rule.name}`,
        message: `Error applying transformation "${rule.name}": ${errorMessage}`,
        source: 'transformation-service',
        relatedEntityId: rule.id
      });
      
      return {
        success: false,
        error: errorMessage,
        data: [],
        rejected: data.length,
        errorMessages: [
          {
            recordId: 'all',
            message: errorMessage
          }
        ]
      };
    }
  }
  
  /**
   * Apply filter transformation
   */
  private applyFilter(config: FilterConfig, data: any[]): TransformationResult {
    try {
      const filteredData = data.filter(record => this.evaluateFilterConditions(record, config));
      
      return {
        success: true,
        data: filteredData,
        rejected: data.length - filteredData.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: `Filter error: ${errorMessage}`,
        data: [],
        rejected: data.length,
        errorMessages: [
          {
            recordId: 'all',
            message: `Filter error: ${errorMessage}`
          }
        ]
      };
    }
  }
  
  /**
   * Evaluate filter conditions for a record
   */
  private evaluateFilterConditions(record: any, config: FilterConfig): boolean {
    const { conditions, logic } = config;
    
    if (conditions.length === 0) {
      return true;
    }
    
    const results = conditions.map(condition => this.evaluateCondition(record, condition));
    
    return logic === FilterLogic.AND
      ? results.every(Boolean)
      : results.some(Boolean);
  }
  
  /**
   * Evaluate a single filter condition
   */
  private evaluateCondition(record: any, condition: { field: string; operator: FilterOperator; value: any }): boolean {
    const { field, operator, value } = condition;
    const fieldValue = record[field];
    
    if (fieldValue === undefined) {
      return operator === FilterOperator.IS_NULL;
    }
    
    switch (operator) {
      case FilterOperator.EQUALS:
        return fieldValue === value;
        
      case FilterOperator.NOT_EQUALS:
        return fieldValue !== value;
        
      case FilterOperator.GREATER_THAN:
        return fieldValue > value;
        
      case FilterOperator.LESS_THAN:
        return fieldValue < value;
        
      case FilterOperator.GREATER_THAN_OR_EQUALS:
        return fieldValue >= value;
        
      case FilterOperator.LESS_THAN_OR_EQUALS:
        return fieldValue <= value;
        
      case FilterOperator.IN:
        return Array.isArray(value) && value.includes(fieldValue);
        
      case FilterOperator.NOT_IN:
        return Array.isArray(value) && !value.includes(fieldValue);
        
      case FilterOperator.CONTAINS:
        return String(fieldValue).includes(String(value));
        
      case ExtendedFilterOperator.NOT_CONTAINS:
        return !String(fieldValue).includes(String(value));
        
      case ExtendedFilterOperator.STARTS_WITH:
        return String(fieldValue).startsWith(String(value));
        
      case ExtendedFilterOperator.ENDS_WITH:
        return String(fieldValue).endsWith(String(value));
        
      case ExtendedFilterOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;
        
      case ExtendedFilterOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;
        
      case FilterOperator.REGEX:
        return new RegExp(value).test(String(fieldValue));
        
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }
  
  /**
   * Apply map transformation
   */
  private applyMap(config: MapConfig, data: any[]): TransformationResult {
    try {
      const { mappings, includeOriginal } = config;
      
      const mappedData = data.map(record => {
        const mappedRecord: Record<string, any> = includeOriginal ? { ...record } : {};
        
        for (const { source, target } of mappings) {
          if (source in record) {
            mappedRecord[target] = record[source];
          }
        }
        
        return mappedRecord;
      });
      
      return {
        success: true,
        data: mappedData,
        rejected: 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: `Map error: ${errorMessage}`,
        data: [],
        rejected: data.length,
        errorMessages: [
          {
            recordId: 'all',
            message: `Map error: ${errorMessage}`
          }
        ]
      };
    }
  }
  
  /**
   * Apply join transformation
   */
  private applyJoin(config: JoinConfig, data: any[]): TransformationResult {
    try {
      // In a real app, we would perform an actual join with another dataset
      // For now, we'll just return the original data
      
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.TRANSFORMATION,
        title: 'Join Transformation',
        message: `Join transformation with right dataset "${config.rightDataset}" is not implemented in this demo`,
        source: 'transformation-service'
      });
      
      return {
        success: true,
        data,
        rejected: 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: `Join error: ${errorMessage}`,
        data: [],
        rejected: data.length,
        errorMessages: [
          {
            recordId: 'all',
            message: `Join error: ${errorMessage}`
          }
        ]
      };
    }
  }
  
  /**
   * Apply aggregate transformation
   */
  private applyAggregate(config: AggregateConfig, data: any[]): TransformationResult {
    try {
      const { groupBy, aggregations } = config;
      
      // Group data by groupBy fields
      const groups: Record<string, any[]> = {};
      
      for (const record of data) {
        const groupKey = groupBy.map(field => record[field]).join('|');
        
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        
        groups[groupKey].push(record);
      }
      
      // Apply aggregations to each group
      const result = Object.keys(groups).map(groupKey => {
        const group = groups[groupKey];
        const resultRecord: Record<string, any> = {};
        
        // Add group by fields to result
        for (let i = 0; i < groupBy.length; i++) {
          const field = groupBy[i];
          resultRecord[field] = group[0][field];
        }
        
        // Apply aggregations
        for (const agg of aggregations) {
          const { field, function: func, as } = agg;
          
          switch (func) {
            case 'COUNT':
              resultRecord[as] = group.length;
              break;
              
            case 'SUM':
              resultRecord[as] = group.reduce((sum, record) => sum + (record[field] || 0), 0);
              break;
              
            case 'AVG':
              resultRecord[as] = group.reduce((sum, record) => sum + (record[field] || 0), 0) / group.length;
              break;
              
            case 'MIN':
              resultRecord[as] = Math.min(...group.map(record => record[field] || 0));
              break;
              
            case 'MAX':
              resultRecord[as] = Math.max(...group.map(record => record[field] || 0));
              break;
              
            case 'FIRST':
              resultRecord[as] = group[0][field];
              break;
              
            case 'LAST':
              resultRecord[as] = group[group.length - 1][field];
              break;
              
            case 'ARRAY_AGG':
              resultRecord[as] = group.map(record => record[field]);
              break;
          }
        }
        
        return resultRecord;
      });
      
      return {
        success: true,
        data: result,
        rejected: 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: `Aggregate error: ${errorMessage}`,
        data: [],
        rejected: data.length,
        errorMessages: [
          {
            recordId: 'all',
            message: `Aggregate error: ${errorMessage}`
          }
        ]
      };
    }
  }
  
  /**
   * Apply validation transformation
   */
  private applyValidation(config: ValidationConfig, data: any[]): TransformationResult {
    try {
      const { validations, failOnError } = config;
      
      const result = [];
      const rejectedRecords = [];
      const errorMessages: ErrorMessage[] = [];
      
      for (const record of data) {
        const recordErrors: { field: string; message: string }[] = [];
        
        for (const validation of validations) {
          const { field, type, params, message } = validation;
          const value = record[field];
          
          let isValid = true;
          
          switch (type) {
            case 'REQUIRED':
              isValid = value !== undefined && value !== null && value !== '';
              break;
              
            case 'EMAIL':
              isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
              break;
              
            case 'URL':
              try {
                new URL(String(value || ''));
                isValid = true;
              } catch {
                isValid = false;
              }
              break;
              
            case 'NUMBER':
              isValid = !isNaN(Number(value));
              break;
              
            case 'INTEGER':
              isValid = Number.isInteger(Number(value));
              break;
              
            case 'FLOAT':
              isValid = !isNaN(Number(value)) && !Number.isInteger(Number(value));
              break;
              
            case 'DATE':
              isValid = !isNaN(Date.parse(String(value || '')));
              break;
              
            case 'REGEX':
              if (params) {
                isValid = new RegExp(params).test(String(value || ''));
              } else {
                isValid = true; // No pattern to test against
              }
              break;
              
            case 'CUSTOM':
              // In a real app, we would execute a custom validation function
              isValid = true;
              break;
          }
          
          if (!isValid) {
            recordErrors.push({ field, message });
          }
        }
        
        if (recordErrors.length > 0) {
          const recordId = record.id || data.indexOf(record);
          
          errorMessages.push({
            recordId,
            message: `Validation failed for record ${recordId}`,
            details: { errors: recordErrors }
          });
          
          rejectedRecords.push(record);
          
          if (!failOnError) {
            result.push(record);
          }
        } else {
          result.push(record);
        }
      }
      
      const rejected = rejectedRecords.length;
      
      if (rejected > 0) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.VALIDATION,
          title: 'Validation Issues',
          message: `${rejected} records failed validation${failOnError ? ' and were rejected' : ''}`,
          source: 'transformation-service'
        });
      }
      
      return {
        success: true,
        data: result,
        rejected,
        rejectedRecords: failOnError ? rejectedRecords : [],
        errorMessages
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: `Validation error: ${errorMessage}`,
        data: [],
        rejected: data.length,
        errorMessages: [
          {
            recordId: 'all',
            message: `Validation error: ${errorMessage}`
          }
        ]
      };
    }
  }
  
  /**
   * Apply enrichment transformation
   */
  private applyEnrichment(config: EnrichmentConfig, data: any[]): TransformationResult {
    try {
      // In a real app, we would perform actual enrichment with external data
      // For now, we'll just return the original data with mock enrichment
      
      const { type, fields } = config;
      
      const result = data.map(record => {
        const enrichedRecord = { ...record };
        
        for (const { source, target } of fields) {
          const sourceValue = record[source];
          
          switch (type) {
            case 'LOOKUP':
              // Mock lookup enrichment
              enrichedRecord[target] = `LOOKUP_${sourceValue}`;
              break;
              
            case 'GEOCODE':
              // Mock geocode enrichment
              if (typeof sourceValue === 'string' && sourceValue.includes('address')) {
                enrichedRecord[`${target}_lat`] = 37.7749;
                enrichedRecord[`${target}_lng`] = -122.4194;
              }
              break;
              
            case 'TRANSLATE':
              // Mock translation enrichment
              if (typeof sourceValue === 'string') {
                enrichedRecord[target] = `TRANSLATED_${sourceValue}`;
              }
              break;
              
            case 'CUSTOM':
              // Mock custom enrichment
              enrichedRecord[target] = `CUSTOM_${sourceValue}`;
              break;
          }
        }
        
        return enrichedRecord;
      });
      
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.TRANSFORMATION,
        title: 'Enrichment Transformation',
        message: `Enrichment transformation of type "${type}" is using mock data in this demo`,
        source: 'transformation-service'
      });
      
      return {
        success: true,
        data: result,
        rejected: 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: `Enrichment error: ${errorMessage}`,
        data: [],
        rejected: data.length,
        errorMessages: [
          {
            recordId: 'all',
            message: `Enrichment error: ${errorMessage}`
          }
        ]
      };
    }
  }
  
  /**
   * Apply custom transformation
   */
  private applyCustom(config: CustomConfig, data: any[]): TransformationResult {
    try {
      // In a real app, we would execute a custom transformation function
      // For now, we'll just return the original data
      
      const functionName = config.function || 'custom';
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.TRANSFORMATION,
        title: 'Custom Transformation',
        message: `Custom transformation function "${functionName}" is not implemented in this demo`,
        source: 'transformation-service'
      });
      
      return {
        success: true,
        data,
        rejected: 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: `Custom transformation error: ${errorMessage}`,
        data: [],
        rejected: data.length,
        errorMessages: [
          {
            recordId: 'all',
            message: `Custom transformation error: ${errorMessage}`
          }
        ]
      };
    }
  }
}

// Export singleton instance
export const transformationService = new TransformationService();