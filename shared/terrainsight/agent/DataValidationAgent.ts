/**
 * Data Validation Agent
 * 
 * This agent is responsible for validating property data according to Washington State standards
 * and ensuring data quality requirements are met.
 */

import { Agent } from './Agent';
import { 
  AgentContext, 
  AgentResponse, 
  ValidationResult, 
  ValidationIssue,
  WashingtonPropertyRules
} from './types';
import { Property } from '../schema';

/**
 * Data validation severity levels
 */
export enum DataValidationSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Data validation issue types
 */
export enum DataValidationType {
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  INVALID_FORMAT = 'invalid_format',
  OUT_OF_RANGE = 'out_of_range',
  INVALID_TYPE = 'invalid_type',
  INVALID_VALUE = 'invalid_value',
  INCONSISTENT_VALUE = 'inconsistent_value',
  DUPLICATE_VALUE = 'duplicate_value'
}

/**
 * Data validation input type
 */
export interface DataValidationInput {
  /** Property data to validate */
  property: Property | Partial<Property>;
  
  /** Validation context */
  context?: {
    /** Property type */
    propertyType?: string;
    
    /** County code */
    countyCode?: string;
    
    /** Validation options */
    options?: {
      /** Whether to validate against Washington State rules */
      validateWashingtonRules?: boolean;
      
      /** Whether to validate for USPAP compliance */
      validateUSPAP?: boolean;
      
      /** Whether to validate against county-specific rules */
      validateCountyRules?: boolean;
      
      /** Whether to check for data consistency issues */
      checkConsistency?: boolean;
    };
  };
}

/**
 * Data validation output type
 */
export interface DataValidationOutput {
  /** Whether the data is valid */
  isValid: boolean;
  
  /** Validation issues */
  issues: ValidationIssue[];
  
  /** Validation score (0-100) */
  score: number;
  
  /** Validated property data */
  property: Property | Partial<Property>;
  
  /** Value confidence */
  valueConfidence?: number;
  
  /** Recommendations for improvement */
  recommendations?: string[];
}

/**
 * Data Validation Agent implementation
 */
export class DataValidationAgent extends Agent {
  /** Washington State property rules */
  private waRules: WashingtonPropertyRules;
  
  /**
   * Initialize a new Data Validation Agent
   * 
   * @param waRules Optional Washington State property rules
   */
  constructor(waRules?: WashingtonPropertyRules) {
    super(
      'data-validation-agent',
      'Data Validation Agent',
      [
        'property-data-validation',
        'data-quality-scoring',
        'schema-compliance-checking',
        'washington-state-format-validation',
        'uspap-compliance-validation'
      ]
    );
    
    // Initialize Washington State rules with defaults
    this.waRules = waRules || {
      parcelIdFormats: {
        benton: '^[0-9]{1,2}-[0-9]{5}-[0-9]{3}$',
        default: '^[0-9-]+$'
      },
      validPropertyTypes: [
        'Residential',
        'Commercial',
        'Industrial',
        'Agricultural',
        'Vacant Land',
        'Multi-Family',
        'Mixed Use'
      ],
      validZoningCodes: [
        'R-1', 'R-2', 'R-3', 'C-1', 'C-2', 'I-1', 'I-2', 'A-1', 'MU', 'PUD'
      ],
      requiredFields: {
        Residential: ['parcelId', 'address', 'owner', 'squareFeet', 'yearBuilt', 'bedrooms', 'bathrooms'],
        Commercial: ['parcelId', 'address', 'owner', 'squareFeet', 'yearBuilt', 'propertyType'],
        default: ['parcelId', 'address', 'owner']
      },
      valueRanges: {
        squareFeet: { min: 100, max: 100000 },
        lotSize: { min: 0, max: 1000000 },
        yearBuilt: { min: 1800, max: new Date().getFullYear() }
      }
    };
  }
  
  /**
   * Process a data validation request
   * 
   * @param input The validation input
   * @param context The agent context
   * @returns Validation results
   */
  async process(input: DataValidationInput, context: AgentContext): Promise<AgentResponse> {
    try {
      const startTime = Date.now();
      
      // Log the operation
      context.log('info', 'Validating property data', { 
        propertyType: input.context?.propertyType,
        countyCode: input.context?.countyCode
      });
      
      // Get the property type
      const propertyType = input.context?.propertyType || input.property.propertyType || 'default';
      const countyCode = input.context?.countyCode || 'benton';
      
      // Validation options
      const options = input.context?.options || {
        validateWashingtonRules: true,
        validateUSPAP: true,
        validateCountyRules: true,
        checkConsistency: true
      };
      
      // Perform validation
      const issues: ValidationIssue[] = [];
      
      // Check required fields
      this.validateRequiredFields(input.property, propertyType, issues);
      
      // Check parcel ID format
      if (input.property.parcelId && options.validateWashingtonRules) {
        this.validateParcelIdFormat(input.property.parcelId, countyCode, issues);
      }
      
      // Check value ranges
      this.validateValueRanges(input.property, issues);
      
      // Check property type
      if (input.property.propertyType && options.validateWashingtonRules) {
        this.validatePropertyType(input.property.propertyType, issues);
      }
      
      // Check zoning code
      if (input.property.zoning && options.validateWashingtonRules) {
        this.validateZoningCode(input.property.zoning, issues);
      }
      
      // Check consistency if enabled
      if (options.checkConsistency) {
        this.validateConsistency(input.property, issues);
      }
      
      // Calculate validation score (0-100)
      const score = this.calculateValidationScore(issues);
      
      // Generate value confidence if value is present
      let valueConfidence: number | undefined = undefined;
      if (input.property.value || input.property.estimatedValue) {
        valueConfidence = this.calculateValueConfidence(input.property, issues);
      }
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(issues);
      
      // Prepare result
      const result: DataValidationOutput = {
        isValid: issues.length === 0,
        issues,
        score,
        property: input.property,
        valueConfidence,
        recommendations
      };
      
      const executionTimeMs = Date.now() - startTime;
      
      // Create response
      return {
        status: issues.some(i => i.severity === 'CRITICAL') ? 'warning' : 'success',
        data: result,
        explanation: issues.length === 0 
          ? 'Property data validation completed successfully with no issues' 
          : `Property data validation completed with ${issues.length} issues`,
        recommendations: result.recommendations,
        metrics: {
          executionTimeMs,
          issueCount: issues.length,
          validationScore: score
        }
      };
    } catch (error) {
      context.log('error', 'Error validating property data', error);
      
      return this.createErrorResponse(
        `Error validating property data: ${error instanceof Error ? error.message : String(error)}`,
        { property: input.property },
        [{
          type: 'validation_error',
          severity: 'critical',
          message: `Error validating property data: ${error instanceof Error ? error.message : String(error)}`,
          details: error
        }]
      );
    }
  }
  
  /**
   * Validate input before processing
   * 
   * @param input The input to validate
   * @returns Validation result
   */
  async validateInput(input: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    
    // Check if input is an object
    if (!input || typeof input !== 'object') {
      issues.push({
        field: 'input',
        type: 'invalid_type',
        description: 'Input must be an object',
        severity: DataValidationSeverity.CRITICAL
      });
      return { isValid: false, issues };
    }
    
    // Check if property is present
    if (!input.property) {
      issues.push({
        field: 'property',
        type: 'missing_required_field',
        description: 'Property data is required',
        severity: DataValidationSeverity.CRITICAL
      });
      return { isValid: false, issues };
    }
    
    // Check if property is an object
    if (typeof input.property !== 'object') {
      issues.push({
        field: 'property',
        type: 'invalid_type',
        description: 'Property must be an object',
        severity: DataValidationSeverity.CRITICAL
      });
      return { isValid: false, issues };
    }
    
    // If context is present, validate it
    if (input.context !== undefined && (input.context === null || typeof input.context !== 'object')) {
      issues.push({
        field: 'context',
        type: 'invalid_type',
        description: 'Context must be an object if provided',
        severity: DataValidationSeverity.MEDIUM
      });
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      validatedData: input
    };
  }
  
  /**
   * Validate required fields
   * 
   * @param property The property to validate
   * @param propertyType The property type
   * @param issues The issues array to populate
   */
  private validateRequiredFields(
    property: Partial<Property>,
    propertyType: string,
    issues: ValidationIssue[]
  ): void {
    // Get required fields for this property type
    const requiredFields = this.waRules.requiredFields[propertyType] || this.waRules.requiredFields.default;
    
    // Check each required field
    for (const field of requiredFields) {
      if (property[field as keyof Partial<Property>] === undefined || 
          property[field as keyof Partial<Property>] === null ||
          property[field as keyof Partial<Property>] === '') {
        issues.push({
          field,
          type: DataValidationType.MISSING_REQUIRED_FIELD,
          description: `Missing required field: ${field}`,
          severity: DataValidationSeverity.HIGH,
          remediation: `Provide a value for the ${field} field`
        });
      }
    }
  }
  
  /**
   * Validate parcel ID format
   * 
   * @param parcelId The parcel ID to validate
   * @param countyCode The county code
   * @param issues The issues array to populate
   */
  private validateParcelIdFormat(
    parcelId: string,
    countyCode: string,
    issues: ValidationIssue[]
  ): void {
    const parcelIdFormat = this.waRules.parcelIdFormats[countyCode] || this.waRules.parcelIdFormats.default;
    const regex = new RegExp(parcelIdFormat);
    
    if (!regex.test(parcelId)) {
      issues.push({
        field: 'parcelId',
        type: DataValidationType.INVALID_FORMAT,
        description: `Parcel ID format does not match ${countyCode} county format`,
        severity: DataValidationSeverity.HIGH,
        remediation: `Update to match format: ${parcelIdFormat}`
      });
    }
  }
  
  /**
   * Validate value ranges
   * 
   * @param property The property to validate
   * @param issues The issues array to populate
   */
  private validateValueRanges(
    property: Partial<Property>,
    issues: ValidationIssue[]
  ): void {
    // Check square feet
    if (property.squareFeet !== undefined) {
      const squareFeetRange = this.waRules.valueRanges.squareFeet;
      if (property.squareFeet < squareFeetRange.min || property.squareFeet > squareFeetRange.max) {
        issues.push({
          field: 'squareFeet',
          type: DataValidationType.OUT_OF_RANGE,
          description: `Square feet (${property.squareFeet}) is outside the valid range (${squareFeetRange.min}-${squareFeetRange.max})`,
          severity: DataValidationSeverity.MEDIUM,
          remediation: `Verify the square footage value`
        });
      }
    }
    
    // Check lot size
    if (property.lotSize !== undefined) {
      const lotSizeRange = this.waRules.valueRanges.lotSize;
      if (property.lotSize < lotSizeRange.min || property.lotSize > lotSizeRange.max) {
        issues.push({
          field: 'lotSize',
          type: DataValidationType.OUT_OF_RANGE,
          description: `Lot size (${property.lotSize}) is outside the valid range (${lotSizeRange.min}-${lotSizeRange.max})`,
          severity: DataValidationSeverity.MEDIUM,
          remediation: `Verify the lot size value`
        });
      }
    }
    
    // Check year built
    if (property.yearBuilt !== undefined) {
      const yearBuiltRange = this.waRules.valueRanges.yearBuilt;
      if (property.yearBuilt < yearBuiltRange.min || property.yearBuilt > yearBuiltRange.max) {
        issues.push({
          field: 'yearBuilt',
          type: DataValidationType.OUT_OF_RANGE,
          description: `Year built (${property.yearBuilt}) is outside the valid range (${yearBuiltRange.min}-${yearBuiltRange.max})`,
          severity: DataValidationSeverity.MEDIUM,
          remediation: `Verify the year built value`
        });
      }
    }
  }
  
  /**
   * Validate property type
   * 
   * @param propertyType The property type to validate
   * @param issues The issues array to populate
   */
  private validatePropertyType(
    propertyType: string,
    issues: ValidationIssue[]
  ): void {
    if (!this.waRules.validPropertyTypes.includes(propertyType)) {
      issues.push({
        field: 'propertyType',
        type: DataValidationType.INVALID_VALUE,
        description: `Property type (${propertyType}) is not a valid Washington State property type`,
        severity: DataValidationSeverity.MEDIUM,
        remediation: `Use one of the valid property types: ${this.waRules.validPropertyTypes.join(', ')}`
      });
    }
  }
  
  /**
   * Validate zoning code
   * 
   * @param zoning The zoning code to validate
   * @param issues The issues array to populate
   */
  private validateZoningCode(
    zoning: string,
    issues: ValidationIssue[]
  ): void {
    if (!this.waRules.validZoningCodes.includes(zoning)) {
      issues.push({
        field: 'zoning',
        type: DataValidationType.INVALID_VALUE,
        description: `Zoning code (${zoning}) is not a valid Washington State zoning code`,
        severity: DataValidationSeverity.LOW,
        remediation: `Use one of the valid zoning codes: ${this.waRules.validZoningCodes.join(', ')}`
      });
    }
  }
  
  /**
   * Validate data consistency
   * 
   * @param property The property to validate
   * @param issues The issues array to populate
   */
  private validateConsistency(
    property: Partial<Property>,
    issues: ValidationIssue[]
  ): void {
    // Check if property type is consistent with bedrooms/bathrooms
    if (property.propertyType && property.propertyType !== 'Residential' &&
        property.propertyType !== 'Multi-Family' &&
        (property.bedrooms !== undefined && property.bedrooms !== null) || (property.bathrooms !== undefined && property.bathrooms !== null)) {
      // Check only if bedrooms/bathrooms actually have values, not just if they are defined
      if ((property.bedrooms !== undefined && property.bedrooms !== null && property.bedrooms > 0) ||
          (property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms > 0)) {
            issues.push({
              field: 'propertyType',
              type: DataValidationType.INCONSISTENT_VALUE,
              description: `Non-residential property type (${property.propertyType}) has bedroom/bathroom data`,
              severity: DataValidationSeverity.LOW,
              remediation: `Verify the property type or remove bedroom/bathroom data for non-residential properties`
            });
      }
    }

    // Check if value and estimated value are consistent
    if (property.value !== undefined && property.value !== null &&
        property.estimatedValue !== undefined && property.estimatedValue !== null &&
        typeof property.estimatedValue === 'number') { // Ensure estimatedValue is a number

      const valueStr = String(property.value); // Ensure value is a string for parseFloat
      const valueNum = parseFloat(valueStr);

      // Check if parsing was successful and values are numeric and valueNum is not zero
      if (!isNaN(valueNum) && valueNum !== 0) {
        const diff = Math.abs(valueNum - property.estimatedValue);
        // Check consistency only if valueNum is not zero to avoid division by zero
        if (diff / valueNum > 0.3) {
          issues.push({
            field: 'value',
            type: DataValidationType.INCONSISTENT_VALUE,
            description: `Value (${property.value}) differs significantly from estimated value (${property.estimatedValue}) by more than 30%`,
            severity: DataValidationSeverity.MEDIUM,
            remediation: `Verify both value and estimated value for consistency`
          });
        }
      } else if (isNaN(valueNum)) {
         issues.push({
            field: 'value',
            type: DataValidationType.INVALID_TYPE,
            description: `Value (${property.value}) is not a valid number`,
            severity: DataValidationSeverity.MEDIUM,
            remediation: `Ensure the value field contains a valid number`
          });
      }
    }

    // Check if price per sq ft is consistent with value and square feet
    if (property.value !== undefined && property.value !== null &&
        property.squareFeet !== undefined && property.squareFeet !== null && typeof property.squareFeet === 'number' && property.squareFeet > 0 && // Ensure sqft is positive number
        property.pricePerSqFt !== undefined && property.pricePerSqFt !== null) {

      const valueStr = String(property.value);
      const pricePerSqFtStr = String(property.pricePerSqFt);
      const valueNum = parseFloat(valueStr);
      const pricePerSqFtNum = parseFloat(pricePerSqFtStr);

      // Check if parsing was successful, values are numeric, and pricePerSqFtNum is not zero
      if (!isNaN(valueNum) && !isNaN(pricePerSqFtNum) && pricePerSqFtNum !== 0) {
        // squareFeet is already checked for > 0
        const calculatedPricePerSqFt = valueNum / property.squareFeet;
        const diff = Math.abs(calculatedPricePerSqFt - pricePerSqFtNum);

        // Check consistency only if pricePerSqFtNum is not zero
        if (diff / pricePerSqFtNum > 0.05) { // Use 5% threshold
          issues.push({
            field: 'pricePerSqFt',
            type: DataValidationType.INCONSISTENT_VALUE,
            description: `Price per sq ft (${property.pricePerSqFt}) is inconsistent with value (${property.value}) and square feet (${property.squareFeet}) by more than 5%`,
            severity: DataValidationSeverity.LOW,
            remediation: `Recalculate price per sq ft as value divided by square feet, or verify source data`
          });
        }
      } else if (isNaN(valueNum)) {
         issues.push({
            field: 'value',
            type: DataValidationType.INVALID_TYPE,
            description: `Value (${property.value}) used in price/sqft calculation is not a valid number`,
            severity: DataValidationSeverity.MEDIUM,
            remediation: `Ensure the value field contains a valid number`
          });
      } else if (isNaN(pricePerSqFtNum)) {
         issues.push({
            field: 'pricePerSqFt',
            type: DataValidationType.INVALID_TYPE,
            description: `Price per sq ft (${property.pricePerSqFt}) is not a valid number`,
            severity: DataValidationSeverity.MEDIUM,
            remediation: `Ensure the pricePerSqFt field contains a valid number`
          });
      }
    }
  }
  
  /**
   * Calculate validation score (0-100)
   * 
   * @param issues The validation issues
   * @returns Score from 0 to 100
   */
  private calculateValidationScore(issues: ValidationIssue[]): number {
    // Base score
    let score = 100;
    
    // Calculate deductions based on issue severity
    for (const issue of issues) {
      switch (issue.severity) {
        case DataValidationSeverity.CRITICAL:
          score -= 25;
          break;
        case DataValidationSeverity.HIGH:
          score -= 10;
          break;
        case DataValidationSeverity.MEDIUM:
          score -= 5;
          break;
        case DataValidationSeverity.LOW:
          score -= 2;
          break;
      }
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate value confidence (0-100)
   * 
   * @param property The property to validate
   * @param issues The validation issues
   * @returns Value confidence from 0 to 100
   */
  private calculateValueConfidence(property: Partial<Property>, issues: ValidationIssue[]): number {
    // Base confidence
    let confidence = 80;
    
    // Increase confidence based on available data
    if (property.squareFeet !== undefined) confidence += 2;
    if (property.yearBuilt !== undefined) confidence += 2;
    if (property.landValue !== undefined) confidence += 2;
    if (property.bedrooms !== undefined) confidence += 1;
    if (property.bathrooms !== undefined) confidence += 1;
    if (property.lotSize !== undefined) confidence += 2;
    if (property.lastSaleDate !== undefined) confidence += 5;
    if (property.salePrice !== undefined) confidence += 5;
    
    // Decrease confidence based on issues
    for (const issue of issues) {
      switch (issue.severity) {
        case DataValidationSeverity.CRITICAL:
          confidence -= 20;
          break;
        case DataValidationSeverity.HIGH:
          confidence -= 10;
          break;
        case DataValidationSeverity.MEDIUM:
          confidence -= 5;
          break;
        case DataValidationSeverity.LOW:
          confidence -= 2;
          break;
      }
    }
    
    // Ensure confidence is between 0 and 100
    return Math.max(0, Math.min(100, confidence));
  }
  
  /**
   * Generate recommendations based on validation issues
   * 
   * @param issues The validation issues
   * @returns Array of recommendations
   */
  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];
    
    // Group issues by type
    const issuesByType: Record<string, ValidationIssue[]> = {};
    for (const issue of issues) {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    }
    
    // Generate recommendations based on issue types
    if (issuesByType[DataValidationType.MISSING_REQUIRED_FIELD]) {
      recommendations.push(
        'Add missing required fields: ' + 
        issuesByType[DataValidationType.MISSING_REQUIRED_FIELD]
          .map(issue => issue.field)
          .join(', ')
      );
    }
    
    if (issuesByType[DataValidationType.INVALID_FORMAT]) {
      recommendations.push(
        'Fix format issues in these fields: ' + 
        issuesByType[DataValidationType.INVALID_FORMAT]
          .map(issue => issue.field)
          .join(', ')
      );
    }
    
    if (issuesByType[DataValidationType.OUT_OF_RANGE]) {
      recommendations.push(
        'Verify out-of-range values in these fields: ' + 
        issuesByType[DataValidationType.OUT_OF_RANGE]
          .map(issue => issue.field)
          .join(', ')
      );
    }
    
    if (issuesByType[DataValidationType.INVALID_VALUE]) {
      recommendations.push(
        'Correct invalid values in these fields: ' + 
        issuesByType[DataValidationType.INVALID_VALUE]
          .map(issue => issue.field)
          .join(', ')
      );
    }
    
    if (issuesByType[DataValidationType.INCONSISTENT_VALUE]) {
      recommendations.push(
        'Resolve data consistency issues between related fields'
      );
    }
    
    // Add general recommendation if there are issues
    if (issues.length > 0) {
      recommendations.push(
        'Review all validation issues and correct them to ensure data quality and compliance with Washington State standards'
      );
    }
    
    return recommendations;
  }
}