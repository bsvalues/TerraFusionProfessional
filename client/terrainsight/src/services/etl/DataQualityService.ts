import { alertService, AlertCategory, AlertSeverity } from './AlertService';

/**
 * Data quality issue severity enum
 */
export enum DataQualityIssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Data quality issue interface
 */
export interface DataQualityIssue {
  /** Field name */
  field: string;
  
  /** Issue type */
  type: string;
  
  /** Issue description */
  description: string;
  
  /** Issue severity */
  severity: DataQualityIssueSeverity;
  
  /** Affected records count */
  recordCount: number;
  
  /** Affected record percentage */
  percentage: number;
  
  /** Example values */
  examples?: any[];
  
  /** Remediation suggestion */
  suggestion?: string;
}

/**
 * Field statistics interface
 */
export interface FieldStatistics {
  /** Field name */
  field: string;
  
  /** Number of records */
  count: number;
  
  /** Number of null values */
  nullCount: number;
  
  /** Null value percentage */
  nullPercentage: number;
  
  /** Number of missing values */
  missingCount: number;
  
  /** Missing value percentage */
  missingPercentage: number;
  
  /** Number of unique values */
  uniqueCount: number;
  
  /** Unique value percentage */
  uniquePercentage: number;
  
  /** Field data type */
  dataType: string;
  
  /** Min value (for numeric fields) */
  min?: number;
  
  /** Max value (for numeric fields) */
  max?: number;
  
  /** Average value (for numeric fields) */
  avg?: number;
  
  /** Median value (for numeric fields) */
  median?: number;
  
  /** Standard deviation (for numeric fields) */
  stdDev?: number;
  
  /** Min length (for string fields) */
  minLength?: number;
  
  /** Max length (for string fields) */
  maxLength?: number;
  
  /** Average length (for string fields) */
  avgLength?: number;
  
  /** Value distribution */
  distribution?: Record<string, number>;
  
  /** Top values */
  topValues?: { value: any; count: number; percentage: number }[];
  
  /** Pattern distribution */
  patternDistribution?: Record<string, number>;
}

/**
 * Data quality analysis options interface
 */
export interface DataQualityAnalysisOptions {
  /** Whether to check for null values */
  checkNull?: boolean;
  
  /** Whether to check for missing values */
  checkMissing?: boolean;
  
  /** Whether to check for duplicate values */
  checkDuplicates?: boolean;
  
  /** Whether to check for outliers */
  checkOutliers?: boolean;
  
  /** Whether to check for inconsistent formats */
  checkFormats?: boolean;
  
  /** Whether to check for value distributions */
  checkDistributions?: boolean;
  
  /** Maximum number of examples to collect */
  maxExamples?: number;
  
  /** Threshold for null percentage warning */
  nullThreshold?: number;
  
  /** Threshold for duplicate percentage warning */
  duplicateThreshold?: number;
  
  /** Number of standard deviations for outlier detection */
  outlierStdDevs?: number;
  
  /** Fields to exclude from analysis */
  excludeFields?: string[];
  
  /** Fields to include in analysis (if specified, only these fields are analyzed) */
  includeFields?: string[];
  
  /** Expected data types for fields */
  expectedTypes?: Record<string, string>;
  
  /** Expected format patterns for fields */
  expectedPatterns?: Record<string, RegExp>;
  
  /** Expected value ranges for fields */
  expectedRanges?: Record<string, { min?: number; max?: number }>;
}

/**
 * Data quality analysis result interface
 */
export interface DataQualityAnalysisResult {
  /** Analysis timestamp */
  timestamp: Date;
  
  /** Number of records analyzed */
  recordCount: number;
  
  /** Number of fields analyzed */
  fieldCount: number;
  
  /** Field statistics */
  fieldStats: Record<string, FieldStatistics>;
  
  /** Data quality issues */
  issues: DataQualityIssue[];
  
  /** Data quality score (0-100) */
  qualityScore: number;
  
  /** Completeness score (0-100) */
  completenessScore: number;
  
  /** Accuracy score (0-100) */
  accuracyScore: number;
  
  /** Consistency score (0-100) */
  consistencyScore: number;
  
  /** Uniqueness score (0-100) */
  uniquenessScore: number;
  
  /** Analysis options used */
  options: DataQualityAnalysisOptions;
  
  /** Summary of findings */
  summary: string;
  
  /** Recommended actions */
  recommendations: string[];
}

/**
 * Data Quality Service
 * 
 * This service is responsible for analyzing data quality.
 */
class DataQualityService {
  /**
   * Analyze data quality
   */
  analyzeData(
    data: any[],
    options: DataQualityAnalysisOptions = {}
  ): DataQualityAnalysisResult {
    const timestamp = new Date();
    const recordCount = data.length;
    const defaultOptions: DataQualityAnalysisOptions = {
      checkNull: true,
      checkMissing: true,
      checkDuplicates: true,
      checkOutliers: true,
      checkFormats: true,
      checkDistributions: true,
      maxExamples: 5,
      nullThreshold: 0.1, // 10%
      duplicateThreshold: 0.05, // 5%
      outlierStdDevs: 3
    };
    
    // Merge options with defaults
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Get all fields in the dataset
    const allFields = new Set<string>();
    data.forEach(record => {
      Object.keys(record).forEach(field => allFields.add(field));
    });
    
    // Filter fields if needed
    let fields = Array.from(allFields);
    
    if (mergedOptions.includeFields && mergedOptions.includeFields.length > 0) {
      fields = fields.filter(field => mergedOptions.includeFields!.includes(field));
    }
    
    if (mergedOptions.excludeFields && mergedOptions.excludeFields.length > 0) {
      fields = fields.filter(field => !mergedOptions.excludeFields!.includes(field));
    }
    
    const fieldCount = fields.length;
    const fieldStats: Record<string, FieldStatistics> = {};
    const issues: DataQualityIssue[] = [];
    
    // Calculate field statistics
    for (const field of fields) {
      fieldStats[field] = this.calculateFieldStatistics(data, field);
    }
    
    // Check for issues
    if (mergedOptions.checkNull) {
      this.checkNullValues(data, fields, fieldStats, issues, mergedOptions);
    }
    
    if (mergedOptions.checkMissing) {
      this.checkMissingValues(data, fields, fieldStats, issues, mergedOptions);
    }
    
    if (mergedOptions.checkDuplicates) {
      this.checkDuplicateValues(data, fields, fieldStats, issues, mergedOptions);
    }
    
    if (mergedOptions.checkOutliers) {
      this.checkOutliers(data, fields, fieldStats, issues, mergedOptions);
    }
    
    if (mergedOptions.checkFormats) {
      this.checkFormats(data, fields, fieldStats, issues, mergedOptions);
    }
    
    if (mergedOptions.expectedTypes) {
      this.checkExpectedTypes(data, fields, fieldStats, issues, mergedOptions);
    }
    
    if (mergedOptions.expectedRanges) {
      this.checkExpectedRanges(data, fields, fieldStats, issues, mergedOptions);
    }
    
    // Calculate scores
    const completenessScore = this.calculateCompletenessScore(fieldStats);
    const accuracyScore = this.calculateAccuracyScore(issues);
    const consistencyScore = this.calculateConsistencyScore(issues);
    const uniquenessScore = this.calculateUniquenessScore(fieldStats, issues);
    
    // Calculate overall quality score
    const qualityScore = Math.round(
      (completenessScore + accuracyScore + consistencyScore + uniquenessScore) / 4
    );
    
    // Generate summary and recommendations
    const summary = this.generateSummary(recordCount, fieldCount, issues, qualityScore);
    const recommendations = this.generateRecommendations(issues, fieldStats);
    
    // Send alerts for critical issues
    issues.forEach(issue => {
      if (issue.severity === DataQualityIssueSeverity.CRITICAL) {
        alertService.error(
          `Critical data quality issue: ${issue.description}`,
          `Data Quality: ${issue.field}`,
          {
            field: issue.field,
            type: issue.type,
            recordCount: issue.recordCount,
            percentage: issue.percentage
          }
        );
      }
    });
    
    return {
      timestamp,
      recordCount,
      fieldCount,
      fieldStats,
      issues,
      qualityScore,
      completenessScore,
      accuracyScore,
      consistencyScore,
      uniquenessScore,
      options: mergedOptions,
      summary,
      recommendations
    };
  }
  
  /**
   * Calculate statistics for a field
   */
  private calculateFieldStatistics(data: any[], field: string): FieldStatistics {
    const values = data.map(record => record[field]);
    const count = values.length;
    
    // Count null values
    const nullValues = values.filter(value => value === null || value === undefined);
    const nullCount = nullValues.length;
    const nullPercentage = (nullCount / count) * 100;
    
    // Count missing values (empty strings, empty arrays, empty objects)
    const missingValues = values.filter(
      value => 
        value === '' || 
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && value !== null && Object.keys(value).length === 0)
    );
    const missingCount = missingValues.length;
    const missingPercentage = (missingCount / count) * 100;
    
    // Count unique values
    const nonNullValues = values.filter(value => value !== null && value !== undefined);
    const uniqueValues = new Set(nonNullValues.map(value => 
      typeof value === 'object' ? JSON.stringify(value) : value
    ));
    const uniqueCount = uniqueValues.size;
    const uniquePercentage = nonNullValues.length > 0 
      ? (uniqueCount / nonNullValues.length) * 100 
      : 0;
    
    // Determine data type
    const dataType = this.determineDataType(nonNullValues);
    
    // Calculate numeric statistics if appropriate
    let min: number | undefined;
    let max: number | undefined;
    let avg: number | undefined;
    let median: number | undefined;
    let stdDev: number | undefined;
    
    if (dataType === 'number' && nonNullValues.length > 0) {
      const numericValues = nonNullValues.map(Number);
      min = Math.min(...numericValues);
      max = Math.max(...numericValues);
      avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      
      // Calculate median
      const sorted = [...numericValues].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      median = sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
      
      // Calculate standard deviation - with TypeScript safety
      // We know avg is defined here since we've checked numericValues.length > 0
      const avgValue = avg!; // Non-null assertion is safe here
      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / numericValues.length;
      stdDev = Math.sqrt(variance);
    }
    
    // Calculate string statistics if appropriate
    let minLength: number | undefined;
    let maxLength: number | undefined;
    let avgLength: number | undefined;
    
    if (dataType === 'string') {
      const stringValues = nonNullValues.map(String);
      const lengths = stringValues.map(str => str.length);
      minLength = Math.min(...lengths);
      maxLength = Math.max(...lengths);
      avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    }
    
    // Calculate value distribution
    const distribution: Record<string, number> = {};
    
    for (const value of values) {
      const key = value === null || value === undefined
        ? 'null'
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
      
      distribution[key] = (distribution[key] || 0) + 1;
    }
    
    // Calculate top values
    const topValues = Object.entries(distribution)
      .map(([value, count]) => ({
        value: value === 'null' ? null : value,
        count,
        percentage: (count / count) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      field,
      count,
      nullCount,
      nullPercentage,
      missingCount,
      missingPercentage,
      uniqueCount,
      uniquePercentage,
      dataType,
      min,
      max,
      avg,
      median,
      stdDev,
      minLength,
      maxLength,
      avgLength,
      distribution,
      topValues
    };
  }
  
  /**
   * Determine data type of values
   */
  private determineDataType(values: any[]): string {
    if (values.length === 0) {
      return 'unknown';
    }
    
    // Check if all values are numbers
    if (values.every(value => typeof value === 'number' || !isNaN(Number(value)))) {
      return 'number';
    }
    
    // Check if all values are booleans
    if (values.every(value => typeof value === 'boolean' || value === 'true' || value === 'false')) {
      return 'boolean';
    }
    
    // Check if all values are dates
    if (values.every(value => value instanceof Date || !isNaN(Date.parse(String(value))))) {
      return 'date';
    }
    
    // Check if all values are arrays
    if (values.every(value => Array.isArray(value))) {
      return 'array';
    }
    
    // Check if all values are objects
    if (values.every(value => typeof value === 'object' && !Array.isArray(value) && value !== null)) {
      return 'object';
    }
    
    // Default to string
    return 'string';
  }
  
  /**
   * Check for null values
   */
  private checkNullValues(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    const nullThreshold = options.nullThreshold || 0.1; // 10%
    
    for (const field of fields) {
      const stats = fieldStats[field];
      
      if (stats.nullPercentage > nullThreshold * 100) {
        // Determine severity based on null percentage
        let severity: DataQualityIssueSeverity;
        
        if (stats.nullPercentage >= 50) {
          severity = DataQualityIssueSeverity.CRITICAL;
        } else if (stats.nullPercentage >= 25) {
          severity = DataQualityIssueSeverity.HIGH;
        } else if (stats.nullPercentage >= 10) {
          severity = DataQualityIssueSeverity.MEDIUM;
        } else {
          severity = DataQualityIssueSeverity.LOW;
        }
        
        issues.push({
          field,
          type: 'null_values',
          description: `Field contains ${stats.nullPercentage.toFixed(2)}% null values`,
          severity,
          recordCount: stats.nullCount,
          percentage: stats.nullPercentage,
          suggestion: 'Consider filling null values with defaults or removing records with null values'
        });
      }
    }
  }
  
  /**
   * Check for missing values
   */
  private checkMissingValues(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    for (const field of fields) {
      const stats = fieldStats[field];
      
      if (stats.missingPercentage > 0) {
        // Determine severity based on missing percentage
        let severity: DataQualityIssueSeverity;
        
        if (stats.missingPercentage >= 50) {
          severity = DataQualityIssueSeverity.CRITICAL;
        } else if (stats.missingPercentage >= 25) {
          severity = DataQualityIssueSeverity.HIGH;
        } else if (stats.missingPercentage >= 10) {
          severity = DataQualityIssueSeverity.MEDIUM;
        } else {
          severity = DataQualityIssueSeverity.LOW;
        }
        
        // Find example records with missing values
        const examples = data
          .filter(record => 
            record[field] === '' || 
            (Array.isArray(record[field]) && record[field].length === 0) ||
            (typeof record[field] === 'object' && record[field] !== null && Object.keys(record[field]).length === 0)
          )
          .slice(0, options.maxExamples || 5);
        
        issues.push({
          field,
          type: 'missing_values',
          description: `Field contains ${stats.missingPercentage.toFixed(2)}% missing values (empty strings, empty arrays, or empty objects)`,
          severity,
          recordCount: stats.missingCount,
          percentage: stats.missingPercentage,
          examples,
          suggestion: 'Consider filling missing values with defaults or removing records with missing values'
        });
      }
    }
  }
  
  /**
   * Check for duplicate values
   */
  private checkDuplicateValues(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    const duplicateThreshold = options.duplicateThreshold || 0.05; // 5%
    
    for (const field of fields) {
      const stats = fieldStats[field];
      
      // Skip fields with all unique values
      if (stats.uniqueCount === stats.count - stats.nullCount) {
        continue;
      }
      
      // Count duplicates
      const duplicateCount = stats.count - stats.nullCount - stats.uniqueCount;
      const duplicatePercentage = (duplicateCount / (stats.count - stats.nullCount)) * 100;
      
      if (duplicatePercentage > duplicateThreshold * 100) {
        // Determine severity based on duplicate percentage
        let severity: DataQualityIssueSeverity;
        
        if (duplicatePercentage >= 50) {
          severity = DataQualityIssueSeverity.MEDIUM;
        } else if (duplicatePercentage >= 25) {
          severity = DataQualityIssueSeverity.LOW;
        } else {
          severity = DataQualityIssueSeverity.LOW;
        }
        
        // Find the most common duplicated values
        const duplicateValues = Object.entries(stats.distribution || {})
          .filter(([value, count]) => value !== 'null' && count > 1)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, count]) => ({ value, count }));
        
        issues.push({
          field,
          type: 'duplicate_values',
          description: `Field contains ${duplicatePercentage.toFixed(2)}% duplicate values`,
          severity,
          recordCount: duplicateCount,
          percentage: duplicatePercentage,
          examples: duplicateValues.map(dv => dv.value),
          suggestion: 'Consider deduplicating records or checking for data entry errors'
        });
      }
    }
  }
  
  /**
   * Check for outliers
   */
  private checkOutliers(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    const outlierStdDevs = options.outlierStdDevs || 3;
    
    for (const field of fields) {
      const stats = fieldStats[field];
      
      // Skip non-numeric fields
      if (stats.dataType !== 'number' || stats.min === undefined || stats.max === undefined || stats.avg === undefined || stats.stdDev === undefined) {
        continue;
      }
      
      // Calculate outlier thresholds
      const lowerThreshold = stats.avg - (outlierStdDevs * stats.stdDev);
      const upperThreshold = stats.avg + (outlierStdDevs * stats.stdDev);
      
      // Find outliers
      const outliers = data.filter(record => {
        const value = record[field];
        return value !== null && value !== undefined && (value < lowerThreshold || value > upperThreshold);
      });
      
      if (outliers.length > 0) {
        const outlierPercentage = (outliers.length / stats.count) * 100;
        
        // Determine severity based on outlier percentage
        let severity: DataQualityIssueSeverity;
        
        if (outlierPercentage >= 10) {
          severity = DataQualityIssueSeverity.HIGH;
        } else if (outlierPercentage >= 5) {
          severity = DataQualityIssueSeverity.MEDIUM;
        } else {
          severity = DataQualityIssueSeverity.LOW;
        }
        
        issues.push({
          field,
          type: 'outliers',
          description: `Field contains ${outliers.length} outliers (${outlierPercentage.toFixed(2)}% of values)`,
          severity,
          recordCount: outliers.length,
          percentage: outlierPercentage,
          examples: outliers.map(record => record[field]).slice(0, options.maxExamples || 5),
          suggestion: 'Check for data entry errors or consider normalizing the data'
        });
      }
    }
  }
  
  /**
   * Check for inconsistent formats
   */
  private checkFormats(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    for (const field of fields) {
      const stats = fieldStats[field];
      
      // Skip non-string fields
      if (stats.dataType !== 'string') {
        continue;
      }
      
      // Get expected pattern if specified
      const expectedPattern = options.expectedPatterns?.[field];
      
      // Check string patterns
      const nonNullValues = data
        .filter(record => record[field] !== null && record[field] !== undefined)
        .map(record => String(record[field]));
      
      // Detect patterns
      const patterns: Record<string, number> = {};
      
      for (const value of nonNullValues) {
        const pattern = this.detectPattern(value);
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      }
      
      // Store pattern distribution
      stats.patternDistribution = patterns;
      
      // Check if there are multiple patterns
      const patternCount = Object.keys(patterns).length;
      
      if (patternCount > 1) {
        // If there's an expected pattern, check against it
        if (expectedPattern) {
          const invalidValues = nonNullValues.filter(value => !expectedPattern.test(value));
          
          if (invalidValues.length > 0) {
            const invalidPercentage = (invalidValues.length / nonNullValues.length) * 100;
            
            // Determine severity based on invalid percentage
            let severity: DataQualityIssueSeverity;
            
            if (invalidPercentage >= 50) {
              severity = DataQualityIssueSeverity.CRITICAL;
            } else if (invalidPercentage >= 25) {
              severity = DataQualityIssueSeverity.HIGH;
            } else if (invalidPercentage >= 10) {
              severity = DataQualityIssueSeverity.MEDIUM;
            } else {
              severity = DataQualityIssueSeverity.LOW;
            }
            
            issues.push({
              field,
              type: 'invalid_format',
              description: `Field contains ${invalidValues.length} values (${invalidPercentage.toFixed(2)}%) that don't match the expected pattern`,
              severity,
              recordCount: invalidValues.length,
              percentage: invalidPercentage,
              examples: invalidValues.slice(0, options.maxExamples || 5),
              suggestion: 'Standardize data formats or validate data entry'
            });
          }
        } else {
          // If no expected pattern, just flag inconsistent formats
          const mainPattern = Object.entries(patterns)
            .sort((a, b) => b[1] - a[1])[0][0];
          
          const inconsistentValues = nonNullValues.filter(value => 
            this.detectPattern(value) !== mainPattern
          );
          
          if (inconsistentValues.length > 0) {
            const inconsistentPercentage = (inconsistentValues.length / nonNullValues.length) * 100;
            
            // Determine severity based on inconsistent percentage
            let severity: DataQualityIssueSeverity;
            
            if (inconsistentPercentage >= 30) {
              severity = DataQualityIssueSeverity.MEDIUM;
            } else {
              severity = DataQualityIssueSeverity.LOW;
            }
            
            issues.push({
              field,
              type: 'inconsistent_format',
              description: `Field contains ${patternCount} different formats`,
              severity,
              recordCount: inconsistentValues.length,
              percentage: inconsistentPercentage,
              examples: inconsistentValues.slice(0, options.maxExamples || 5),
              suggestion: 'Standardize data formats or validate data entry'
            });
          }
        }
      }
    }
  }
  
  /**
   * Check for expected data types
   */
  private checkExpectedTypes(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    const expectedTypes = options.expectedTypes || {};
    
    for (const field of Object.keys(expectedTypes)) {
      // Skip fields not in the dataset
      if (!fields.includes(field)) {
        continue;
      }
      
      const stats = fieldStats[field];
      const expectedType = expectedTypes[field];
      
      if (stats.dataType !== expectedType) {
        // Find values with the wrong type
        const wrongTypeValues = data
          .filter(record => {
            const value = record[field];
            
            if (value === null || value === undefined) {
              return false;
            }
            
            switch (expectedType) {
              case 'number':
                return typeof value !== 'number' && isNaN(Number(value));
                
              case 'boolean':
                return typeof value !== 'boolean' && value !== 'true' && value !== 'false';
                
              case 'date':
                return !(value instanceof Date) && isNaN(Date.parse(String(value)));
                
              case 'array':
                return !Array.isArray(value);
                
              case 'object':
                return typeof value !== 'object' || Array.isArray(value) || value === null;
                
              case 'string':
                return typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean';
                
              default:
                return true;
            }
          })
          .map(record => record[field]);
        
        const wrongTypeCount = wrongTypeValues.length;
        const wrongTypePercentage = (wrongTypeCount / stats.count) * 100;
        
        if (wrongTypeCount > 0) {
          // Determine severity based on wrong type percentage
          let severity: DataQualityIssueSeverity;
          
          if (wrongTypePercentage >= 50) {
            severity = DataQualityIssueSeverity.CRITICAL;
          } else if (wrongTypePercentage >= 25) {
            severity = DataQualityIssueSeverity.HIGH;
          } else if (wrongTypePercentage >= 10) {
            severity = DataQualityIssueSeverity.MEDIUM;
          } else {
            severity = DataQualityIssueSeverity.LOW;
          }
          
          issues.push({
            field,
            type: 'wrong_type',
            description: `Field has wrong type: expected ${expectedType}, found ${stats.dataType}`,
            severity,
            recordCount: wrongTypeCount,
            percentage: wrongTypePercentage,
            examples: wrongTypeValues.slice(0, options.maxExamples || 5),
            suggestion: `Convert values to ${expectedType} or correct data entry`
          });
        }
      }
    }
  }
  
  /**
   * Check for expected value ranges
   */
  private checkExpectedRanges(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    const expectedRanges = options.expectedRanges || {};
    
    for (const field of Object.keys(expectedRanges)) {
      // Skip fields not in the dataset
      if (!fields.includes(field)) {
        continue;
      }
      
      const stats = fieldStats[field];
      const range = expectedRanges[field];
      
      // Skip non-numeric fields
      if (stats.dataType !== 'number') {
        continue;
      }
      
      // Find out-of-range values
      const outOfRangeValues = data
        .filter(record => {
          const value = record[field];
          
          if (value === null || value === undefined) {
            return false;
          }
          
          if (typeof range.min === 'number' && value < range.min) {
            return true;
          }
          
          if (typeof range.max === 'number' && value > range.max) {
            return true;
          }
          
          return false;
        })
        .map(record => record[field]);
      
      const outOfRangeCount = outOfRangeValues.length;
      const outOfRangePercentage = (outOfRangeCount / stats.count) * 100;
      
      if (outOfRangeCount > 0) {
        // Determine severity based on out-of-range percentage
        let severity: DataQualityIssueSeverity;
        
        if (outOfRangePercentage >= 50) {
          severity = DataQualityIssueSeverity.CRITICAL;
        } else if (outOfRangePercentage >= 25) {
          severity = DataQualityIssueSeverity.HIGH;
        } else if (outOfRangePercentage >= 10) {
          severity = DataQualityIssueSeverity.MEDIUM;
        } else {
          severity = DataQualityIssueSeverity.LOW;
        }
        
        issues.push({
          field,
          type: 'out_of_range',
          description: `Field contains values outside expected range: ${
            typeof range.min === 'number' ? `min: ${range.min}` : ''
          }${
            typeof range.min === 'number' && typeof range.max === 'number' ? ', ' : ''
          }${
            typeof range.max === 'number' ? `max: ${range.max}` : ''
          }`,
          severity,
          recordCount: outOfRangeCount,
          percentage: outOfRangePercentage,
          examples: outOfRangeValues.slice(0, options.maxExamples || 5),
          suggestion: 'Check for data entry errors or update expected range'
        });
      }
    }
  }
  
  /**
   * Detect pattern in a string
   */
  private detectPattern(value: string): string {
    if (value === '') {
      return 'empty';
    }
    
    // Test for date patterns
    const datePattern = /^\d{1,4}[.\/-]\d{1,2}[.\/-]\d{1,4}$/;
    if (datePattern.test(value)) {
      return 'date';
    }
    
    // Test for email pattern
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailPattern.test(value)) {
      return 'email';
    }
    
    // Test for URL pattern
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (urlPattern.test(value)) {
      return 'url';
    }
    
    // Test for phone number pattern
    const phonePattern = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (phonePattern.test(value)) {
      return 'phone';
    }
    
    // Test for credit card pattern
    const ccPattern = /^(?:\d{4}[- ]?){3}\d{4}|\d{16}$/;
    if (ccPattern.test(value)) {
      return 'credit_card';
    }
    
    // Test for postal code pattern
    const postalPattern = /^\d{5}(?:[-\s]\d{4})?$/;
    if (postalPattern.test(value)) {
      return 'postal_code';
    }
    
    // Test for numeric pattern
    const numericPattern = /^-?\d+(?:\.\d+)?$/;
    if (numericPattern.test(value)) {
      return 'numeric';
    }
    
    // Test for alphanumeric pattern
    const alphanumericPattern = /^[a-zA-Z0-9]+$/;
    if (alphanumericPattern.test(value)) {
      return 'alphanumeric';
    }
    
    // Test for alphabetic pattern
    const alphabeticPattern = /^[a-zA-Z]+$/;
    if (alphabeticPattern.test(value)) {
      return 'alphabetic';
    }
    
    // When no specific pattern is detected
    return 'mixed';
  }
  
  /**
   * Calculate completeness score
   */
  private calculateCompletenessScore(fieldStats: Record<string, FieldStatistics>): number {
    const fields = Object.values(fieldStats);
    const fieldCount = fields.length;
    
    if (fieldCount === 0) {
      return 100; // No fields to analyze
    }
    
    const completenessSum = fields.reduce((sum, stats) => {
      const nonNullPercentage = 100 - stats.nullPercentage;
      const nonMissingPercentage = 100 - stats.missingPercentage;
      return sum + (nonNullPercentage + nonMissingPercentage) / 2;
    }, 0);
    
    return Math.round(completenessSum / fieldCount);
  }
  
  /**
   * Calculate accuracy score
   */
  private calculateAccuracyScore(issues: DataQualityIssue[]): number {
    // Filter issues that affect accuracy
    const accuracyIssues = issues.filter(issue => 
      issue.type === 'outliers' || 
      issue.type === 'wrong_type' || 
      issue.type === 'out_of_range' || 
      issue.type === 'invalid_format'
    );
    
    if (accuracyIssues.length === 0) {
      return 100; // No accuracy issues
    }
    
    // Calculate weighted score based on issue severity
    const totalWeight = accuracyIssues.reduce((sum, issue) => {
      switch (issue.severity) {
        case DataQualityIssueSeverity.CRITICAL:
          return sum + 4;
        case DataQualityIssueSeverity.HIGH:
          return sum + 3;
        case DataQualityIssueSeverity.MEDIUM:
          return sum + 2;
        case DataQualityIssueSeverity.LOW:
          return sum + 1;
        default:
          return sum;
      }
    }, 0);
    
    // Maximum possible weight (if all issues were CRITICAL)
    const maxWeight = accuracyIssues.length * 4;
    
    // Calculate score (higher weight = lower score)
    return Math.round(100 - ((totalWeight / maxWeight) * 100));
  }
  
  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(issues: DataQualityIssue[]): number {
    // Filter issues that affect consistency
    const consistencyIssues = issues.filter(issue => 
      issue.type === 'inconsistent_format'
    );
    
    if (consistencyIssues.length === 0) {
      return 100; // No consistency issues
    }
    
    // Calculate weighted score based on issue severity
    const totalWeight = consistencyIssues.reduce((sum, issue) => {
      switch (issue.severity) {
        case DataQualityIssueSeverity.CRITICAL:
          return sum + 4;
        case DataQualityIssueSeverity.HIGH:
          return sum + 3;
        case DataQualityIssueSeverity.MEDIUM:
          return sum + 2;
        case DataQualityIssueSeverity.LOW:
          return sum + 1;
        default:
          return sum;
      }
    }, 0);
    
    // Maximum possible weight (if all issues were CRITICAL)
    const maxWeight = consistencyIssues.length * 4;
    
    // Calculate score (higher weight = lower score)
    return Math.round(100 - ((totalWeight / maxWeight) * 100));
  }
  
  /**
   * Calculate uniqueness score
   */
  private calculateUniquenessScore(fieldStats: Record<string, FieldStatistics>, issues: DataQualityIssue[]): number {
    // For fields that should be unique, weight is higher
    const uniquenessIssues = issues.filter(issue => 
      issue.type === 'duplicate_values'
    );
    
    const fields = Object.values(fieldStats);
    const fieldCount = fields.length;
    
    if (fieldCount === 0) {
      return 100; // No fields to analyze
    }
    
    // Sum up uniqueness percentages for all fields
    const uniquenessSum = fields.reduce((sum, stats) => sum + stats.uniquePercentage, 0);
    
    // Calculate base score
    let score = Math.round(uniquenessSum / fieldCount);
    
    // Penalize for duplicate value issues
    if (uniquenessIssues.length > 0) {
      const penalty = uniquenessIssues.reduce((sum, issue) => {
        switch (issue.severity) {
          case DataQualityIssueSeverity.CRITICAL:
            return sum + 20;
          case DataQualityIssueSeverity.HIGH:
            return sum + 15;
          case DataQualityIssueSeverity.MEDIUM:
            return sum + 10;
          case DataQualityIssueSeverity.LOW:
            return sum + 5;
          default:
            return sum;
        }
      }, 0);
      
      score = Math.max(0, score - Math.min(penalty, score));
    }
    
    return score;
  }
  
  /**
   * Generate a summary of the analysis
   */
  private generateSummary(recordCount: number, fieldCount: number, issues: DataQualityIssue[], qualityScore: number): string {
    const criticalIssues = issues.filter(issue => issue.severity === DataQualityIssueSeverity.CRITICAL).length;
    const highIssues = issues.filter(issue => issue.severity === DataQualityIssueSeverity.HIGH).length;
    const mediumIssues = issues.filter(issue => issue.severity === DataQualityIssueSeverity.MEDIUM).length;
    const lowIssues = issues.filter(issue => issue.severity === DataQualityIssueSeverity.LOW).length;
    
    let qualityRating = '';
    
    if (qualityScore >= 90) {
      qualityRating = 'Excellent';
    } else if (qualityScore >= 75) {
      qualityRating = 'Good';
    } else if (qualityScore >= 50) {
      qualityRating = 'Fair';
    } else {
      qualityRating = 'Poor';
    }
    
    return `Analyzed ${recordCount} records across ${fieldCount} fields. Overall data quality is ${qualityRating} (${qualityScore}/100). Found ${issues.length} quality issues (${criticalIssues} critical, ${highIssues} high, ${mediumIssues} medium, ${lowIssues} low).`;
  }
  
  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: DataQualityIssue[], fieldStats: Record<string, FieldStatistics>): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations based on specific issues
    if (issues.some(issue => issue.type === 'null_values' && (issue.severity === DataQualityIssueSeverity.CRITICAL || issue.severity === DataQualityIssueSeverity.HIGH))) {
      recommendations.push('Fill in missing values for critical fields or filter out incomplete records');
    }
    
    if (issues.some(issue => issue.type === 'outliers' && (issue.severity === DataQualityIssueSeverity.CRITICAL || issue.severity === DataQualityIssueSeverity.HIGH))) {
      recommendations.push('Investigate outliers in numeric fields to identify data entry errors or genuine anomalies');
    }
    
    if (issues.some(issue => issue.type === 'inconsistent_format' || issue.type === 'invalid_format')) {
      recommendations.push('Standardize data entry formats and consider implementing validation rules');
    }
    
    if (issues.some(issue => issue.type === 'wrong_type')) {
      recommendations.push('Convert fields to their expected data types or review data collection processes');
    }
    
    if (issues.some(issue => issue.type === 'duplicate_values' && issue.percentage > 50)) {
      recommendations.push('Deduplicate records or review data collection to prevent duplicate entries');
    }
    
    if (issues.some(issue => issue.type === 'out_of_range')) {
      recommendations.push('Validate data ranges during data entry or review expected value ranges');
    }
    
    // Add general recommendations
    recommendations.push('Review data quality on a regular basis to catch issues early');
    
    if (issues.length > 10) {
      recommendations.push('Consider implementing automated data validation at the source');
    }
    
    // Make sure we have at least some recommendations
    if (recommendations.length === 0) {
      if (issues.length > 0) {
        recommendations.push('Address the identified data quality issues to improve overall data quality');
      } else {
        recommendations.push('Continue maintaining high data quality standards');
      }
    }
    
    return recommendations;
  }
}

export const dataQualityService = new DataQualityService();